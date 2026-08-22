import { createUserMessage, isTokenDelta, } from '@deepseek-ai/dsh-llm';
import { classifyProbeFailure } from "./failure.js";
import { redactMessage } from "./redact.js";
function probeModalities(value) {
    if (value === undefined)
        return undefined;
    const declared = new Set(value);
    return ['text', 'image'].filter(entry => declared.has(entry));
}
function elapsed(now, startedAt) {
    return Math.max(0, Math.round(now() - startedAt));
}
async function withTimeout(operation, timeoutMs, message) {
    let timer;
    try {
        return await Promise.race([
            operation,
            new Promise((_resolve, reject) => {
                timer = setTimeout(() => { reject(new Error(message)); }, timeoutMs);
            }),
        ]);
    }
    finally {
        if (timer !== undefined)
            clearTimeout(timer);
    }
}
function asRecord(value) {
    return typeof value === 'object' && value !== null ? value : undefined;
}
function normalizeFailure(error, maxLength) {
    const outer = asRecord(error);
    const nested = asRecord(outer?.failure);
    const value = nested ?? outer;
    const rawMessage = typeof value?.message === 'string'
        ? value.message
        : error instanceof Error
            ? error.message
            : String(error);
    const code = typeof value?.code === 'string' && value.code.length > 0
        ? value.code
        : error instanceof Error && error.name.length > 0
            ? error.name.toUpperCase()
            : 'UNKNOWN';
    const status = typeof value?.status === 'number' && Number.isInteger(value.status)
        ? value.status
        : undefined;
    const requestId = typeof value?.requestId === 'string' && value.requestId.length > 0
        ? value.requestId
        : undefined;
    const failure = {
        code,
        message: redactMessage(rawMessage, maxLength) || 'Provider request failed',
        ...(status === undefined ? {} : { status }),
        ...(requestId === undefined ? {} : { requestId }),
    };
    return { ...failure, category: classifyProbeFailure(failure) };
}
function knownFailure(code, message) {
    const failure = { code, message };
    return { ...failure, category: classifyProbeFailure(failure) };
}
function failureResult(request, totalMs, failure) {
    return {
        status: 'failure',
        provider: request.provider,
        model: request.model,
        totalMs,
        failure,
    };
}
function nextWithSignal(iterator, signal) {
    if (signal.aborted)
        return Promise.reject(signal.reason ?? new Error('Operation aborted'));
    return new Promise((resolve, reject) => {
        const onAbort = () => {
            signal.removeEventListener('abort', onAbort);
            reject(signal.reason ?? new Error('Operation aborted'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
        void iterator.next().then((value) => {
            signal.removeEventListener('abort', onAbort);
            resolve(value);
        }, (error) => {
            signal.removeEventListener('abort', onAbort);
            reject(error);
        });
    });
}
export class ProbeRunner {
    llm;
    config;
    now;
    active = false;
    constructor(llm, config, now = () => performance.now()) {
        this.llm = llm;
        this.config = config;
        this.now = now;
    }
    async catalog() {
        const providers = this.llm.listProviders();
        const entries = await Promise.all(providers.map(async (provider) => {
            try {
                const discovered = await withTimeout(this.llm.listModels(provider.id), this.config.timeoutMs, `Model catalog did not respond within ${String(this.config.timeoutMs)} ms`);
                const seen = new Set();
                const models = discovered.flatMap((model) => {
                    if (seen.has(model.id))
                        return [];
                    seen.add(model.id);
                    const inputModalities = probeModalities(model.inputModalities);
                    return [{
                            id: model.id,
                            name: model.name,
                            ...(model.description === undefined ? {} : { description: model.description }),
                            ...(inputModalities === undefined ? {} : { inputModalities }),
                        }];
                });
                return { id: provider.id, name: provider.name, models };
            }
            catch (error) {
                return {
                    id: provider.id,
                    name: provider.name,
                    models: [],
                    modelListError: normalizeFailure(error, this.config.maxMessageLength).message,
                };
            }
        }));
        return {
            providers: entries,
            limits: {
                timeoutMs: this.config.timeoutMs,
                maxTokens: this.config.maxTokens,
            },
        };
    }
    async probe(request, callerSignal) {
        const normalized = { provider: request.provider.trim(), model: request.model.trim() };
        if (normalized.provider.length === 0 || normalized.model.length === 0) {
            return failureResult(normalized, 0, {
                ...knownFailure('INVALID_REQUEST', 'Provider and model are required'),
            });
        }
        if (this.active) {
            return failureResult(normalized, 0, {
                ...knownFailure('BUSY', 'Another provider probe is already running'),
            });
        }
        this.active = true;
        const startedAt = this.now();
        const timeout = new AbortController();
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            timeout.abort(new Error('Provider probe timed out'));
        }, this.config.timeoutMs);
        const signal = AbortSignal.any([callerSignal, timeout.signal]);
        let iterator;
        try {
            const stream = this.llm.stream({
                provider: normalized.provider,
                model: normalized.model,
                messages: [createUserMessage({
                        content: [{ type: 'text', text: 'Reply with OK.' }],
                        source: { kind: 'plugin', plugin: 'dsh-provider-probe' },
                    })],
                system: 'This is a connectivity check. Reply only with OK.',
                maxTokens: this.config.maxTokens,
                signal,
            });
            iterator = stream[Symbol.asyncIterator]();
            let firstTokenMs = null;
            let usage;
            let finish;
            while (true) {
                const step = await nextWithSignal(iterator, signal);
                if (step.done)
                    break;
                const chunk = step.value;
                if (firstTokenMs === null && isTokenDelta(chunk))
                    firstTokenMs = elapsed(this.now, startedAt);
                if (chunk.type === 'usage')
                    usage = chunk.usage;
                if (chunk.type === 'finish') {
                    finish = chunk;
                    break;
                }
            }
            const totalMs = elapsed(this.now, startedAt);
            if (finish === undefined) {
                return failureResult(normalized, totalMs, {
                    ...knownFailure('INCOMPLETE_STREAM', 'Provider stream ended without a finish event'),
                });
            }
            if (finish.reason.kind === 'error' || finish.reason.kind === 'aborted') {
                const failure = timedOut
                    ? knownFailure('TIMEOUT', `Provider did not finish within ${String(this.config.timeoutMs)} ms`)
                    : normalizeFailure(finish.reason.failure, this.config.maxMessageLength);
                return failureResult(normalized, totalMs, failure);
            }
            return {
                status: 'success',
                provider: normalized.provider,
                model: normalized.model,
                firstTokenMs,
                totalMs,
                finishReason: finish.reason.kind,
                ...(usage === undefined ? {} : { usage }),
            };
        }
        catch (error) {
            const totalMs = elapsed(this.now, startedAt);
            if (timedOut) {
                return failureResult(normalized, totalMs, {
                    ...knownFailure('TIMEOUT', `Provider did not finish within ${String(this.config.timeoutMs)} ms`),
                });
            }
            if (callerSignal.aborted) {
                return failureResult(normalized, totalMs, {
                    ...knownFailure('CANCELLED', 'Provider probe was cancelled'),
                });
            }
            return failureResult(normalized, totalMs, normalizeFailure(error, this.config.maxMessageLength));
        }
        finally {
            clearTimeout(timer);
            if (iterator?.return !== undefined)
                void iterator.return().catch(() => undefined);
            this.active = false;
        }
    }
}
