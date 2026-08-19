import { describe, expect, it } from 'vitest'
import { buildDiagnosticReport } from '../src/report.ts'

describe('buildDiagnosticReport', () => {
  it('formats a successful probe with declared capabilities and usage', () => {
    const report = buildDiagnosticReport({
      status: 'success',
      provider: 'local',
      model: 'vision-model',
      firstTokenMs: 42,
      totalMs: 125,
      finishReason: 'stop',
      usage: { inputTokens: 15, outputTokens: 1 },
    }, ['text', 'image'])

    expect(report).toBe([
      'dsh-provider-probe diagnostic',
      'Provider: local',
      'Model: vision-model',
      'Declared input modalities: text, image',
      'Status: success',
      'Total time: 125 ms',
      'First token: 42 ms',
      'Finish reason: stop',
      'Token usage: 15 input / 1 output',
      '',
    ].join('\n'))
  })

  it('keeps an unknown capability explicit and flattens redacted failures', () => {
    const report = buildDiagnosticReport({
      status: 'failure',
      provider: 'gateway\nignored',
      model: 'manual-model',
      totalMs: 20,
      failure: {
        code: 'AUTH',
        category: 'credentials',
        status: 401,
        requestId: 'req-123',
        message: 'Authorization: <redacted>\nPath: <home>',
      },
    }, undefined, '检查 API Key。')

    expect(report).toContain('Provider: gateway ignored\n')
    expect(report).toContain('Declared input modalities: unknown\n')
    expect(report).toContain('HTTP status: 401\n')
    expect(report).toContain('Request ID: req-123\n')
    expect(report).toContain('Message: Authorization: <redacted> Path: <home>\n')
    expect(report).toContain('Failure category: credentials\n')
    expect(report).toContain('Suggested next step: 检查 API Key。\n')
  })

  it('uses stable English advice when no localized text is supplied', () => {
    const report = buildDiagnosticReport({
      status: 'failure',
      provider: 'local',
      model: 'model',
      totalMs: 50,
      failure: {
        code: 'INCOMPLETE_STREAM',
        category: 'stream_compatibility',
        message: 'Provider stream ended without a finish event',
      },
    }, ['text'])

    expect(report).toContain('Suggested next step: Check that the endpoint returns the streaming or SSE format')
  })
})
