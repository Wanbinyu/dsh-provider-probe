import type {
  RemoteResult,
  TypertRemoteContribution,
} from '@deepseek-ai/dsh-typert-protocol'
import { ProbeCatalogCodec, ProbeRequestCodec, ProbeResultCodec } from './remote-codecs.ts'
import type { ProbeCatalog, ProbeRequest, ProbeResult } from './types.ts'

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteNamespace$70726f766964657250726f6265 {
    catalog: () => Promise<RemoteResult<ProbeCatalog>>
    probe: (request: ProbeRequest, signal?: AbortSignal) => Promise<RemoteResult<ProbeResult>>
  }
  interface TypertRemoteMap {
    'providerProbe/catalog': () => Promise<RemoteResult<ProbeCatalog>>
    'providerProbe/probe': (request: ProbeRequest, signal?: AbortSignal) => Promise<RemoteResult<ProbeResult>>
  }
  interface TypertRemoteNamespaceMap {
    providerProbe: TypertRemoteNamespace$70726f766964657250726f6265
  }
}

export const TYPERT_REMOTE: TypertRemoteContribution = {
  package: 'dsh-provider-probe',
  descriptors: [
    {
      id: 'dsh-provider-probe#providerProbe/catalog',
      service: 'providerProbe',
      namespace: 'providerProbe',
      method: 'catalog',
      invocation: { kind: 'direct' },
      parameters: [],
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-provider-probe/types#ProbeCatalog',
        schema: ProbeCatalogCodec,
      },
    },
    {
      id: 'dsh-provider-probe#providerProbe/probe',
      service: 'providerProbe',
      namespace: 'providerProbe',
      method: 'probe',
      invocation: { kind: 'direct' },
      parameters: [
        {
          name: 'request',
          wire: 'request',
          source: 'json',
          codec: {
            mode: 'strict',
            typeSymbol: 'dsh-provider-probe/types#ProbeRequest',
            schema: ProbeRequestCodec,
          },
        },
      ],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-provider-probe/types#ProbeResult',
        schema: ProbeResultCodec,
      },
    },
  ],
}

export default TYPERT_REMOTE
