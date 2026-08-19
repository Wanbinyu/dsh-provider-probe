import type { TypertSchema } from '@deepseek-ai/dsh-typert-protocol'
import type {
  ProbeCatalog,
  ProbeFailure,
  ProbeInputModality,
  ProbeModel,
  ProbeProvider,
  ProbeRequest,
  ProbeResult,
} from './types.ts'

function invalid(subject: string): never {
  throw new TypeError(`provider-probe Remote rejected ${subject}`)
}

function record(value: unknown, subject: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return invalid(subject)
  return value as Record<string, unknown>
}

function string(value: unknown, subject: string): string {
  if (typeof value !== 'string') return invalid(subject)
  return value
}

function finiteNumber(value: unknown, subject: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return invalid(subject)
  return value
}

function nonnegativeNumber(value: unknown, subject: string): number {
  const parsed = finiteNumber(value, subject)
  if (parsed < 0) return invalid(subject)
  return parsed
}

function positiveInteger(value: unknown, subject: string): number {
  const parsed = finiteNumber(value, subject)
  if (!Number.isInteger(parsed) || parsed <= 0) return invalid(subject)
  return parsed
}

function optionalString(value: unknown, subject: string): string | undefined {
  return value === undefined ? undefined : string(value, subject)
}

function optionalModalities(value: unknown, subject: string): readonly ProbeInputModality[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return invalid(subject)
  return value.map((entry, index) => {
    const parsed = string(entry, `${subject}[${String(index)}]`)
    if (parsed !== 'text' && parsed !== 'image') return invalid(`${subject}[${String(index)}]`)
    return parsed
  })
}

function model(value: unknown, subject: string): ProbeModel {
  const item = record(value, subject)
  const description = optionalString(item.description, `${subject}.description`)
  const inputModalities = optionalModalities(item.inputModalities, `${subject}.inputModalities`)
  return {
    id: string(item.id, `${subject}.id`),
    name: string(item.name, `${subject}.name`),
    ...(description === undefined ? {} : { description }),
    ...(inputModalities === undefined ? {} : { inputModalities }),
  }
}

function provider(value: unknown, subject: string): ProbeProvider {
  const item = record(value, subject)
  if (!Array.isArray(item.models)) return invalid(`${subject}.models`)
  const modelListError = optionalString(item.modelListError, `${subject}.modelListError`)
  return {
    id: string(item.id, `${subject}.id`),
    name: string(item.name, `${subject}.name`),
    models: item.models.map((entry, index) => model(entry, `${subject}.models[${String(index)}]`)),
    ...(modelListError === undefined ? {} : { modelListError }),
  }
}

function failure(value: unknown, subject: string): ProbeFailure {
  const item = record(value, subject)
  const status = item.status === undefined ? undefined : finiteNumber(item.status, `${subject}.status`)
  if (status !== undefined && !Number.isInteger(status)) return invalid(`${subject}.status`)
  const requestId = optionalString(item.requestId, `${subject}.requestId`)
  return {
    code: string(item.code, `${subject}.code`),
    message: string(item.message, `${subject}.message`),
    ...(status === undefined ? {} : { status }),
    ...(requestId === undefined ? {} : { requestId }),
  }
}

function usage(value: unknown): NonNullable<Extract<ProbeResult, { status: 'success' }>['usage']> {
  const item = record(value, 'result.usage')
  const optionalNumber = (key: 'cacheReadTokens' | 'cacheWriteTokens' | 'reasoningTokens') => {
    const candidate = item[key]
    return candidate === undefined ? undefined : nonnegativeNumber(candidate, `result.usage.${key}`)
  }
  const cacheReadTokens = optionalNumber('cacheReadTokens')
  const cacheWriteTokens = optionalNumber('cacheWriteTokens')
  const reasoningTokens = optionalNumber('reasoningTokens')
  return {
    inputTokens: nonnegativeNumber(item.inputTokens, 'result.usage.inputTokens'),
    outputTokens: nonnegativeNumber(item.outputTokens, 'result.usage.outputTokens'),
    ...(cacheReadTokens === undefined ? {} : { cacheReadTokens }),
    ...(cacheWriteTokens === undefined ? {} : { cacheWriteTokens }),
    ...(reasoningTokens === undefined ? {} : { reasoningTokens }),
  }
}

export const ProbeRequestCodec: TypertSchema<ProbeRequest> = {
  parse(value: unknown): ProbeRequest {
    const item = record(value, 'request')
    const providerId = string(item.provider, 'request.provider').trim()
    const modelId = string(item.model, 'request.model').trim()
    if (providerId.length === 0 || providerId.length > 200) return invalid('request.provider')
    if (modelId.length === 0 || modelId.length > 300) return invalid('request.model')
    return { provider: providerId, model: modelId }
  },
}

export const ProbeCatalogCodec: TypertSchema<ProbeCatalog> = {
  parse(value: unknown): ProbeCatalog {
    const item = record(value, 'catalog')
    if (!Array.isArray(item.providers)) return invalid('catalog.providers')
    const limits = record(item.limits, 'catalog.limits')
    return {
      providers: item.providers.map((entry, index) => provider(entry, `catalog.providers[${String(index)}]`)),
      limits: {
        timeoutMs: positiveInteger(limits.timeoutMs, 'catalog.limits.timeoutMs'),
        maxTokens: positiveInteger(limits.maxTokens, 'catalog.limits.maxTokens'),
      },
    }
  },
}

export const ProbeResultCodec: TypertSchema<ProbeResult> = {
  parse(value: unknown): ProbeResult {
    const item = record(value, 'result')
    const status = string(item.status, 'result.status')
    const common = {
      provider: string(item.provider, 'result.provider'),
      model: string(item.model, 'result.model'),
      totalMs: nonnegativeNumber(item.totalMs, 'result.totalMs'),
    }
    if (status === 'failure') {
      return { status, ...common, failure: failure(item.failure, 'result.failure') }
    }
    if (status !== 'success') return invalid('result.status')
    const firstTokenMs = item.firstTokenMs === null
      ? null
      : nonnegativeNumber(item.firstTokenMs, 'result.firstTokenMs')
    return {
      status,
      ...common,
      firstTokenMs,
      finishReason: string(item.finishReason, 'result.finishReason'),
      ...(item.usage === undefined ? {} : { usage: usage(item.usage) }),
    }
  },
}
