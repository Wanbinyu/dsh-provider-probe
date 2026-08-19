import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { ProbeCatalog, ProbeRequest, ProbeResult, ProviderProbeConfig } from './types.ts';
export type * from './types.ts';
export { ProbeRunner } from './probe.ts';
export { classifyProbeFailure, FAILURE_ADVICE_EN } from './failure.ts';
export { redactMessage } from './redact.ts';
export { buildDiagnosticReport } from './report.ts';
export declare const name = "provider-probe";
export declare const inject: string[];
export declare const Config: z<ProviderProbeConfig>;
export declare class ProviderProbeGateway extends TypertRemoteService {
    private readonly runner;
    constructor(ctx: Context, config: ProviderProbeConfig);
    catalog(): Promise<ProbeCatalog>;
    probe(request: ProbeRequest, signal: AbortSignal): Promise<ProbeResult>;
}
export declare function apply(ctx: Context, config?: ProviderProbeConfig): void;
