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
        status: 401,
        requestId: 'req-123',
        message: 'Authorization: <redacted>\nPath: <home>',
      },
    }, undefined)

    expect(report).toContain('Provider: gateway ignored\n')
    expect(report).toContain('Declared input modalities: unknown\n')
    expect(report).toContain('HTTP status: 401\n')
    expect(report).toContain('Request ID: req-123\n')
    expect(report).toContain('Message: Authorization: <redacted> Path: <home>\n')
  })
})
