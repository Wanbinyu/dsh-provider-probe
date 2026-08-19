var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import z from '@deepseek-ai/schemastery';
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import { ProbeRunner } from "./probe.js";
export { ProbeRunner } from "./probe.js";
export { redactMessage } from "./redact.js";
export const name = 'provider-probe';
export const inject = ['llm'];
export const Config = z.object({
    timeoutMs: z.number().min(1000).max(120000).default(20000),
    maxTokens: z.number().min(1).max(32).default(8),
    maxMessageLength: z.number().min(256).max(8000).default(1200),
});
let ProviderProbeGateway = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _catalog_decorators;
    let _probe_decorators;
    return class ProviderProbeGateway extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _catalog_decorators = [Remote('catalog')];
            _probe_decorators = [Remote('probe')];
            __esDecorate(this, null, _catalog_decorators, { kind: "method", name: "catalog", static: false, private: false, access: { has: obj => "catalog" in obj, get: obj => obj.catalog }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _probe_decorators, { kind: "method", name: "probe", static: false, private: false, access: { has: obj => "probe" in obj, get: obj => obj.probe }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        runner = __runInitializers(this, _instanceExtraInitializers);
        constructor(ctx, config) {
            super(ctx, 'providerProbe');
            this.runner = new ProbeRunner(ctx.llm, config);
        }
        catalog() {
            return this.runner.catalog();
        }
        probe(request, signal) {
            return this.runner.probe(request, signal);
        }
    };
})();
export { ProviderProbeGateway };
export function apply(ctx, config = { timeoutMs: 20000, maxTokens: 8, maxMessageLength: 1200 }) {
    if (!Number.isInteger(config.timeoutMs))
        throw new Error('ProviderProbeConfig: timeoutMs must be an integer');
    if (!Number.isInteger(config.maxTokens))
        throw new Error('ProviderProbeConfig: maxTokens must be an integer');
    if (!Number.isInteger(config.maxMessageLength))
        throw new Error('ProviderProbeConfig: maxMessageLength must be an integer');
    new ProviderProbeGateway(ctx, config);
}
