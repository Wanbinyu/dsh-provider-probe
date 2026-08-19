import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { buildDiagnosticReport, } from "../client.js";
import { IconCheckOutline16, IconCopyOutline16, IconPlayOutline16, IconRefreshOutline16, IconStopFill16, Tooltip, writeClipboard, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './ProviderProbeSection.module.css';
const FINISH_KEYS = {
    stop: 'finish.stop',
    'tool-calls': 'finish.tool-calls',
    'max-tokens': 'finish.max-tokens',
};
function finishLabel(reason, t) {
    const key = FINISH_KEYS[reason];
    return key === undefined ? reason : t(key);
}
function modalityKey(modality) {
    return modality === 'text' ? 'capability.text' : 'capability.image';
}
export function ProviderProbeSection({ catalog, probe, t }) {
    const modelListId = useId();
    const abortRef = useRef(null);
    const [requestRevision, setRequestRevision] = useState(0);
    const [catalogState, setCatalogState] = useState({ status: 'loading' });
    const [provider, setProvider] = useState('');
    const [model, setModel] = useState('');
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [transportError, setTransportError] = useState(false);
    const [copyState, setCopyState] = useState('idle');
    useEffect(() => {
        let current = true;
        void catalog().then((value) => { if (current)
            setCatalogState({ status: 'ready', value }); }, () => { if (current)
            setCatalogState({ status: 'error' }); });
        return () => { current = false; };
    }, [catalog, requestRevision]);
    const providers = catalogState.status === 'ready' ? catalogState.value.providers : [];
    const selectedProvider = useMemo(() => providers.find(entry => entry.id === provider), [provider, providers]);
    const selectedModel = useMemo(() => selectedProvider?.models.find(entry => entry.id === model.trim()), [model, selectedProvider]);
    useEffect(() => {
        if (catalogState.status !== 'ready')
            return;
        const nextProvider = catalogState.value.providers.find(entry => entry.id === provider)
            ?? catalogState.value.providers[0];
        if (nextProvider === undefined) {
            setProvider('');
            setModel('');
            return;
        }
        if (nextProvider.id !== provider)
            setProvider(nextProvider.id);
        if (nextProvider.id !== provider || model.length === 0)
            setModel(nextProvider.models[0]?.id ?? '');
    }, [catalogState, model.length, provider]);
    useEffect(() => () => { abortRef.current?.abort(); }, []);
    const refresh = () => {
        setCatalogState({ status: 'loading' });
        setResult(null);
        setTransportError(false);
        setCopyState('idle');
        setRequestRevision(value => value + 1);
    };
    const changeProvider = (next) => {
        const entry = providers.find(candidate => candidate.id === next);
        setProvider(next);
        setModel(entry?.models[0]?.id ?? '');
        setResult(null);
        setTransportError(false);
        setCopyState('idle');
    };
    const run = async () => {
        const normalizedModel = model.trim();
        if (provider.length === 0 || normalizedModel.length === 0 || running)
            return;
        const controller = new AbortController();
        abortRef.current = controller;
        setRunning(true);
        setResult(null);
        setTransportError(false);
        setCopyState('idle');
        try {
            setResult(await probe({ provider, model: normalizedModel }, controller.signal));
        }
        catch {
            setTransportError(true);
        }
        finally {
            if (abortRef.current === controller)
                abortRef.current = null;
            setRunning(false);
        }
    };
    const limits = catalogState.status === 'ready'
        ? catalogState.value.limits
        : { maxTokens: 8, timeoutMs: 20000 };
    const copyDiagnostic = async () => {
        if (result === null)
            return;
        const copied = await writeClipboard(buildDiagnosticReport(result, selectedModel?.inputModalities));
        setCopyState(copied ? 'copied' : 'failed');
    };
    return (_jsxs("section", { className: css.section, "data-provider-probe": true, "aria-busy": catalogState.status === 'loading' || running, children: [_jsxs("header", { className: css.header, children: [_jsx("h2", { children: t('title') }), _jsx(Tooltip, { label: t('reload'), side: "bottom", children: _jsx("button", { type: "button", className: css.iconButton, "aria-label": t('reload'), disabled: running, onClick: refresh, children: _jsx(IconRefreshOutline16, { size: 16 }) }) })] }), catalogState.status === 'loading' ? _jsx("p", { className: css.muted, children: t('loading') }) : null, catalogState.status === 'error' ? (_jsxs("div", { className: css.loadFailure, role: "alert", children: [_jsx("span", { children: t('loadError') }), _jsx("button", { type: "button", onClick: refresh, children: t('retry') })] })) : null, catalogState.status === 'ready' && providers.length === 0 ? (_jsx("p", { className: css.muted, children: t('noProviders') })) : null, catalogState.status === 'ready' && providers.length > 0 ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: css.fields, children: [_jsxs("label", { className: css.field, children: [_jsx("span", { children: t('provider') }), _jsx("select", { value: provider, disabled: running, onChange: event => { changeProvider(event.currentTarget.value); }, children: providers.map(entry => _jsxs("option", { value: entry.id, children: [entry.name, " (", entry.id, ")"] }, entry.id)) })] }), _jsxs("label", { className: css.field, children: [_jsx("span", { children: t('model') }), _jsx("input", { value: model, list: modelListId, disabled: running, placeholder: t('modelPlaceholder'), autoComplete: "off", onChange: event => {
                                            setModel(event.currentTarget.value);
                                            setResult(null);
                                            setTransportError(false);
                                            setCopyState('idle');
                                        } }), _jsx("datalist", { id: modelListId, children: selectedProvider?.models.map(entry => _jsx("option", { value: entry.id, children: entry.name }, entry.id)) })] })] }), _jsxs("div", { className: css.capabilities, children: [_jsx("span", { className: css.capabilityLabel, children: t('declaredCapabilities') }), _jsx("span", { className: css.capabilityBadges, children: selectedModel?.inputModalities === undefined ? (_jsx("span", { className: css.capabilityBadge, "data-known": "false", children: t('capability.unknown') })) : selectedModel.inputModalities.length === 0 ? (_jsx("span", { className: css.capabilityBadge, "data-known": "false", children: t('capability.none') })) : selectedModel.inputModalities.map(modality => (_jsx("span", { className: css.capabilityBadge, "data-known": "true", children: t(modalityKey(modality)) }, modality))) }), _jsx("span", { className: css.capabilityNotice, children: t('capability.notice') })] }), selectedProvider?.modelListError !== undefined ? (_jsx("p", { className: css.catalogWarning, title: selectedProvider.modelListError, children: t('catalogWarning') })) : null, _jsx("p", { className: css.costNotice, children: t('costNotice', {
                            maxTokens: limits.maxTokens,
                            seconds: Math.ceil(limits.timeoutMs / 1000),
                        }) }), _jsxs("div", { className: css.actions, children: [running ? (_jsxs("button", { type: "button", className: css.secondaryButton, onClick: () => { abortRef.current?.abort(); }, children: [_jsx(IconStopFill16, { size: 16, "aria-hidden": "true" }), t('cancel')] })) : (_jsxs("button", { type: "button", className: css.primaryButton, disabled: provider.length === 0 || model.trim().length === 0, onClick: () => { void run(); }, children: [_jsx(IconPlayOutline16, { size: 16, "aria-hidden": "true" }), t('run')] })), running ? _jsx("span", { className: css.running, role: "status", children: t('running') }) : null] })] })) : null, transportError ? _jsx("p", { className: css.transportError, role: "alert", children: t('transportError') }) : null, result !== null ? (_jsxs("div", { className: css.result, "data-status": result.status, role: result.status === 'failure' ? 'alert' : 'status', children: [_jsxs("div", { className: css.resultHeading, children: [_jsx("strong", { children: t(result.status === 'success' ? 'success' : 'failure') }), _jsxs("div", { className: css.resultTools, children: [_jsxs("code", { children: [result.provider, "/", result.model] }), _jsxs("button", { type: "button", className: css.copyButton, "data-state": copyState, onClick: () => { void copyDiagnostic(); }, children: [copyState === 'copied'
                                                ? _jsx(IconCheckOutline16, { size: 16, "aria-hidden": "true" })
                                                : _jsx(IconCopyOutline16, { size: 16, "aria-hidden": "true" }), t(copyState === 'copied'
                                                ? 'copied'
                                                : copyState === 'failed' ? 'copyFailed' : 'copyDiagnostic')] })] })] }), result.status === 'success' ? (_jsxs("dl", { className: css.metrics, children: [_jsxs("div", { children: [_jsx("dt", { children: t('firstToken') }), _jsx("dd", { children: result.firstTokenMs === null ? t('notAvailable') : t('milliseconds', { value: result.firstTokenMs }) })] }), _jsxs("div", { children: [_jsx("dt", { children: t('total') }), _jsx("dd", { children: t('milliseconds', { value: result.totalMs }) })] }), _jsxs("div", { children: [_jsx("dt", { children: t('finishReason') }), _jsx("dd", { children: finishLabel(result.finishReason, t) })] }), _jsxs("div", { children: [_jsx("dt", { children: t('usage') }), _jsx("dd", { children: result.usage === undefined ? t('notAvailable') : t('tokens', { input: result.usage.inputTokens, output: result.usage.outputTokens }) })] })] })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: css.errorMessage, children: result.failure.message }), _jsxs("dl", { className: css.metrics, children: [_jsxs("div", { children: [_jsx("dt", { children: t('errorCode') }), _jsx("dd", { children: result.failure.code })] }), _jsxs("div", { children: [_jsx("dt", { children: t('total') }), _jsx("dd", { children: t('milliseconds', { value: result.totalMs }) })] }), result.failure.status !== undefined ? _jsxs("div", { children: [_jsx("dt", { children: t('httpStatus') }), _jsx("dd", { children: result.failure.status })] }) : null, result.failure.requestId !== undefined ? _jsxs("div", { children: [_jsx("dt", { children: t('requestId') }), _jsx("dd", { children: result.failure.requestId })] }) : null] })] }))] })) : null] }));
}
