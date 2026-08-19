import { describe, expect, it } from 'vitest'
import { TYPERT_REMOTE } from '../src/remote.ts'
import { ProbeCatalogCodec, ProbeRequestCodec, ProbeResultCodec } from '../src/remote-codecs.ts'
import { ProbeCatalogSchema, ProbeRequestSchema, ProbeResultSchema } from '../src/schemas.ts'
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
      failure: { code: 'AUTH', category: 'credentials', message: 'Unauthorized', status: 401 },
    }).success).toBe(true)
    expect(ProbeResultCodec.parse({
      status: 'failure',
      provider: 'deepseek',
      model: 'deepseek-chat',
      totalMs: 250,
      failure: { code: 'AUTH', category: 'credentials', message: 'Unauthorized', status: 401 },
    })).toMatchObject({ status: 'failure', failure: { code: 'AUTH' } })
  })

  it('rejects an unknown failure category at both contract boundaries', () => {
    const result = {
      status: 'failure',
      provider: 'deepseek',
      model: 'deepseek-chat',
      totalMs: 250,
      failure: { code: 'AUTH', category: 'made-up', message: 'Unauthorized', status: 401 },
    }
    expect(ProbeResultSchema.safeParse(result).success).toBe(false)
    expect(() => ProbeResultCodec.parse(result)).toThrow(/category/)
  })

  it('carries only the supported declared input modalities', () => {
    const catalog = {
      providers: [{
        id: 'local',
        name: 'Local',
        models: [{ id: 'vision', name: 'Vision', inputModalities: ['text', 'image'] }],
      }],
      limits: { timeoutMs: 20000, maxTokens: 8 },
    }
    expect(ProbeCatalogSchema.safeParse(catalog).success).toBe(true)
    expect(ProbeCatalogCodec.parse(catalog)).toEqual(catalog)

    const future = structuredClone(catalog) as Record<string, unknown>
    const providers = future.providers as Array<{ models: Array<{ inputModalities: string[] }> }>
    providers[0]!.models[0]!.inputModalities.push('audio')
    expect(ProbeCatalogSchema.safeParse(future).success).toBe(false)
    expect(() => ProbeCatalogCodec.parse(future)).toThrow(/inputModalities\[2\]/)
  })
})
