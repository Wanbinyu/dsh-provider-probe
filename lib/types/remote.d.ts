import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
import type { ProbeCatalog, ProbeRequest, ProbeResult } from './types.ts';
declare module '@deepseek-ai/dsh-typert-protocol' {
    interface TypertRemoteNamespace$70726f766964657250726f6265 {
        catalog: () => Promise<RemoteResult<ProbeCatalog>>;
        probe: (request: ProbeRequest, signal?: AbortSignal) => Promise<RemoteResult<ProbeResult>>;
    }
    interface TypertRemoteMap {
        'providerProbe/catalog': () => Promise<RemoteResult<ProbeCatalog>>;
        'providerProbe/probe': (request: ProbeRequest, signal?: AbortSignal) => Promise<RemoteResult<ProbeResult>>;
    }
    interface TypertRemoteNamespaceMap {
        providerProbe: TypertRemoteNamespace$70726f766964657250726f6265;
    }
}
export declare const TYPERT_REMOTE: TypertRemoteContribution;
export default TYPERT_REMOTE;
