import type {
  RemoteResult,
  TypertCodec,
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

function strictCodec(typeSymbol: string, schema: { parse(value: unknown): unknown }): TypertCodec {
  // 0.1 hosts read `schema`. 0.2 hosts call `create()`. Keep both.
  return {
    mode: 'strict',
    typeSymbol,
    schema,
    create: () => schema,
  } as unknown as TypertCodec
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
      result: strictCodec('dsh-provider-probe/types#ProbeCatalog', ProbeCatalogCodec),
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
          codec: strictCodec('dsh-provider-probe/types#ProbeRequest', ProbeRequestCodec),
        },
      ],
      cancellation: { parameter: 'signal' },
      result: strictCodec('dsh-provider-probe/types#ProbeResult', ProbeResultCodec),
    },
  ],
}

export default TYPERT_REMOTE
