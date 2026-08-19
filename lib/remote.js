import { ProbeCatalogCodec, ProbeRequestCodec, ProbeResultCodec } from "./remote-codecs.js";
export const TYPERT_REMOTE = {
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
};
export default TYPERT_REMOTE;
