import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-api-gateway/client'
import type { TypertRemoteNamespace } from '@deepseek-ai/dsh-typert-protocol'
import providerProbeRemote from '../remote.ts'
import { ProviderProbeSection, type ProviderProbeSectionInjected } from './ProviderProbeSection.tsx'
import { NS, en, zh, type ProviderProbeKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'provider-probe': ProviderProbeKey
  }
}

export const inject = ['slots', 'locale', 'remote']

export async function apply(ctx: ClientContext): Promise<void> {
  await ctx.remote.$mount(providerProbeRemote)
  const remote = ctx.get('remote.providerProbe') as TypertRemoteNamespace<'providerProbe'> | undefined
  if (remote === undefined) throw new Error('provider-probe: mounted Remote namespace is unavailable')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'provider-probe: dictionaries')

  const t = ctx.locale.bind(NS)
  const injected = (): ProviderProbeSectionInjected => ({
    catalog: async () => {
      const result = await remote.catalog()
      if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
      return result.value
    },
    probe: async (request, signal) => {
      const result = await remote.probe(request, signal)
      if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`)
      return result.value
    },
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'provider-probe',
    order: 25,
    label: () => t('nav'),
    locale: NS,
    inject: injected,
  }, ProviderProbeSection))
}
