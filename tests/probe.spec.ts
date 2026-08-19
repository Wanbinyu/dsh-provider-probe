import { describe, expect, it } from 'vitest'
import type { LlmRuntime, StreamChunk } from '@deepseek-ai/dsh-llm'
import { ProbeRunner } from '../src/probe.ts'
import type { ProviderProbeConfig } from '../src/types.ts'

const config: ProviderProbeConfig = {
  timeoutMs: 1000,
  maxTokens: 8,
  maxMessageLength: 1200,
}

function runner(
  llm: Partial<LlmRuntime>,
  now: () => number = () => performance.now(),
  overrides: Partial<ProviderProbeConfig> = {},
): ProbeRunner {
  return new ProbeRunner(llm as LlmRuntime, { ...config, ...overrides }, now)
}

function chunks(...values: StreamChunk[]): AsyncIterable<StreamChunk> {
  return {
    async *[Symbol.asyncIterator]() {
      yield* values
    },
  }
}

describe('ProbeRunner', () => {
  it('reports first-token latency, total latency, finish reason, and usage', async () => {
    const times = [100, 132, 176]
    const llm = {
      stream: () => chunks(
        { type: 'block-start', index: 0, blockType: 'text' },
        { type: 'text-delta', index: 0, text: 'OK' },
        { type: 'usage', usage: { inputTokens: 11, outputTokens: 1 } },
        { type: 'finish', reason: { kind: 'stop' } },
      ),
    }

    const result = await runner(llm, () => times.shift() ?? 176).probe(
      { provider: 'deepseek', model: 'deepseek-chat' },
      new AbortController().signal,
    )

    expect(result).toEqual({
      status: 'success',
      provider: 'deepseek',
      model: 'deepseek-chat',
      firstTokenMs: 32,
      totalMs: 76,
      finishReason: 'stop',
      usage: { inputTokens: 11, outputTokens: 1 },
    })
  })

  it('returns a redacted structured terminal failure', async () => {
    const llm = {
      stream: () => chunks({
        type: 'finish',
        reason: {
          kind: 'error',
          failure: {
            code: 'AUTH',
            status: 401,
            requestId: 'req-123' as never,
            message: 'Authorization: Bearer sk-1234567890abcdef at C:\\Users\\alice\\.dsh',
          },
        },
      }),
    }
    const times = [0, 15]

    const result = await runner(llm, () => times.shift() ?? 15).probe(
      { provider: 'deepseek', model: 'deepseek-chat' },
      new AbortController().signal,
    )

    expect(result.status).toBe('failure')
    if (result.status !== 'failure') return
    expect(result.failure).toMatchObject({ code: 'AUTH', status: 401, requestId: 'req-123' })
    expect(result.failure.message).toContain('Authorization: <redacted>')
    expect(result.failure.message).toContain('<home>')
    expect(result.failure.message).not.toContain('sk-1234567890abcdef')
    expect(result.failure.message).not.toContain('alice')
  })

  it('enforces its own timeout even when an iterator never settles', async () => {
    const llm = {
      stream: () => ({
        [Symbol.asyncIterator]() {
          return {
            next: () => new Promise<IteratorResult<StreamChunk>>(() => undefined),
            return: async () => ({ done: true, value: undefined }),
          }
        },
      }),
    }

    const result = await runner(llm, undefined, { timeoutMs: 10 }).probe(
      { provider: 'slow', model: 'slow-model' },
      new AbortController().signal,
    )

    expect(result.status).toBe('failure')
    if (result.status !== 'failure') return
    expect(result.failure.code).toBe('TIMEOUT')
    expect(result.totalMs).toBeGreaterThanOrEqual(0)
  })

  it('rejects a concurrent probe without sending a second model request', async () => {
    let calls = 0
    const llm = {
      stream: () => {
        calls += 1
        return {
          [Symbol.asyncIterator]() {
            return {
              next: () => new Promise<IteratorResult<StreamChunk>>(() => undefined),
              return: async () => ({ done: true, value: undefined }),
            }
          },
        }
      },
    }
    const firstController = new AbortController()
    const probeRunner = runner(llm)
    const first = probeRunner.probe({ provider: 'one', model: 'model' }, firstController.signal)
    const second = await probeRunner.probe(
      { provider: 'two', model: 'model' },
      new AbortController().signal,
    )

    expect(second).toMatchObject({ status: 'failure', failure: { code: 'BUSY' } })
    expect(calls).toBe(1)
    firstController.abort()
    await expect(first).resolves.toMatchObject({ status: 'failure', failure: { code: 'CANCELLED' } })
  })

  it('keeps healthy providers when one model catalog fails', async () => {
    const llm = {
      listProviders: () => [
        { id: 'healthy', name: 'Healthy' },
        { id: 'broken', name: 'Broken' },
      ],
      listModels: async (provider: string) => {
        if (provider === 'broken') throw new Error('apiKey=top-secret catalog failed')
        return [
          { provider, id: 'model-a', name: 'Model A', inputModalities: ['image', 'text', 'image'] as const },
          { provider, id: 'model-a', name: 'Duplicate' },
          { provider, id: 'model-b', name: 'Model B' },
        ]
      },
    }

    const catalog = await runner(llm).catalog()

    expect(catalog.providers[0]?.models).toEqual([
      { id: 'model-a', name: 'Model A', inputModalities: ['text', 'image'] },
      { id: 'model-b', name: 'Model B' },
    ])
    expect(catalog.providers[1]).toMatchObject({
      id: 'broken',
      models: [],
      modelListError: 'apiKey=<redacted> catalog failed',
    })
    expect(catalog.limits).toEqual({ timeoutMs: 1000, maxTokens: 8 })
  })
})
