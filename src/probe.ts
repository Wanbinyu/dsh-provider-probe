import {
  createUserMessage,
  isTokenDelta,
  type LlmFailure,
  type LlmRuntime,
  type StreamChunk,
  type TokenUsage,
} from '@deepseek-ai/dsh-llm'
import { redactMessage } from './redact.ts'
import type {
  ProbeCatalog,
  ProbeFailure,
  ProbeFailureResult,
  ProbeInputModality,
  ProbeProvider,
  ProbeRequest,
  ProbeResult,
  ProviderProbeConfig,
} from './types.ts'

type LlmPort = Pick<LlmRuntime, 'listModels' | 'listProviders' | 'stream'>

function probeModalities(value: readonly string[] | undefined): readonly ProbeInputModality[] | undefined {
  if (value === undefined) return undefined
  const declared = new Set(value)
  return (['text', 'image'] as const).filter(entry => declared.has(entry))
}

function elapsed(now: () => number, startedAt: number): number {
  return Math.max(0, Math.round(now() - startedAt))
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined
}

function normalizeFailure(error: unknown, maxLength: number): ProbeFailure {
  const outer = asRecord(error)
  const nested = asRecord(outer?.failure)
  const value = nested ?? outer
  const rawMessage = typeof value?.message === 'string'
    ? value.message
    : error instanceof Error
      ? error.message
      : String(error)
  const code = typeof value?.code === 'string' && value.code.length > 0
    ? value.code
    : error instanceof Error && error.name.length > 0
      ? error.name.toUpperCase()
      : 'UNKNOWN'
  const status = typeof value?.status === 'number' && Number.isInteger(value.status)
    ? value.status
    : undefined
  const requestId = typeof value?.requestId === 'string' && value.requestId.length > 0
    ? value.requestId
    : undefined
  return {
    code,
    message: redactMessage(rawMessage, maxLength) || 'Provider request failed',
    ...(status === undefined ? {} : { status }),
    ...(requestId === undefined ? {} : { requestId }),
  }
}

function failureResult(
  request: ProbeRequest,
  totalMs: number,
  failure: ProbeFailure,
): ProbeFailureResult {
  return {
    status: 'failure',
    provider: request.provider,
    model: request.model,
    totalMs,
    failure,
  }
}

function nextWithSignal<T>(iterator: AsyncIterator<T>, signal: AbortSignal): Promise<IteratorResult<T>> {
  if (signal.aborted) return Promise.reject(signal.reason ?? new Error('Operation aborted'))
  return new Promise((resolve, reject) => {
    const onAbort = (): void => {
      signal.removeEventListener('abort', onAbort)
      reject(signal.reason ?? new Error('Operation aborted'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    void iterator.next().then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

export class ProbeRunner {
  private active = false

  constructor(
    private readonly llm: LlmPort,
    private readonly config: ProviderProbeConfig,
    private readonly now: () => number = () => performance.now(),
  ) {}

  async catalog(): Promise<ProbeCatalog> {
    const providers = this.llm.listProviders()
    const entries = await Promise.all(providers.map(async (provider): Promise<ProbeProvider> => {
      try {
        const discovered = await this.llm.listModels(provider.id)
        const seen = new Set<string>()
        const models = discovered.flatMap((model) => {
          if (seen.has(model.id)) return []
          seen.add(model.id)
          const inputModalities = probeModalities(model.inputModalities)
          return [{
            id: model.id,
            name: model.name,
            ...(model.description === undefined ? {} : { description: model.description }),
            ...(inputModalities === undefined ? {} : { inputModalities }),
          }]
        })
        return { id: provider.id, name: provider.name, models }
      } catch (error) {
        return {
          id: provider.id,
          name: provider.name,
          models: [],
          modelListError: normalizeFailure(error, this.config.maxMessageLength).message,
        }
      }
    }))
    return {
      providers: entries,
      limits: {
        timeoutMs: this.config.timeoutMs,
        maxTokens: this.config.maxTokens,
      },
    }
  }

  async probe(request: ProbeRequest, callerSignal: AbortSignal): Promise<ProbeResult> {
    const normalized = { provider: request.provider.trim(), model: request.model.trim() }
    if (normalized.provider.length === 0 || normalized.model.length === 0) {
      return failureResult(normalized, 0, {
        code: 'INVALID_REQUEST',
        message: 'Provider and model are required',
      })
    }
    if (this.active) {
      return failureResult(normalized, 0, {
        code: 'BUSY',
        message: 'Another provider probe is already running',
      })
    }

    this.active = true
    const startedAt = this.now()
    const timeout = new AbortController()
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      timeout.abort(new Error('Provider probe timed out'))
    }, this.config.timeoutMs)
    const signal = AbortSignal.any([callerSignal, timeout.signal])
    let iterator: AsyncIterator<StreamChunk> | undefined

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
      })
      iterator = stream[Symbol.asyncIterator]()
      let firstTokenMs: number | null = null
      let usage: TokenUsage | undefined
      let finish: Extract<StreamChunk, { type: 'finish' }> | undefined

      while (true) {
        const step = await nextWithSignal(iterator, signal)
        if (step.done) break
        const chunk = step.value
        if (firstTokenMs === null && isTokenDelta(chunk)) firstTokenMs = elapsed(this.now, startedAt)
        if (chunk.type === 'usage') usage = chunk.usage
        if (chunk.type === 'finish') {
          finish = chunk
          break
        }
      }

      const totalMs = elapsed(this.now, startedAt)
      if (finish === undefined) {
        return failureResult(normalized, totalMs, {
          code: 'INCOMPLETE_STREAM',
          message: 'Provider stream ended without a finish event',
        })
      }
      if (finish.reason.kind === 'error' || finish.reason.kind === 'aborted') {
        const failure = timedOut
          ? { code: 'TIMEOUT', message: `Provider did not finish within ${String(this.config.timeoutMs)} ms` }
          : normalizeFailure(finish.reason.failure satisfies LlmFailure, this.config.maxMessageLength)
        return failureResult(normalized, totalMs, failure)
      }
      return {
        status: 'success',
        provider: normalized.provider,
        model: normalized.model,
        firstTokenMs,
        totalMs,
        finishReason: finish.reason.kind,
        ...(usage === undefined ? {} : { usage }),
      }
    } catch (error) {
      const totalMs = elapsed(this.now, startedAt)
      if (timedOut) {
        return failureResult(normalized, totalMs, {
          code: 'TIMEOUT',
          message: `Provider did not finish within ${String(this.config.timeoutMs)} ms`,
        })
      }
      if (callerSignal.aborted) {
        return failureResult(normalized, totalMs, {
          code: 'CANCELLED',
          message: 'Provider probe was cancelled',
        })
      }
      return failureResult(normalized, totalMs, normalizeFailure(error, this.config.maxMessageLength))
    } finally {
      clearTimeout(timer)
      if (iterator?.return !== undefined) void iterator.return().catch(() => undefined)
      this.active = false
    }
  }
}
