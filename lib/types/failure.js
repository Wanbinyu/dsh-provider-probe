const CODE_GROUPS = [
    ['cancelled', new Set(['ABORTED', 'CANCELED', 'CANCELLED'])],
    ['busy', new Set(['BUSY'])],
    ['invalid_request', new Set(['BAD_REQUEST', 'INVALID_ARGUMENT', 'INVALID_REQUEST', 'VALIDATION_ERROR'])],
    ['credentials', new Set([
            'AUTH', 'AUTHENTICATION_ERROR', 'INVALID_API_KEY', 'MISSING_API_KEY', 'MISSING_CREDENTIAL',
            'MISSING_CREDENTIALS', 'NO_API_KEY', 'NO_CREDENTIALS', 'UNAUTHORIZED',
        ])],
    ['permission', new Set(['ACCESS_DENIED', 'FORBIDDEN', 'PERMISSION_DENIED'])],
    ['model_or_endpoint', new Set(['MODEL_NOT_FOUND', 'NOT_FOUND', 'UNKNOWN_MODEL'])],
    ['rate_limit_or_quota', new Set([
            'BILLING_ERROR', 'INSUFFICIENT_QUOTA', 'PAYMENT_REQUIRED', 'QUOTA_EXCEEDED', 'RATE_LIMITED', 'RATE_LIMIT_ERROR',
        ])],
    ['timeout', new Set(['DEADLINE_EXCEEDED', 'ETIMEDOUT', 'TIMEOUT'])],
    ['network', new Set([
            'ECONNREFUSED', 'ECONNRESET', 'ENETUNREACH', 'ENOTFOUND', 'EPIPE', 'NETWORK_ERROR', 'TLS_ERROR',
        ])],
    ['stream_compatibility', new Set(['INCOMPLETE_STREAM', 'INVALID_SSE', 'STREAM_ERROR', 'STREAM_PARSE_ERROR'])],
];
export const FAILURE_ADVICE_EN = {
    credentials: 'Check that the provider API key is configured, current, and belongs to the selected endpoint.',
    permission: 'Check model access and account or project permissions for this API key.',
    model_or_endpoint: 'Verify the provider base URL and model ID, then refresh the model catalog.',
    rate_limit_or_quota: "Check rate limits, quota, and billing status, then retry after the provider's reset window.",
    timeout: 'Check provider availability and network latency, or increase timeoutMs for consistently slow endpoints.',
    network: 'Check DNS, proxy, firewall, TLS certificates, and whether the provider base URL is reachable.',
    stream_compatibility: "Check that the endpoint returns the streaming or SSE format expected by its DSH adapter; try the provider's native endpoint.",
    provider_server: 'Retry later and use the request ID when contacting the provider if the error persists.',
    invalid_request: 'Choose a provider and valid model ID, then retry.',
    cancelled: 'Run the probe again when you are ready.',
    busy: 'Wait for the active probe to finish or cancel it before retrying.',
    unknown: 'Review the redacted message and request ID, then consult the adapter or provider logs.',
};
function normalizedCode(code) {
    return code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
/** Classify only explicit status codes and recognizable provider/runtime errors. */
export function classifyProbeFailure(failure) {
    switch (failure.status) {
        case 400:
        case 422:
            return 'invalid_request';
        case 401:
            return 'credentials';
        case 402:
        case 429:
            return 'rate_limit_or_quota';
        case 403:
            return 'permission';
        case 404:
            return 'model_or_endpoint';
        case 408:
        case 504:
            return 'timeout';
        default:
            if (failure.status !== undefined && failure.status >= 500 && failure.status <= 599) {
                return 'provider_server';
            }
    }
    const code = normalizedCode(failure.code);
    for (const [category, codes] of CODE_GROUPS) {
        if (codes.has(code))
            return category;
    }
    const message = failure.message.toLowerCase();
    if (/\b(?:invalid|missing|incorrect|expired|no) api[-_ ]?key\b|\bauthentication failed\b|\bunauthorized\b/.test(message)) {
        return 'credentials';
    }
    if (/\bpermission denied\b|\baccess denied\b|\bforbidden\b/.test(message))
        return 'permission';
    if (/\b(?:model|endpoint) (?:was )?not found\b|\bunknown model\b|\bno such model\b/.test(message)) {
        return 'model_or_endpoint';
    }
    if (/\brate limit(?:ed| exceeded)?\b|\btoo many requests\b|\binsufficient quota\b|\bquota exceeded\b|\bpayment required\b|\bbilling (?:error|required)\b/.test(message)) {
        return 'rate_limit_or_quota';
    }
    if (/\btimed? out\b|\btimeout\b|\bdeadline exceeded\b/.test(message))
        return 'timeout';
    if (/\bfetch failed\b|\bnetwork error\b|\bconnection (?:refused|reset)\b|\bdns (?:error|lookup failed)\b|\btls (?:error|failure)\b/.test(message)) {
        return 'network';
    }
    if (/\bstream ended without\b|\bincomplete stream\b|\binvalid sse\b|\bsse (?:parse|format)\b/.test(message)) {
        return 'stream_compatibility';
    }
    return 'unknown';
}
