window.__ModuleLoader__.load({ id: "dsh-provider-probe", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
let react_jsx_runtime = require("react/jsx-runtime");
let react = require("react");
let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

//#region lib/types/remote-codecs.js
const FAILURE_CATEGORIES = new Set([
	"credentials",
	"permission",
	"model_or_endpoint",
	"rate_limit_or_quota",
	"timeout",
	"network",
	"stream_compatibility",
	"provider_server",
	"invalid_request",
	"cancelled",
	"busy",
	"unknown"
]);
function invalid(subject) {
	throw new TypeError(`provider-probe Remote rejected ${subject}`);
}
function record(value, subject) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return invalid(subject);
	return value;
}
function string(value, subject) {
	if (typeof value !== "string") return invalid(subject);
	return value;
}
function finiteNumber(value, subject) {
	if (typeof value !== "number" || !Number.isFinite(value)) return invalid(subject);
	return value;
}
function nonnegativeNumber(value, subject) {
	const parsed = finiteNumber(value, subject);
	if (parsed < 0) return invalid(subject);
	return parsed;
}
function positiveInteger(value, subject) {
	const parsed = finiteNumber(value, subject);
	if (!Number.isInteger(parsed) || parsed <= 0) return invalid(subject);
	return parsed;
}
function optionalString(value, subject) {
	return value === void 0 ? void 0 : string(value, subject);
}
function optionalModalities(value, subject) {
	if (value === void 0) return void 0;
	if (!Array.isArray(value)) return invalid(subject);
	return value.map((entry, index) => {
		const parsed = string(entry, `${subject}[${String(index)}]`);
		if (parsed !== "text" && parsed !== "image") return invalid(`${subject}[${String(index)}]`);
		return parsed;
	});
}
function model(value, subject) {
	const item = record(value, subject);
	const description = optionalString(item.description, `${subject}.description`);
	const inputModalities = optionalModalities(item.inputModalities, `${subject}.inputModalities`);
	return {
		id: string(item.id, `${subject}.id`),
		name: string(item.name, `${subject}.name`),
		...description === void 0 ? {} : { description },
		...inputModalities === void 0 ? {} : { inputModalities }
	};
}
function provider(value, subject) {
	const item = record(value, subject);
	if (!Array.isArray(item.models)) return invalid(`${subject}.models`);
	const modelListError = optionalString(item.modelListError, `${subject}.modelListError`);
	return {
		id: string(item.id, `${subject}.id`),
		name: string(item.name, `${subject}.name`),
		models: item.models.map((entry, index) => model(entry, `${subject}.models[${String(index)}]`)),
		...modelListError === void 0 ? {} : { modelListError }
	};
}
function failure(value, subject) {
	const item = record(value, subject);
	const status = item.status === void 0 ? void 0 : finiteNumber(item.status, `${subject}.status`);
	if (status !== void 0 && !Number.isInteger(status)) return invalid(`${subject}.status`);
	const requestId = optionalString(item.requestId, `${subject}.requestId`);
	const rawCategory = string(item.category, `${subject}.category`);
	if (!FAILURE_CATEGORIES.has(rawCategory)) return invalid(`${subject}.category`);
	const category = rawCategory;
	return {
		code: string(item.code, `${subject}.code`),
		message: string(item.message, `${subject}.message`),
		category,
		...status === void 0 ? {} : { status },
		...requestId === void 0 ? {} : { requestId }
	};
}
function usage(value) {
	const item = record(value, "result.usage");
	const optionalNumber = (key) => {
		const candidate = item[key];
		return candidate === void 0 ? void 0 : nonnegativeNumber(candidate, `result.usage.${key}`);
	};
	const cacheReadTokens = optionalNumber("cacheReadTokens");
	const cacheWriteTokens = optionalNumber("cacheWriteTokens");
	const reasoningTokens = optionalNumber("reasoningTokens");
	return {
		inputTokens: nonnegativeNumber(item.inputTokens, "result.usage.inputTokens"),
		outputTokens: nonnegativeNumber(item.outputTokens, "result.usage.outputTokens"),
		...cacheReadTokens === void 0 ? {} : { cacheReadTokens },
		...cacheWriteTokens === void 0 ? {} : { cacheWriteTokens },
		...reasoningTokens === void 0 ? {} : { reasoningTokens }
	};
}
const ProbeRequestCodec = { parse(value) {
	const item = record(value, "request");
	const providerId = string(item.provider, "request.provider").trim();
	const modelId = string(item.model, "request.model").trim();
	if (providerId.length === 0 || providerId.length > 200) return invalid("request.provider");
	if (modelId.length === 0 || modelId.length > 300) return invalid("request.model");
	return {
		provider: providerId,
		model: modelId
	};
} };
const ProbeCatalogCodec = { parse(value) {
	const item = record(value, "catalog");
	if (!Array.isArray(item.providers)) return invalid("catalog.providers");
	const limits = record(item.limits, "catalog.limits");
	return {
		providers: item.providers.map((entry, index) => provider(entry, `catalog.providers[${String(index)}]`)),
		limits: {
			timeoutMs: positiveInteger(limits.timeoutMs, "catalog.limits.timeoutMs"),
			maxTokens: positiveInteger(limits.maxTokens, "catalog.limits.maxTokens")
		}
	};
} };
const ProbeResultCodec = { parse(value) {
	const item = record(value, "result");
	const status = string(item.status, "result.status");
	const common = {
		provider: string(item.provider, "result.provider"),
		model: string(item.model, "result.model"),
		totalMs: nonnegativeNumber(item.totalMs, "result.totalMs")
	};
	if (status === "failure") return {
		status,
		...common,
		failure: failure(item.failure, "result.failure")
	};
	if (status !== "success") return invalid("result.status");
	const firstTokenMs = item.firstTokenMs === null ? null : nonnegativeNumber(item.firstTokenMs, "result.firstTokenMs");
	return {
		status,
		...common,
		firstTokenMs,
		finishReason: string(item.finishReason, "result.finishReason"),
		...item.usage === void 0 ? {} : { usage: usage(item.usage) }
	};
} };

//#endregion
//#region lib/types/remote.js
const TYPERT_REMOTE = {
	package: "dsh-provider-probe",
	descriptors: [{
		id: "dsh-provider-probe#providerProbe/catalog",
		service: "providerProbe",
		namespace: "providerProbe",
		method: "catalog",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-provider-probe/types#ProbeCatalog",
			schema: ProbeCatalogCodec
		}
	}, {
		id: "dsh-provider-probe#providerProbe/probe",
		service: "providerProbe",
		namespace: "providerProbe",
		method: "probe",
		invocation: { kind: "direct" },
		parameters: [{
			name: "request",
			wire: "request",
			source: "json",
			codec: {
				mode: "strict",
				typeSymbol: "dsh-provider-probe/types#ProbeRequest",
				schema: ProbeRequestCodec
			}
		}],
		cancellation: { parameter: "signal" },
		result: {
			mode: "strict",
			typeSymbol: "dsh-provider-probe/types#ProbeResult",
			schema: ProbeResultCodec
		}
	}]
};

