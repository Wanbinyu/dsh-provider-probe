import { ProbeCatalogSchema, ProbeRequestSchema, ProbeResultSchema } from './schemas.ts'

export const TYPERT = {
  package: 'dsh-provider-probe',
  face: 'host',
  schemas: [],
  invocations: [
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
        schema: ProbeCatalogSchema,
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
            schema: ProbeRequestSchema,
          },
        },
      ],
      cancellation: { parameter: 'signal' },
      result: {
        mode: 'strict',
        typeSymbol: 'dsh-provider-probe/types#ProbeResult',
        schema: ProbeResultSchema,
      },
    },
  ],
  model: {
    services: [],
    events: [],
    objects: [],
  },
}

