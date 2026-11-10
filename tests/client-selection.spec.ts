import { createElement, type ReactNode } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ProviderProbeSection, type ProviderProbeSectionProps } from '../src/client/ProviderProbeSection.tsx'
import type { ProbeCatalog } from '../src/types.ts'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => children,
  writeClipboard: vi.fn(),
}))
vi.mock('../src/client/hostIcon.ts', () => ({ hostIcon: () => () => null }))

const catalog: ProbeCatalog = {
  providers: [
    { id: 'first', name: 'First', models: [{ id: 'first-default', name: 'First default' }] },
    { id: 'second', name: 'Second', models: [{ id: 'second-default', name: 'Second default' }] },
  ],
  limits: { timeoutMs: 20000, maxTokens: 8 },
}
const renderers: ReactTestRenderer[] = []

afterEach(() => {
  act(() => { renderers.splice(0).forEach(renderer => { renderer.unmount() }) })
})

async function mount(readCatalog = vi.fn().mockResolvedValue(catalog)) {
  const probe = vi.fn().mockResolvedValue({
    status: 'success', provider: 'first', model: 'custom-model',
    firstTokenMs: 1, totalMs: 2, finishReason: 'stop',
  })
  let renderer!: ReactTestRenderer
  await act(async () => {
    renderer = create(createElement(ProviderProbeSection, {
      catalog: readCatalog, probe, t: (key: string) => key,
    } as unknown as ProviderProbeSectionProps))
  })
  renderers.push(renderer)
  const model = () => renderer.root.findByType('input')
  const button = (label: string) => renderer.root.findAllByType('button').find(
    node => node.props['aria-label'] === label || node.children.includes(label),
  )!
  const changeModel = (value: string) => {
    act(() => { model().props.onChange({ currentTarget: { value } }) })
  }
  return { renderer, model, button, changeModel, probe, readCatalog }
}

describe('provider and model selection', () => {
  it('selects the first provider and model when the catalog first loads', async () => {
    const { renderer, model } = await mount()
    expect(renderer.root.findByType('select').props.value).toBe('first')
    expect(model().props.value).toBe('first-default')
  })

  it('keeps an explicitly cleared model empty and disables probing', async () => {
    const { model, button, changeModel, renderer } = await mount()
    changeModel('')
    expect(model().props.value).toBe('')
    expect(button('run').props.disabled).toBe(true)
    expect(renderer.root.findByType('datalist').findAllByType('option')).toHaveLength(1)
  })

  it('allows a custom model to be entered and probed after clearing', async () => {
    const { changeModel, button, probe } = await mount()
    changeModel('')
    changeModel(' custom-model ')
    expect(button('run').props.disabled).toBe(false)
    await act(async () => { button('run').props.onClick() })
    expect(probe).toHaveBeenCalledWith(
      { provider: 'first', model: 'custom-model' }, expect.any(AbortSignal),
    )
  })

  it.each(['', 'custom-model'])('preserves the edited model %j on catalog refresh', async value => {
    const { model, button, changeModel, readCatalog } = await mount()
    changeModel(value)
    await act(async () => { button('reload').props.onClick() })
    expect(readCatalog).toHaveBeenCalledTimes(2)
    expect(model().props.value).toBe(value)
  })

  it('selects the new provider default after switching providers', async () => {
    const { renderer, model, changeModel } = await mount()
    changeModel('')
    act(() => {
      renderer.root.findByType('select').props.onChange({ currentTarget: { value: 'second' } })
    })
    expect(model().props.value).toBe('second-default')
  })

  it('selects a valid default when the selected provider disappears on refresh', async () => {
    const readCatalog = vi.fn().mockResolvedValueOnce(catalog).mockResolvedValueOnce({
      ...catalog, providers: [catalog.providers[1]],
    })
    const { renderer, model, button, changeModel } = await mount(readCatalog)
    changeModel('custom-model')
    await act(async () => { button('reload').props.onClick() })
    expect(renderer.root.findByType('select').props.value).toBe('second')
    expect(model().props.value).toBe('second-default')
  })
})