//#endregion
//#region lib/types/failure.js
const FAILURE_ADVICE_EN = {
	credentials: "Check that the provider API key is configured, current, and belongs to the selected endpoint.",
	permission: "Check model access and account or project permissions for this API key.",
	model_or_endpoint: "Verify the provider base URL and model ID, then refresh the model catalog.",
	rate_limit_or_quota: "Check rate limits, quota, and billing status, then retry after the provider's reset window.",
	timeout: "Check provider availability and network latency, or increase timeoutMs for consistently slow endpoints.",
	network: "Check DNS, proxy, firewall, TLS certificates, and whether the provider base URL is reachable.",
	stream_compatibility: "Check that the endpoint returns the streaming or SSE format expected by its DSH adapter; try the provider's native endpoint.",
	provider_server: "Retry later and use the request ID when contacting the provider if the error persists.",
	invalid_request: "Choose a provider and valid model ID, then retry.",
	cancelled: "Run the probe again when you are ready.",
	busy: "Wait for the active probe to finish or cancel it before retrying.",
	unknown: "Review the redacted message and request ID, then consult the adapter or provider logs."
};

//#endregion
//#region lib/types/report.js
function oneLine(value) {
	return value.replace(/[\r\n]+/g, " ").trim();
}
function modalityText(inputModalities) {
	if (inputModalities === void 0) return "unknown";
	return inputModalities.length === 0 ? "none declared" : inputModalities.join(", ");
}
/** Build a stable, paste-ready report from already-redacted probe data. */
function buildDiagnosticReport(result, inputModalities, localizedFailureAdvice) {
	const lines = [
		"dsh-provider-probe diagnostic",
		`Provider: ${oneLine(result.provider)}`,
		`Model: ${oneLine(result.model)}`,
		`Declared input modalities: ${modalityText(inputModalities)}`,
		`Status: ${result.status}`,
		`Total time: ${String(result.totalMs)} ms`
	];
	if (result.status === "success") {
		lines.push(`First token: ${result.firstTokenMs === null ? "not reported" : `${String(result.firstTokenMs)} ms`}`, `Finish reason: ${oneLine(result.finishReason)}`);
		if (result.usage !== void 0) lines.push(`Token usage: ${String(result.usage.inputTokens)} input / ${String(result.usage.outputTokens)} output`);
		else lines.push("Token usage: not reported");
	} else lines.push(`Error code: ${oneLine(result.failure.code)}`, ...result.failure.status === void 0 ? [] : [`HTTP status: ${String(result.failure.status)}`], ...result.failure.requestId === void 0 ? [] : [`Request ID: ${oneLine(result.failure.requestId)}`], `Message: ${oneLine(result.failure.message)}`, `Failure category: ${result.failure.category}`, `Suggested next step: ${oneLine(localizedFailureAdvice ?? FAILURE_ADVICE_EN[result.failure.category])}`);
	return `${lines.join("\n")}\n`;
}

