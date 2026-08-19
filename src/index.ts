import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type {} from '@deepseek-ai/dsh-llm'
import { ProbeRunner } from './probe.ts'
import type { ProbeCatalog, ProbeRequest, ProbeResult, ProviderProbeConfig } from './types.ts'

export type * from './types.ts'
export { ProbeRunner } from './probe.ts'
export { redactMessage } from './redact.ts'

export const name = 'provider-probe'
export const inject = ['llm']

export const Config: z<ProviderProbeConfig> = z.object({
  timeoutMs: z.number().min(1000).max(120000).default(20000),
  maxTokens: z.number().min(1).max(32).default(8),
  maxMessageLength: z.number().min(256).max(8000).default(1200),
})

export class ProviderProbeGateway extends TypertRemoteService {
  private readonly runner: ProbeRunner

  constructor(ctx: Context, config: ProviderProbeConfig) {
    super(ctx, 'providerProbe')
    this.runner = new ProbeRunner(ctx.llm, config)
  }

  @Remote('catalog')
  catalog(): Promise<ProbeCatalog> {
    return this.runner.catalog()
  }

  @Remote('probe')
  probe(request: ProbeRequest, signal: AbortSignal): Promise<ProbeResult> {
    return this.runner.probe(request, signal)
  }
}

export function apply(
  ctx: Context,
  config: ProviderProbeConfig = { timeoutMs: 20000, maxTokens: 8, maxMessageLength: 1200 },
): void {
  if (!Number.isInteger(config.timeoutMs)) throw new Error('ProviderProbeConfig: timeoutMs must be an integer')
  if (!Number.isInteger(config.maxTokens)) throw new Error('ProviderProbeConfig: maxTokens must be an integer')
  if (!Number.isInteger(config.maxMessageLength)) throw new Error('ProviderProbeConfig: maxMessageLength must be an integer')
  new ProviderProbeGateway(ctx, config)
}

