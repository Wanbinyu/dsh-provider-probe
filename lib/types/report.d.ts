import type { ProbeInputModality, ProbeResult } from './types.ts';
/** Build a stable, paste-ready report from already-redacted probe data. */
export declare function buildDiagnosticReport(result: ProbeResult, inputModalities: readonly ProbeInputModality[] | undefined, localizedFailureAdvice?: string): string;