//#endregion
//#region \0dsh-css:G:\skill\dsh-provider-probe\src\client\ProviderProbeSection.module.css.mjs
const css = ".kQGifG_section{width:100%;max-width:720px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:14px;display:flex}.kQGifG_header{justify-content:space-between;align-items:center;gap:12px;display:flex}.kQGifG_header h2,.kQGifG_muted,.kQGifG_catalogWarning,.kQGifG_costNotice,.kQGifG_running,.kQGifG_transportError,.kQGifG_errorMessage,.kQGifG_nextStep p{margin:0}.kQGifG_header h2{font-size:16px;font-weight:500;line-height:24px}.kQGifG_iconButton{box-sizing:border-box;width:32px;height:32px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;flex:none;justify-content:center;align-items:center;display:inline-flex}.kQGifG_iconButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.kQGifG_iconButton:disabled{opacity:.4;cursor:default}.kQGifG_iconButton:focus-visible,.kQGifG_primaryButton:focus-visible,.kQGifG_secondaryButton:focus-visible,.kQGifG_copyButton:focus-visible,.kQGifG_loadFailure button:focus-visible,.kQGifG_field select:focus-visible,.kQGifG_field input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.kQGifG_muted,.kQGifG_running{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}.kQGifG_loadFailure{color:var(--dsw-alias-state-error-primary);align-items:center;gap:10px;font-size:13px;line-height:20px;display:flex}.kQGifG_loadFailure button{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;background:0 0;border-radius:6px;padding:4px 10px}.kQGifG_fields{grid-template-columns:minmax(0,1fr) minmax(0,1.25fr);gap:12px;display:grid}.kQGifG_field{flex-direction:column;gap:6px;min-width:0;display:flex}.kQGifG_field>span{color:var(--dsw-alias-label-secondary);font-size:12px;font-weight:500;line-height:18px}.kQGifG_field select,.kQGifG_field input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);background-color:var(--dsw-alias-bg-layer-1);width:100%;min-width:0;height:36px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:8px;outline:0;padding:0 10px;font-size:13px}.kQGifG_field select{appearance:none;cursor:pointer;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-position:right 12px center;background-repeat:no-repeat;padding-right:32px}.kQGifG_field select:disabled,.kQGifG_field input:disabled{opacity:.55;cursor:default}.kQGifG_field input::placeholder{color:var(--dsw-alias-label-dimmed)}.kQGifG_capabilities{min-width:0;color:var(--dsw-alias-label-secondary);flex-wrap:wrap;align-items:center;gap:6px 8px;font-size:12px;line-height:18px;display:flex}.kQGifG_capabilityLabel{font-weight:500}.kQGifG_capabilityBadges{flex-wrap:wrap;gap:5px;display:inline-flex}.kQGifG_capabilityBadge{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-radius:4px;padding:1px 6px;line-height:16px}.kQGifG_capabilityBadge[data-known=false],.kQGifG_capabilityNotice{color:var(--dsw-alias-label-tertiary)}.kQGifG_catalogWarning,.kQGifG_costNotice{border-left:3px solid var(--dsw-alias-state-warn-label);background:color-mix(in srgb, var(--dsw-alias-state-warn-label) 8%, transparent);color:var(--dsw-alias-label-secondary);padding:7px 10px;font-size:12px;line-height:18px}.kQGifG_actions{align-items:center;gap:12px;min-height:36px;display:flex}.kQGifG_primaryButton,.kQGifG_secondaryButton{box-sizing:border-box;height:36px;font:inherit;cursor:pointer;border-radius:8px;justify-content:center;align-items:center;gap:6px;padding:0 14px;font-size:13px;line-height:20px;display:inline-flex}.kQGifG_primaryButton{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border:0}.kQGifG_primaryButton:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}.kQGifG_primaryButton:disabled{opacity:.4;cursor:default}.kQGifG_secondaryButton{border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);background:0 0}.kQGifG_secondaryButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.kQGifG_transportError{color:var(--dsw-alias-state-error-primary);font-size:13px;line-height:20px}.kQGifG_result{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;overflow:hidden}.kQGifG_result[data-status=success]{border-color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, var(--dsw-alias-border-l2))}.kQGifG_result[data-status=failure]{border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-l2))}.kQGifG_resultHeading{border-bottom:1px solid var(--dsw-alias-border-l2);justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;display:flex}.kQGifG_resultHeading strong{font-size:13px;font-weight:600;line-height:20px}.kQGifG_result[data-status=success] .kQGifG_resultHeading strong{color:var(--dsw-alias-state-success-primary)}.kQGifG_result[data-status=failure] .kQGifG_resultHeading strong{color:var(--dsw-alias-state-error-primary)}.kQGifG_resultHeading code{min-width:0;color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:17px;overflow:hidden}.kQGifG_resultTools{justify-content:flex-end;align-items:center;gap:8px;min-width:0;display:flex}.kQGifG_copyButton{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);min-height:28px;color:var(--dsw-alias-label-secondary);font:inherit;cursor:pointer;background:0 0;border-radius:6px;flex:none;justify-content:center;align-items:center;gap:5px;padding:3px 8px;font-size:11px;line-height:16px;display:inline-flex}.kQGifG_copyButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.kQGifG_copyButton[data-state=copied]{color:var(--dsw-alias-state-success-primary)}.kQGifG_copyButton[data-state=failed]{color:var(--dsw-alias-state-error-primary)}.kQGifG_metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px;margin:0;padding:12px;display:grid}.kQGifG_metrics div{min-width:0}.kQGifG_metrics dt{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:17px}.kQGifG_metrics dd{overflow-wrap:anywhere;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums;margin:2px 0 0;font-size:12px;line-height:18px}.kQGifG_errorMessage{border-bottom:1px solid var(--dsw-alias-border-l2);overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;padding:10px 12px;font-size:12px;line-height:18px}.kQGifG_nextStep{border-bottom:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-state-warn-label) 7%, transparent);padding:10px 12px}.kQGifG_nextStep strong{color:var(--dsw-alias-label-primary);margin-bottom:3px;font-size:11px;font-weight:600;line-height:17px;display:block}.kQGifG_nextStep p{overflow-wrap:anywhere;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (width<=620px){.kQGifG_fields,.kQGifG_metrics{grid-template-columns:minmax(0,1fr)}.kQGifG_resultHeading{flex-direction:column;align-items:flex-start}.kQGifG_resultHeading code{white-space:normal;overflow-wrap:anywhere;width:100%}.kQGifG_resultTools{flex-direction:column;align-items:flex-start;width:100%}}";
const tagId = "dsh-provider-probe/ProviderProbeSection.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-provider-probe";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var ProviderProbeSection_module_css_default = {
	"actions": "kQGifG_actions",
	"capabilities": "kQGifG_capabilities",
	"capabilityBadge": "kQGifG_capabilityBadge",
	"capabilityBadges": "kQGifG_capabilityBadges",
	"capabilityLabel": "kQGifG_capabilityLabel",
	"capabilityNotice": "kQGifG_capabilityNotice",
	"catalogWarning": "kQGifG_catalogWarning",
	"copyButton": "kQGifG_copyButton",
	"costNotice": "kQGifG_costNotice",
	"errorMessage": "kQGifG_errorMessage",
	"field": "kQGifG_field",
	"fields": "kQGifG_fields",
	"header": "kQGifG_header",
	"iconButton": "kQGifG_iconButton",
	"loadFailure": "kQGifG_loadFailure",
	"metrics": "kQGifG_metrics",
	"muted": "kQGifG_muted",
	"nextStep": "kQGifG_nextStep",
	"primaryButton": "kQGifG_primaryButton",
	"result": "kQGifG_result",
	"resultHeading": "kQGifG_resultHeading",
	"resultTools": "kQGifG_resultTools",
	"running": "kQGifG_running",
	"secondaryButton": "kQGifG_secondaryButton",
	"section": "kQGifG_section",
	"transportError": "kQGifG_transportError"
};

