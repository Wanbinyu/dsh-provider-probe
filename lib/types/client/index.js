import providerProbeRemote from "../remote.js";
import { ProviderProbeSection } from "./ProviderProbeSection.js";
import { NS, en, zh } from "./locales.js";
export const inject = ['slots', 'locale', 'remote'];
export async function apply(ctx) {
    await ctx.remote.$mount(providerProbeRemote);
    const remote = ctx.get('remote.providerProbe');
    if (remote === undefined)
        throw new Error('provider-probe: mounted Remote namespace is unavailable');
    ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'provider-probe: dictionaries');
    const t = ctx.locale.bind(NS);
    const injected = () => ({
        catalog: async () => {
            const result = await remote.catalog();
            if (!result.ok)
                throw new Error(`${result.error.code}: ${result.error.message}`);
            return result.value;
        },
        probe: async (request, signal) => {
            const result = await remote.probe(request, signal);
            if (!result.ok)
                throw new Error(`${result.error.code}: ${result.error.message}`);
            return result.value;
        },
    });
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'provider-probe',
        order: 25,
        label: () => t('nav'),
        locale: NS,
        inject: injected,
    }, ProviderProbeSection));
}
