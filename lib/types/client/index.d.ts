import type { Context as ClientContext } from '@deepseek-ai/cordis';
import { type ProviderProbeKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        'provider-probe': ProviderProbeKey;
    }
}
export declare const inject: string[];
export declare function apply(ctx: ClientContext): Promise<void>;