//#endregion
//#region lib/types/client/ProviderProbeSection.js
const FINISH_KEYS = {
	stop: "finish.stop",
	"tool-calls": "finish.tool-calls",
	"max-tokens": "finish.max-tokens"
};
const ADVICE_KEYS = {
	credentials: "advice.credentials",
	permission: "advice.permission",
	model_or_endpoint: "advice.model_or_endpoint",
	rate_limit_or_quota: "advice.rate_limit_or_quota",
	timeout: "advice.timeout",
	network: "advice.network",
	stream_compatibility: "advice.stream_compatibility",
	provider_server: "advice.provider_server",
	invalid_request: "advice.invalid_request",
	cancelled: "advice.cancelled",
	busy: "advice.busy",
	unknown: "advice.unknown"
};
function finishLabel(reason, t) {
	const key = FINISH_KEYS[reason];
	return key === void 0 ? reason : t(key);
}
function modalityKey(modality) {
	return modality === "text" ? "capability.text" : "capability.image";
}
function ProviderProbeSection({ catalog, probe, t }) {
	const modelListId = (0, react.useId)();
	const abortRef = (0, react.useRef)(null);
	const [requestRevision, setRequestRevision] = (0, react.useState)(0);
	const [catalogState, setCatalogState] = (0, react.useState)({ status: "loading" });
	const [provider, setProvider] = (0, react.useState)("");
	const [model, setModel] = (0, react.useState)("");
	const [running, setRunning] = (0, react.useState)(false);
	const [result, setResult] = (0, react.useState)(null);
	const [transportError, setTransportError] = (0, react.useState)(false);
	const [copyState, setCopyState] = (0, react.useState)("idle");
	(0, react.useEffect)(() => {
		let current = true;
		catalog().then((value) => {
			if (current) setCatalogState({
				status: "ready",
				value
			});
		}, () => {
			if (current) setCatalogState({ status: "error" });
		});
		return () => {
			current = false;
		};
	}, [catalog, requestRevision]);
	const providers = catalogState.status === "ready" ? catalogState.value.providers : [];
	const selectedProvider = (0, react.useMemo)(() => providers.find((entry) => entry.id === provider), [provider, providers]);
	const selectedModel = (0, react.useMemo)(() => selectedProvider?.models.find((entry) => entry.id === model.trim()), [model, selectedProvider]);
	(0, react.useEffect)(() => {
		if (catalogState.status !== "ready") return;
		const nextProvider = catalogState.value.providers.find((entry) => entry.id === provider) ?? catalogState.value.providers[0];
		if (nextProvider === void 0) {
			setProvider("");
			setModel("");
			return;
		}
		if (nextProvider.id !== provider) setProvider(nextProvider.id);
		if (nextProvider.id !== provider || model.length === 0) setModel(nextProvider.models[0]?.id ?? "");
	}, [
		catalogState,
		model.length,
		provider
	]);
	(0, react.useEffect)(() => () => {
		abortRef.current?.abort();
	}, []);
	const refresh = () => {
		setCatalogState({ status: "loading" });
		setResult(null);
		setTransportError(false);
		setCopyState("idle");
		setRequestRevision((value) => value + 1);
	};
	const changeProvider = (next) => {
		const entry = providers.find((candidate) => candidate.id === next);
		setProvider(next);
		setModel(entry?.models[0]?.id ?? "");
		setResult(null);
		setTransportError(false);
		setCopyState("idle");
	};
	const run = async () => {
		const normalizedModel = model.trim();
		if (provider.length === 0 || normalizedModel.length === 0 || running) return;
		const controller = new AbortController();
		abortRef.current = controller;
		setRunning(true);
		setResult(null);
		setTransportError(false);
		setCopyState("idle");
		try {
			setResult(await probe({
				provider,
				model: normalizedModel
			}, controller.signal));
		} catch {
			setTransportError(true);
		} finally {
			if (abortRef.current === controller) abortRef.current = null;
			setRunning(false);
		}
	};
	const limits = catalogState.status === "ready" ? catalogState.value.limits : {
		maxTokens: 8,
		timeoutMs: 2e4
	};
	const copyDiagnostic = async () => {
		if (result === null) return;
		const advice = result.status === "failure" ? t(ADVICE_KEYS[result.failure.category]) : void 0;
		setCopyState(await (0, _deepseek_ai_dsh_client_ui_primitives.writeClipboard)(buildDiagnosticReport(result, selectedModel?.inputModalities, advice)) ? "copied" : "failed");
	};
	return (0, react_jsx_runtime.jsxs)("section", {
		className: ProviderProbeSection_module_css_default.section,
		"data-provider-probe": true,
		"aria-busy": catalogState.status === "loading" || running,
		children: [
			(0, react_jsx_runtime.jsxs)("header", {
				className: ProviderProbeSection_module_css_default.header,
				children: [(0, react_jsx_runtime.jsx)("h2", { children: t("title") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: t("reload"),
					side: "bottom",
					children: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ProviderProbeSection_module_css_default.iconButton,
						"aria-label": t("reload"),
						disabled: running,
						onClick: refresh,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, { size: 16 })
					})
				})]
			}),
			catalogState.status === "loading" ? (0, react_jsx_runtime.jsx)("p", {
				className: ProviderProbeSection_module_css_default.muted,
				children: t("loading")
			}) : null,
			catalogState.status === "error" ? (0, react_jsx_runtime.jsxs)("div", {
				className: ProviderProbeSection_module_css_default.loadFailure,
				role: "alert",
				children: [(0, react_jsx_runtime.jsx)("span", { children: t("loadError") }), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: refresh,
					children: t("retry")
				})]
			}) : null,
			catalogState.status === "ready" && providers.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
				className: ProviderProbeSection_module_css_default.muted,
				children: t("noProviders")
			}) : null,
			catalogState.status === "ready" && providers.length > 0 ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				(0, react_jsx_runtime.jsxs)("div", {
					className: ProviderProbeSection_module_css_default.fields,
					children: [(0, react_jsx_runtime.jsxs)("label", {
						className: ProviderProbeSection_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", { children: t("provider") }), (0, react_jsx_runtime.jsx)("select", {
							value: provider,
							disabled: running,
							onChange: (event) => {
								changeProvider(event.currentTarget.value);
							},
							children: providers.map((entry) => (0, react_jsx_runtime.jsxs)("option", {
								value: entry.id,
								children: [
									entry.name,
									" (",
									entry.id,
									")"
								]
							}, entry.id))
						})]
					}), (0, react_jsx_runtime.jsxs)("label", {
						className: ProviderProbeSection_module_css_default.field,
						children: [
							(0, react_jsx_runtime.jsx)("span", { children: t("model") }),
							(0, react_jsx_runtime.jsx)("input", {
								value: model,
								list: modelListId,
								disabled: running,
								placeholder: t("modelPlaceholder"),
								autoComplete: "off",
								onChange: (event) => {
									setModel(event.currentTarget.value);
									setResult(null);
									setTransportError(false);
									setCopyState("idle");
								}
							}),
							(0, react_jsx_runtime.jsx)("datalist", {
								id: modelListId,
								children: selectedProvider?.models.map((entry) => (0, react_jsx_runtime.jsx)("option", {
									value: entry.id,
									children: entry.name
								}, entry.id))
							})
						]
					})]
				}),
				(0, react_jsx_runtime.jsxs)("div", {
					className: ProviderProbeSection_module_css_default.capabilities,
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: ProviderProbeSection_module_css_default.capabilityLabel,
							children: t("declaredCapabilities")
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ProviderProbeSection_module_css_default.capabilityBadges,
							children: selectedModel?.inputModalities === void 0 ? (0, react_jsx_runtime.jsx)("span", {
								className: ProviderProbeSection_module_css_default.capabilityBadge,
								"data-known": "false",
								children: t("capability.unknown")
							}) : selectedModel.inputModalities.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
								className: ProviderProbeSection_module_css_default.capabilityBadge,
								"data-known": "false",
								children: t("capability.none")
							}) : selectedModel.inputModalities.map((modality) => (0, react_jsx_runtime.jsx)("span", {
								className: ProviderProbeSection_module_css_default.capabilityBadge,
								"data-known": "true",
								children: t(modalityKey(modality))
							}, modality))
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: ProviderProbeSection_module_css_default.capabilityNotice,
							children: t("capability.notice")
						})
					]
				}),
				selectedProvider?.modelListError !== void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: ProviderProbeSection_module_css_default.catalogWarning,
					title: selectedProvider.modelListError,
					children: t("catalogWarning")
				}) : null,
				(0, react_jsx_runtime.jsx)("p", {
					className: ProviderProbeSection_module_css_default.costNotice,
					children: t("costNotice", {
						maxTokens: limits.maxTokens,
						seconds: Math.ceil(limits.timeoutMs / 1e3)
					})
				}),
				(0, react_jsx_runtime.jsxs)("div", {
					className: ProviderProbeSection_module_css_default.actions,
					children: [running ? (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ProviderProbeSection_module_css_default.secondaryButton,
						onClick: () => {
							abortRef.current?.abort();
						},
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconStopFill16, {
							size: 16,
							"aria-hidden": "true"
						}), t("cancel")]
					}) : (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: ProviderProbeSection_module_css_default.primaryButton,
						disabled: provider.length === 0 || model.trim().length === 0,
						onClick: () => {
							run();
						},
						children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlayOutline16, {
							size: 16,
							"aria-hidden": "true"
						}), t("run")]
					}), running ? (0, react_jsx_runtime.jsx)("span", {
						className: ProviderProbeSection_module_css_default.running,
						role: "status",
						children: t("running")
					}) : null]
				})
			] }) : null,
			transportError ? (0, react_jsx_runtime.jsx)("p", {
				className: ProviderProbeSection_module_css_default.transportError,
				role: "alert",
				children: t("transportError")
			}) : null,
			result !== null ? (0, react_jsx_runtime.jsxs)("div", {
				className: ProviderProbeSection_module_css_default.result,
				"data-status": result.status,
				role: result.status === "failure" ? "alert" : "status",
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: ProviderProbeSection_module_css_default.resultHeading,
					children: [(0, react_jsx_runtime.jsx)("strong", { children: t(result.status === "success" ? "success" : "failure") }), (0, react_jsx_runtime.jsxs)("div", {
						className: ProviderProbeSection_module_css_default.resultTools,
						children: [(0, react_jsx_runtime.jsxs)("code", { children: [
							result.provider,
							"/",
							result.model
						] }), (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ProviderProbeSection_module_css_default.copyButton,
							"data-state": copyState,
							onClick: () => {
								copyDiagnostic();
							},
							children: [copyState === "copied" ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, {
								size: 16,
								"aria-hidden": "true"
							}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {
								size: 16,
								"aria-hidden": "true"
							}), t(copyState === "copied" ? "copied" : copyState === "failed" ? "copyFailed" : "copyDiagnostic")]
						})]
					})]
				}), result.status === "success" ? (0, react_jsx_runtime.jsxs)("dl", {
					className: ProviderProbeSection_module_css_default.metrics,
					children: [
						(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("firstToken") }), (0, react_jsx_runtime.jsx)("dd", { children: result.firstTokenMs === null ? t("notAvailable") : t("milliseconds", { value: result.firstTokenMs }) })] }),
						(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("total") }), (0, react_jsx_runtime.jsx)("dd", { children: t("milliseconds", { value: result.totalMs }) })] }),
						(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("finishReason") }), (0, react_jsx_runtime.jsx)("dd", { children: finishLabel(result.finishReason, t) })] }),
						(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("usage") }), (0, react_jsx_runtime.jsx)("dd", { children: result.usage === void 0 ? t("notAvailable") : t("tokens", {
							input: result.usage.inputTokens,
							output: result.usage.outputTokens
						}) })] })
					]
				}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					(0, react_jsx_runtime.jsx)("p", {
						className: ProviderProbeSection_module_css_default.errorMessage,
						children: result.failure.message
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: ProviderProbeSection_module_css_default.nextStep,
						children: [(0, react_jsx_runtime.jsx)("strong", { children: t("nextStep") }), (0, react_jsx_runtime.jsx)("p", { children: t(ADVICE_KEYS[result.failure.category]) })]
					}),
					(0, react_jsx_runtime.jsxs)("dl", {
						className: ProviderProbeSection_module_css_default.metrics,
						children: [
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("errorCode") }), (0, react_jsx_runtime.jsx)("dd", { children: result.failure.code })] }),
							(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("total") }), (0, react_jsx_runtime.jsx)("dd", { children: t("milliseconds", { value: result.totalMs }) })] }),
							result.failure.status !== void 0 ? (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("httpStatus") }), (0, react_jsx_runtime.jsx)("dd", { children: result.failure.status })] }) : null,
							result.failure.requestId !== void 0 ? (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("dt", { children: t("requestId") }), (0, react_jsx_runtime.jsx)("dd", { children: result.failure.requestId })] }) : null
						]
					})
				] })]
			}) : null
		]
	});
}

