const SECRET_KEYS = '(?:api[-_]?key|access[-_]?token|auth[-_]?token|secret|token)';
const HOME_PATHS = [
    /\b[A-Za-z]:\\Users\\[^\\\s]+/gi,
    /\/(?:Users|home)\/[^/\s]+/g,
];
export function redactMessage(input, maxLength) {
    let value = input.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
    value = value.replace(/\bAuthorization\s*[:=]\s*(?:Bearer\s+)?[^\s,;]+/gi, 'Authorization: <redacted>');
    value = value.replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer <redacted>');
    value = value.replace(new RegExp(`(${SECRET_KEYS}\\s*[:=]\\s*[\"']?)[^\"'\\s,;&]+`, 'gi'), '$1<redacted>');
    value = value.replace(new RegExp(`([?&]${SECRET_KEYS}=)[^&#\\s]+`, 'gi'), '$1<redacted>');
    value = value.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, '<redacted-api-key>');
    for (const pattern of HOME_PATHS)
        value = value.replace(pattern, '<home>');
    value = value.trim();
    if (value.length <= maxLength)
        return value;
    return `${value.slice(0, Math.max(0, maxLength - 15)).trimEnd()}... [truncated]`;
}
