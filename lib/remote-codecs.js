function invalid(subject) {
    throw new TypeError(`provider-probe Remote rejected ${subject}`);
}
function record(value, subject) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
        return invalid(subject);
    return value;
}
function string(value, subject) {
    if (typeof value !== 'string')
        return invalid(subject);
    return value;
}
function finiteNumber(value, subject) {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return invalid(subject);
    return value;
}
function nonnegativeNumber(value, subject) {
    const parsed = finiteNumber(value, subject);
    if (parsed < 0)
        return invalid(subject);
    return parsed;
}
function positiveInteger(value, subject) {
    const parsed = finiteNumber(value, subject);
    if (!Number.isInteger(parsed) || parsed <= 0)
        return invalid(subject);
    return parsed;
}
function optionalString(value, subject) {
    return value === undefined ? undefined : string(value, subject);
}
function model(value, subject) {
    const item = record(value, subject);
    const description = optionalString(item.description, `${subject}.description`);
    return {
        id: string(item.id, `${subject}.id`),
        name: string(item.name, `${subject}.name`),
        ...(description === undefined ? {} : { description }),
    };
}
function provider(value, subject) {
    const item = record(value, subject);
    if (!Array.isArray(item.models))
        return invalid(`${subject}.models`);
    const modelListError = optionalString(item.modelListError, `${subject}.modelListError`);
    return {
        id: string(item.id, `${subject}.id`),
        name: string(item.name, `${subject}.name`),
        models: item.models.map((entry, index) => model(entry, `${subject}.models[${String(index)}]`)),
        ...(modelListError === undefined ? {} : { modelListError }),
    };
}
function failure(value, subject) {
    const item = record(value, subject);
    const status = item.status === undefined ? undefined : finiteNumber(item.status, `${subject}.status`);
    if (status !== undefined && !Number.isInteger(status))
        return invalid(`${subject}.status`);
    const requestId = optionalString(item.requestId, `${subject}.requestId`);
    return {
        code: string(item.code, `${subject}.code`),
        message: string(item.message, `${subject}.message`),
        ...(status === undefined ? {} : { status }),
        ...(requestId === undefined ? {} : { requestId }),
    };
}
function usage(value) {
    const item = record(value, 'result.usage');
    const optionalNumber = (key) => {
        const candidate = item[key];
        return candidate === undefined ? undefined : nonnegativeNumber(candidate, `result.usage.${key}`);
    };
    const cacheReadTokens = optionalNumber('cacheReadTokens');
    const cacheWriteTokens = optionalNumber('cacheWriteTokens');
    const reasoningTokens = optionalNumber('reasoningTokens');
    return {
        inputTokens: nonnegativeNumber(item.inputTokens, 'result.usage.inputTokens'),
        outputTokens: nonnegativeNumber(item.outputTokens, 'result.usage.outputTokens'),
        ...(cacheReadTokens === undefined ? {} : { cacheReadTokens }),
        ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
        ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
    };
}
export const ProbeRequestCodec = {
    parse(value) {
        const item = record(value, 'request');
        const providerId = string(item.provider, 'request.provider').trim();
        const modelId = string(item.model, 'request.model').trim();
        if (providerId.length === 0 || providerId.length > 200)
            return invalid('request.provider');
        if (modelId.length === 0 || modelId.length > 300)
            return invalid('request.model');
        return { provider: providerId, model: modelId };
    },
};
export const ProbeCatalogCodec = {
    parse(value) {
        const item = record(value, 'catalog');
        if (!Array.isArray(item.providers))
            return invalid('catalog.providers');
        const limits = record(item.limits, 'catalog.limits');
        return {
            providers: item.providers.map((entry, index) => provider(entry, `catalog.providers[${String(index)}]`)),
            limits: {
                timeoutMs: positiveInteger(limits.timeoutMs, 'catalog.limits.timeoutMs'),
                maxTokens: positiveInteger(limits.maxTokens, 'catalog.limits.maxTokens'),
            },
        };
    },
};
export const ProbeResultCodec = {
    parse(value) {
        const item = record(value, 'result');
        const status = string(item.status, 'result.status');
        const common = {
            provider: string(item.provider, 'result.provider'),
            model: string(item.model, 'result.model'),
            totalMs: nonnegativeNumber(item.totalMs, 'result.totalMs'),
        };
        if (status === 'failure') {
            return { status, ...common, failure: failure(item.failure, 'result.failure') };
        }
        if (status !== 'success')
            return invalid('result.status');
        const firstTokenMs = item.firstTokenMs === null
            ? null
            : nonnegativeNumber(item.firstTokenMs, 'result.firstTokenMs');
        return {
            status,
            ...common,
            firstTokenMs,
            finishReason: string(item.finishReason, 'result.finishReason'),
            ...(item.usage === undefined ? {} : { usage: usage(item.usage) }),
        };
    },
};
