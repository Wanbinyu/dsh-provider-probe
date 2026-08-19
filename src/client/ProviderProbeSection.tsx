import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  buildDiagnosticReport,
  type ProbeCatalog,
  type ProbeInputModality,
  type ProbeRequest,
  type ProbeResult,
} from '../client.ts'
import {
  IconCheckOutline16,
  IconCopyOutline16,
  IconPlayOutline16,
  IconRefreshOutline16,
  IconStopFill16,
  Tooltip,
  writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ProviderProbeKey } from './locales.ts'
import css from './ProviderProbeSection.module.css'

export interface ProviderProbeSectionInjected {
  catalog: () => Promise<ProbeCatalog>
  probe: (request: ProbeRequest, signal: AbortSignal) => Promise<ProbeResult>
}

export type ProviderProbeSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'provider-probe'>
  & InjectFace<ProviderProbeSectionInjected>

type CatalogState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; value: ProbeCatalog }

const FINISH_KEYS = {
  stop: 'finish.stop',
  'tool-calls': 'finish.tool-calls',
  'max-tokens': 'finish.max-tokens',
} satisfies Record<string, ProviderProbeKey>

function finishLabel(reason: string, t: ProviderProbeSectionProps['t']): string {
  const key = FINISH_KEYS[reason as keyof typeof FINISH_KEYS]
  return key === undefined ? reason : t(key)
}

function modalityKey(modality: ProbeInputModality): ProviderProbeKey {
  return modality === 'text' ? 'capability.text' : 'capability.image'
}

