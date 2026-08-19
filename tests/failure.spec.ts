import { describe, expect, it } from 'vitest'
import { classifyProbeFailure } from '../src/failure.ts'
import type { ProbeFailureCategory } from '../src/types.ts'

describe('classifyProbeFailure', () => {
  it.each([
    [401, 'credentials'],
    [403, 'permission'],
    [404, 'model_or_endpoint'],
    [429, 'rate_limit_or_quota'],
    [504, 'timeout'],
    [503, 'provider_server'],
  ] satisfies ReadonlyArray<readonly [number, ProbeFailureCategory]>)('classifies HTTP %i as %s', (status, category) => {
    expect(classifyProbeFailure({ code: 'HTTP_ERROR', message: 'Request failed', status })).toBe(category)
  })

  it.each([
    ['INVALID_API_KEY', 'Request failed', 'credentials'],
    ['MISSING_CREDENTIAL', 'Request failed', 'credentials'],
    ['PERMISSION_DENIED', 'Request failed', 'permission'],
    ['MODEL_NOT_FOUND', 'Request failed', 'model_or_endpoint'],
    ['INSUFFICIENT_QUOTA', 'Request failed', 'rate_limit_or_quota'],
    ['ETIMEDOUT', 'Request failed', 'timeout'],
    ['ECONNREFUSED', 'Request failed', 'network'],
    ['INCOMPLETE_STREAM', 'Request failed', 'stream_compatibility'],
    ['SOMETHING_NEW', 'Request failed', 'unknown'],
  ] satisfies ReadonlyArray<readonly [string, string, ProbeFailureCategory]>)('classifies explicit code %s', (code, message, category) => {
    expect(classifyProbeFailure({ code, message })).toBe(category)
  })

  it('uses explicit provider wording when no structured status is available', () => {
    expect(classifyProbeFailure({ code: 'PROVIDER_ERROR', message: 'No API key for provider route' })).toBe('credentials')
    expect(classifyProbeFailure({ code: 'API_ERROR', message: 'Quota exceeded for this project' })).toBe('rate_limit_or_quota')
    expect(classifyProbeFailure({ code: 'TYPE_ERROR', message: 'fetch failed' })).toBe('network')
    expect(classifyProbeFailure({ code: 'UPSTREAM', message: 'stream ended without a finish event' })).toBe('stream_compatibility')
  })

  it('prefers an explicit HTTP status over ambiguous text', () => {
    expect(classifyProbeFailure({ code: 'UNKNOWN', message: 'Model not found', status: 403 })).toBe('permission')
  })
})
