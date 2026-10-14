import { ProbeCatalogCodec, ProbeRequestCodec, ProbeResultCodec } from "./remote-codecs.js";
function strictCodec(typeSymbol, schema) {
    // 0.1 hosts read `schema`. 0.2 hosts call `create()`. Keep both.
    return {
        mode: 'strict',
        typeSymbol,
        schema,
        create: () => schema,
    };
}
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
};
export default TYPERT_REMOTE;
