import { FAILURE_ADVICE_EN } from './failure.ts'
import type { ProbeInputModality, ProbeResult } from './types.ts'

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function modalityText(inputModalities: readonly ProbeInputModality[] | undefined): string {
  if (inputModalities === undefined) return 'unknown'
  return inputModalities.length === 0 ? 'none declared' : inputModalities.join(', ')
}

/** Build a stable, paste-ready report from already-redacted probe data. */
export function buildDiagnosticReport(
  result: ProbeResult,
  inputModalities: readonly ProbeInputModality[] | undefined,
  localizedFailureAdvice?: string,
): string {
  const lines = [
    'dsh-provider-probe diagnostic',
    `Provider: ${oneLine(result.provider)}`,
    `Model: ${oneLine(result.model)}`,
    `Declared input modalities: ${modalityText(inputModalities)}`,
    `Status: ${result.status}`,
    `Total time: ${String(result.totalMs)} ms`,
  ]

  if (result.status === 'success') {
    lines.push(
      `First token: ${result.firstTokenMs === null ? 'not reported' : `${String(result.firstTokenMs)} ms`}`,
      `Finish reason: ${oneLine(result.finishReason)}`,
    )
    if (result.usage !== undefined) {
      lines.push(`Token usage: ${String(result.usage.inputTokens)} input / ${String(result.usage.outputTokens)} output`)
    } else {
      lines.push('Token usage: not reported')
    }
  } else {
    lines.push(
      `Error code: ${oneLine(result.failure.code)}`,
      ...result.failure.status === undefined ? [] : [`HTTP status: ${String(result.failure.status)}`],
      ...result.failure.requestId === undefined ? [] : [`Request ID: ${oneLine(result.failure.requestId)}`],
      `Message: ${oneLine(result.failure.message)}`,
      `Failure category: ${result.failure.category}`,
      `Suggested next step: ${oneLine(localizedFailureAdvice ?? FAILURE_ADVICE_EN[result.failure.category])}`,
    )
  }

  return `${lines.join('\n')}\n`
}
