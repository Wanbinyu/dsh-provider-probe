import { describe, expect, it } from 'vitest'
import { TYPERT_REMOTE } from '../src/remote.ts'
import { ProbeRequestCodec, ProbeResultCodec } from '../src/remote-codecs.ts'
import { ProbeRequestSchema, ProbeResultSchema } from '../src/schemas.ts'
import { TYPERT } from '../src/typert.ts'

describe('Remote contracts', () => {
  it('keeps Host and Client endpoint descriptors aligned', () => {
    expect(TYPERT.invocations.map(item => item.id)).toEqual(
      TYPERT_REMOTE.descriptors.map(item => item.id),
    )
  })

  it('rejects blank and oversized route identities', () => {
    expect(ProbeRequestSchema.safeParse({ provider: ' ', model: 'model' }).success).toBe(false)
    expect(ProbeRequestSchema.safeParse({ provider: 'provider', model: 'x'.repeat(301) }).success).toBe(false)
    expect(() => ProbeRequestCodec.parse({ provider: ' ', model: 'model' })).toThrow()
  })

  it('accepts the serializable success and failure result shapes', () => {
    expect(ProbeResultSchema.safeParse({
      status: 'success',
      provider: 'deepseek',
      model: 'deepseek-chat',
      firstTokenMs: 120,
      totalMs: 250,
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 1 },
    }).success).toBe(true)
    expect(ProbeResultSchema.safeParse({
      status: 'failure',
      provider: 'deepseek',
      model: 'deepseek-chat',
      totalMs: 250,
      failure: { code: 'AUTH', message: 'Unauthorized', status: 401 },
    }).success).toBe(true)
    expect(ProbeResultCodec.parse({
      status: 'failure',
      provider: 'deepseek',
      model: 'deepseek-chat',
      totalMs: 250,
      failure: { code: 'AUTH', message: 'Unauthorized', status: 401 },
    })).toMatchObject({ status: 'failure', failure: { code: 'AUTH' } })
  })
})
