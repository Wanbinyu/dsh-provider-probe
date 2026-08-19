import { z } from 'zod'

export const TokenUsageSchema = z.object({
  inputTokens: z.number().nonnegative(),
  outputTokens: z.number().nonnegative(),
  cacheReadTokens: z.number().nonnegative().optional(),
  cacheWriteTokens: z.number().nonnegative().optional(),
  reasoningTokens: z.number().nonnegative().optional(),
})

export const ProbeModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  inputModalities: z.array(z.enum(['text', 'image'])).optional(),
})

export const ProbeProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  models: z.array(ProbeModelSchema),
  modelListError: z.string().optional(),
})

export const ProbeCatalogSchema = z.object({
  providers: z.array(ProbeProviderSchema),
  limits: z.object({
    timeoutMs: z.number().int().positive(),
    maxTokens: z.number().int().positive(),
  }),
})

export const ProbeRequestSchema = z.object({
  provider: z.string().trim().min(1).max(200),
  model: z.string().trim().min(1).max(300),
})

export const ProbeFailureCategorySchema = z.enum([
  'credentials',
  'permission',
  'model_or_endpoint',
  'rate_limit_or_quota',
  'timeout',
  'network',
  'stream_compatibility',
  'provider_server',
  'invalid_request',
  'cancelled',
  'busy',
  'unknown',
])

export const ProbeFailureSchema = z.object({
  code: z.string(),
  message: z.string(),
  category: ProbeFailureCategorySchema,
  status: z.number().int().optional(),
  requestId: z.string().optional(),
})

export const ProbeResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    provider: z.string(),
    model: z.string(),
    firstTokenMs: z.number().nonnegative().nullable(),
    totalMs: z.number().nonnegative(),
    finishReason: z.string(),
    usage: TokenUsageSchema.optional(),
  }),
  z.object({
    status: z.literal('failure'),
    provider: z.string(),
    model: z.string(),
    totalMs: z.number().nonnegative(),
    failure: ProbeFailureSchema,
  }),
])
