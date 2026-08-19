import type { ProbeFailure, ProbeFailureCategory } from './types.ts';
type FailureEvidence = Pick<ProbeFailure, 'code' | 'message' | 'status'>;
export declare const FAILURE_ADVICE_EN: {
    credentials: string;
    permission: string;
    model_or_endpoint: string;
    rate_limit_or_quota: string;
    timeout: string;
    network: string;
    stream_compatibility: string;
    provider_server: string;
    invalid_request: string;
    cancelled: string;
    busy: string;
    unknown: string;
};
/** Classify only explicit status codes and recognizable provider/runtime errors. */
export declare function classifyProbeFailure(failure: FailureEvidence): ProbeFailureCategory;
export {};
