import { type LlmRuntime } from '@deepseek-ai/dsh-llm';
import type { ProbeCatalog, ProbeRequest, ProbeResult, ProviderProbeConfig } from './types.ts';
type LlmPort = Pick<LlmRuntime, 'listModels' | 'listProviders' | 'stream'>;
export declare class ProbeRunner {
    private readonly llm;
    private readonly config;
    private readonly now;
    private active;
    constructor(llm: LlmPort, config: ProviderProbeConfig, now?: () => number);
    catalog(): Promise<ProbeCatalog>;
    probe(request: ProbeRequest, callerSignal: AbortSignal): Promise<ProbeResult>;
}
export {};