export function ProviderProbeSection({ catalog, probe, t }: ProviderProbeSectionProps): ReactNode {
  const modelListId = useId()
  const abortRef = useRef<AbortController | null>(null)
  const [requestRevision, setRequestRevision] = useState(0)
  const [catalogState, setCatalogState] = useState<CatalogState>({ status: 'loading' })
  const [provider, setProvider] = useState('')
  const [model, setModel] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ProbeResult | null>(null)
  const [transportError, setTransportError] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    let current = true
    void catalog().then(
      (value) => { if (current) setCatalogState({ status: 'ready', value }) },
      () => { if (current) setCatalogState({ status: 'error' }) },
    )
    return () => { current = false }
  }, [catalog, requestRevision])

  const providers = catalogState.status === 'ready' ? catalogState.value.providers : []
  const selectedProvider = useMemo(
    () => providers.find(entry => entry.id === provider),
    [provider, providers],
  )
  const selectedModel = useMemo(
    () => selectedProvider?.models.find(entry => entry.id === model.trim()),
    [model, selectedProvider],
  )

  useEffect(() => {
    if (catalogState.status !== 'ready') return
    const nextProvider = catalogState.value.providers.find(entry => entry.id === provider)
      ?? catalogState.value.providers[0]
    if (nextProvider === undefined) {
      setProvider('')
      setModel('')
      return
    }
    if (nextProvider.id !== provider) setProvider(nextProvider.id)
    if (nextProvider.id !== provider || model.length === 0) setModel(nextProvider.models[0]?.id ?? '')
  }, [catalogState, model.length, provider])

  useEffect(() => () => { abortRef.current?.abort() }, [])

  const refresh = (): void => {
    setCatalogState({ status: 'loading' })
    setResult(null)
    setTransportError(false)
    setCopyState('idle')
    setRequestRevision(value => value + 1)
  }

  const changeProvider = (next: string): void => {
    const entry = providers.find(candidate => candidate.id === next)
    setProvider(next)
    setModel(entry?.models[0]?.id ?? '')
    setResult(null)
    setTransportError(false)
    setCopyState('idle')
  }

  const run = async (): Promise<void> => {
    const normalizedModel = model.trim()
    if (provider.length === 0 || normalizedModel.length === 0 || running) return
    const controller = new AbortController()
    abortRef.current = controller
    setRunning(true)
    setResult(null)
    setTransportError(false)
    setCopyState('idle')
    try {
      setResult(await probe({ provider, model: normalizedModel }, controller.signal))
    } catch {
      setTransportError(true)
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setRunning(false)
    }
  }

  const limits = catalogState.status === 'ready'
    ? catalogState.value.limits
    : { maxTokens: 8, timeoutMs: 20000 }

  const copyDiagnostic = async (): Promise<void> => {
    if (result === null) return
    const copied = await writeClipboard(buildDiagnosticReport(result, selectedModel?.inputModalities))
    setCopyState(copied ? 'copied' : 'failed')
  }

  return (
    <section className={css.section} data-provider-probe aria-busy={catalogState.status === 'loading' || running}>
      <header className={css.header}>
        <h2>{t('title')}</h2>
        <Tooltip label={t('reload')} side="bottom">
          <button
            type="button"
            className={css.iconButton}
            aria-label={t('reload')}
            disabled={running}
            onClick={refresh}
          >
            <IconRefreshOutline16 size={16} />
          </button>
        </Tooltip>
      </header>

      {catalogState.status === 'loading' ? <p className={css.muted}>{t('loading')}</p> : null}
      {catalogState.status === 'error' ? (
        <div className={css.loadFailure} role="alert">
          <span>{t('loadError')}</span>
          <button type="button" onClick={refresh}>{t('retry')}</button>
        </div>
      ) : null}
      {catalogState.status === 'ready' && providers.length === 0 ? (
        <p className={css.muted}>{t('noProviders')}</p>
      ) : null}

      {catalogState.status === 'ready' && providers.length > 0 ? (
        <>
          <div className={css.fields}>
            <label className={css.field}>
              <span>{t('provider')}</span>
              <select value={provider} disabled={running} onChange={event => { changeProvider(event.currentTarget.value) }}>
                {providers.map(entry => <option value={entry.id} key={entry.id}>{entry.name} ({entry.id})</option>)}
              </select>
            </label>
            <label className={css.field}>
              <span>{t('model')}</span>
              <input
                value={model}
                list={modelListId}
                disabled={running}
                placeholder={t('modelPlaceholder')}
                autoComplete="off"
                onChange={event => {
                  setModel(event.currentTarget.value)
                  setResult(null)
                  setTransportError(false)
                  setCopyState('idle')
                }}
              />
              <datalist id={modelListId}>
                {selectedProvider?.models.map(entry => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
              </datalist>
            </label>
          </div>

          <div className={css.capabilities}>
            <span className={css.capabilityLabel}>{t('declaredCapabilities')}</span>
            <span className={css.capabilityBadges}>
              {selectedModel?.inputModalities === undefined ? (
                <span className={css.capabilityBadge} data-known="false">{t('capability.unknown')}</span>
              ) : selectedModel.inputModalities.length === 0 ? (
                <span className={css.capabilityBadge} data-known="false">{t('capability.none')}</span>
              ) : selectedModel.inputModalities.map(modality => (
                <span className={css.capabilityBadge} data-known="true" key={modality}>
                  {t(modalityKey(modality))}
                </span>
              ))}
            </span>
            <span className={css.capabilityNotice}>{t('capability.notice')}</span>
          </div>

          {selectedProvider?.modelListError !== undefined ? (
            <p className={css.catalogWarning} title={selectedProvider.modelListError}>{t('catalogWarning')}</p>
          ) : null}

          <p className={css.costNotice}>
            {t('costNotice', {
              maxTokens: limits.maxTokens,
              seconds: Math.ceil(limits.timeoutMs / 1000),
            })}
          </p>

          <div className={css.actions}>
            {running ? (
              <button type="button" className={css.secondaryButton} onClick={() => { abortRef.current?.abort() }}>
                <IconStopFill16 size={16} aria-hidden="true" />
                {t('cancel')}
              </button>
            ) : (
              <button
                type="button"
                className={css.primaryButton}
                disabled={provider.length === 0 || model.trim().length === 0}
                onClick={() => { void run() }}
              >
                <IconPlayOutline16 size={16} aria-hidden="true" />
                {t('run')}
              </button>
            )}
            {running ? <span className={css.running} role="status">{t('running')}</span> : null}
          </div>
        </>
      ) : null}

      {transportError ? <p className={css.transportError} role="alert">{t('transportError')}</p> : null}
      {result !== null ? (
        <div className={css.result} data-status={result.status} role={result.status === 'failure' ? 'alert' : 'status'}>
          <div className={css.resultHeading}>
            <strong>{t(result.status === 'success' ? 'success' : 'failure')}</strong>
            <div className={css.resultTools}>
              <code>{result.provider}/{result.model}</code>
              <button
                type="button"
                className={css.copyButton}
                data-state={copyState}
                onClick={() => { void copyDiagnostic() }}
              >
                {copyState === 'copied'
                  ? <IconCheckOutline16 size={16} aria-hidden="true" />
                  : <IconCopyOutline16 size={16} aria-hidden="true" />}
                {t(copyState === 'copied'
                  ? 'copied'
                  : copyState === 'failed' ? 'copyFailed' : 'copyDiagnostic')}
              </button>
            </div>
          </div>
          {result.status === 'success' ? (
            <dl className={css.metrics}>
              <div><dt>{t('firstToken')}</dt><dd>{result.firstTokenMs === null ? t('notAvailable') : t('milliseconds', { value: result.firstTokenMs })}</dd></div>
              <div><dt>{t('total')}</dt><dd>{t('milliseconds', { value: result.totalMs })}</dd></div>
              <div><dt>{t('finishReason')}</dt><dd>{finishLabel(result.finishReason, t)}</dd></div>
              <div><dt>{t('usage')}</dt><dd>{result.usage === undefined ? t('notAvailable') : t('tokens', { input: result.usage.inputTokens, output: result.usage.outputTokens })}</dd></div>
            </dl>
          ) : (
            <>
              <p className={css.errorMessage}>{result.failure.message}</p>
              <dl className={css.metrics}>
                <div><dt>{t('errorCode')}</dt><dd>{result.failure.code}</dd></div>
                <div><dt>{t('total')}</dt><dd>{t('milliseconds', { value: result.totalMs })}</dd></div>
                {result.failure.status !== undefined ? <div><dt>{t('httpStatus')}</dt><dd>{result.failure.status}</dd></div> : null}
                {result.failure.requestId !== undefined ? <div><dt>{t('requestId')}</dt><dd>{result.failure.requestId}</dd></div> : null}
              </dl>
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
