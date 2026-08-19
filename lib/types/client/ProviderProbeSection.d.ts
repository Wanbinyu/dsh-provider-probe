import { type ReactNode } from 'react';
import { type ProbeCatalog, type ProbeRequest, type ProbeResult } from '../client.ts';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
export interface ProviderProbeSectionInjected {
    catalog: () => Promise<ProbeCatalog>;
    probe: (request: ProbeRequest, signal: AbortSignal) => Promise<ProbeResult>;
}
export type ProviderProbeSectionProps = PropsRuntime<'settings.section'> & PropsLocale<'provider-probe'> & InjectFace<ProviderProbeSectionInjected>;
export declare function ProviderProbeSection({ catalog, probe, t }: ProviderProbeSectionProps): ReactNode;
