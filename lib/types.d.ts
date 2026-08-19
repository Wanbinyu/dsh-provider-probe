import type { TokenUsage } from '@deepseek-ai/dsh-llm';
export interface ProviderProbeConfig {
    timeoutMs: number;
    maxTokens: number;
    maxMessageLength: number;
}
export type ProbeInputModality = 'text' | 'image';
export interface ProbeModel {
    id: string;
    name: string;
    description?: string;
    /** Effective input modalities declared by the active DSH model route. */
    inputModalities?: readonly ProbeInputModality[];
}
export interface ProbeProvider {
    id: string;
    name: string;
    models: ProbeModel[];
    modelListError?: string;
}
export interface ProbeCatalog {
    providers: ProbeProvider[];
    limits: {
        timeoutMs: number;
        maxTokens: number;
    };
}
export interface ProbeRequest {
    provider: string;
    model: string;
}
export interface ProbeFailure {
    code: string;
    message: string;
    status?: number;
    requestId?: string;
}
export interface ProbeSuccessResult {
    status: 'success';
    provider: string;
    model: string;
    firstTokenMs: number | null;
    totalMs: number;
    finishReason: string;
    usage?: TokenUsage;
}
export interface ProbeFailureResult {
    status: 'failure';
    provider: string;
    model: string;
    totalMs: number;
    failure: ProbeFailure;
}
export type ProbeResult = ProbeSuccessResult | ProbeFailureResult;