//#endregion
//#region lib/types/client/locales.js
const NS = "provider-probe";
const zh = {
	nav: "供应商检测",
	title: "供应商检测",
	provider: "供应商",
	model: "模型",
	declaredCapabilities: "声明的输入能力",
	"capability.text": "文本",
	"capability.image": "图片",
	"capability.unknown": "未知",
	"capability.none": "未声明",
	"capability.notice": "来自活动模型路由的声明，不代表图片请求已经实测。",
	chooseProvider: "选择供应商",
	modelPlaceholder: "输入或选择模型 ID",
	loading: "正在读取活动路由...",
	loadError: "无法读取供应商列表",
	retry: "重新加载",
	noProviders: "当前没有活动的模型供应商。",
	reload: "刷新供应商列表",
	catalogWarning: "该供应商未能返回模型目录，仍可手动输入模型 ID。",
	costNotice: "检测会发送一个最多 {maxTokens} 输出 token 的真实请求，可能产生少量费用；{seconds} 秒后自动超时。",
	run: "开始检测",
	cancel: "取消检测",
	running: "正在等待供应商响应...",
	success: "连接成功",
	failure: "连接失败",
	firstToken: "首个 token",
	total: "总耗时",
	finishReason: "结束原因",
	usage: "Token 用量",
	inputTokens: "输入",
	outputTokens: "输出",
	errorCode: "错误代码",
	httpStatus: "HTTP 状态",
	requestId: "请求 ID",
	nextStep: "建议下一步",
	"advice.credentials": "检查供应商 API Key 是否已配置、仍然有效，并且属于当前选择的接口地址。",
	"advice.permission": "检查该 API Key 是否拥有模型访问权限，以及账号或项目权限是否正确。",
	"advice.model_or_endpoint": "核对供应商接口地址和模型 ID，然后刷新模型目录。",
	"advice.rate_limit_or_quota": "检查限流、额度和计费状态，并在供应商的限流窗口重置后重试。",
	"advice.timeout": "检查供应商可用性和网络延迟；若接口一直较慢，可适当增大 timeoutMs。",
	"advice.network": "检查 DNS、代理、防火墙、TLS 证书，以及供应商接口地址能否访问。",
	"advice.stream_compatibility": "检查接口是否返回 DSH 适配器预期的流式或 SSE 格式，并尝试供应商原生接口地址。",
	"advice.provider_server": "稍后重试；若持续失败，请携带请求 ID 联系供应商。",
	"advice.invalid_request": "选择供应商并填写有效的模型 ID 后重试。",
	"advice.cancelled": "准备好后重新运行检测。",
	"advice.busy": "等待当前检测结束，或取消当前检测后再重试。",
	"advice.unknown": "查看脱敏错误和请求 ID，并检查适配器或供应商日志。",
	copyDiagnostic: "复制诊断",
	copied: "已复制",
	copyFailed: "复制失败",
	notAvailable: "未提供",
	milliseconds: "{value} 毫秒",
	tokens: "{input} 输入 / {output} 输出",
	transportError: "检测请求未能发送到 DSH Host。",
	"finish.stop": "正常停止",
	"finish.tool-calls": "工具调用",
	"finish.max-tokens": "达到输出上限"
};
const en = {
	nav: "Provider probe",
	title: "Provider probe",
	provider: "Provider",
	model: "Model",
	declaredCapabilities: "Declared input",
	"capability.text": "Text",
	"capability.image": "Image",
	"capability.unknown": "Unknown",
	"capability.none": "None declared",
	"capability.notice": "Reported by the active model route; image requests are not exercised.",
	chooseProvider: "Choose a provider",
	modelPlaceholder: "Enter or choose a model ID",
	loading: "Reading active routes...",
	loadError: "Could not load providers",
	retry: "Reload",
	noProviders: "No active model providers are available.",
	reload: "Refresh provider list",
	catalogWarning: "This provider could not return a model catalog. You can still enter a model ID.",
	costNotice: "The probe sends a real request capped at {maxTokens} output tokens and may incur a small charge. It times out after {seconds} seconds.",
	run: "Run probe",
	cancel: "Cancel probe",
	running: "Waiting for the provider...",
	success: "Connection succeeded",
	failure: "Connection failed",
	firstToken: "First token",
	total: "Total time",
	finishReason: "Finish reason",
	usage: "Token usage",
	inputTokens: "Input",
	outputTokens: "Output",
	errorCode: "Error code",
	httpStatus: "HTTP status",
	requestId: "Request ID",
	nextStep: "Suggested next step",
	"advice.credentials": FAILURE_ADVICE_EN.credentials,
	"advice.permission": FAILURE_ADVICE_EN.permission,
	"advice.model_or_endpoint": FAILURE_ADVICE_EN.model_or_endpoint,
	"advice.rate_limit_or_quota": FAILURE_ADVICE_EN.rate_limit_or_quota,
	"advice.timeout": FAILURE_ADVICE_EN.timeout,
	"advice.network": FAILURE_ADVICE_EN.network,
	"advice.stream_compatibility": FAILURE_ADVICE_EN.stream_compatibility,
	"advice.provider_server": FAILURE_ADVICE_EN.provider_server,
	"advice.invalid_request": FAILURE_ADVICE_EN.invalid_request,
	"advice.cancelled": FAILURE_ADVICE_EN.cancelled,
	"advice.busy": FAILURE_ADVICE_EN.busy,
	"advice.unknown": FAILURE_ADVICE_EN.unknown,
	copyDiagnostic: "Copy diagnostic",
	copied: "Copied",
	copyFailed: "Copy failed",
	notAvailable: "Not reported",
	milliseconds: "{value} ms",
	tokens: "{input} input / {output} output",
	transportError: "The probe request did not reach the DSH Host.",
	"finish.stop": "Normal stop",
	"finish.tool-calls": "Tool calls",
	"finish.max-tokens": "Output limit reached"
};

//#endregion
//#region lib/types/client/index.js
const inject = [
	"slots",
	"locale",
	"remote"
];
async function apply(ctx) {
	await ctx.remote.$mount(TYPERT_REMOTE);
	const remote = ctx.get("remote.providerProbe");
	if (remote === void 0) throw new Error("provider-probe: mounted Remote namespace is unavailable");
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), "provider-probe: dictionaries");
	const t = ctx.locale.bind(NS);
	const injected = () => ({
		catalog: async () => {
			const result = await remote.catalog();
			if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
			return result.value;
		},
		probe: async (request, signal) => {
			const result = await remote.probe(request, signal);
			if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
			return result.value;
		}
	});
	ctx.slots.inject("settings.section", () => ctx.slots.register({
		name: "settings.section",
		id: "provider-probe",
		order: 25,
		label: () => t("nav"),
		locale: NS,
		inject: injected
	}, ProviderProbeSection));
}

//#endregion
exports.apply = apply;
exports.inject = inject;
return module.exports; } });
//# sourceMappingURL=client.js.map