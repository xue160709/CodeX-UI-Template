import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type {
  ClaudeAgentConfigSource,
  ClaudeAgentModelProvider,
  ClaudeAgentSettings,
  ClaudeAgentSettingsSnapshot,
} from '../claude-chat-types'
import { IconInline } from '../icon-inline'
import { getInitialLocale, translate, useI18n } from '../i18n/i18n'

const SETTINGS_CHANGED_EVENT = 'claude-agent-settings:changed'

type EditableProviderField = Exclude<keyof ClaudeAgentModelProvider, 'id'>

export function ClaudeAgentSettingsPage() {
  const { t } = useI18n()
  const [configSource, setConfigSource] = useState<ClaudeAgentConfigSource>('settings')
  const [providers, setProviders] = useState<ClaudeAgentModelProvider[]>(() => [createModelProvider()])
  /** 左侧列表：仅决定下方表单在编辑哪一条，与聊天使用的条目无关 */
  const [editingProviderId, setEditingProviderId] = useState('')
  /** 持久化字段：与聊天输入框模型菜单一致，保存设置时不得被「编辑中」条目覆盖 */
  const [chatActiveProviderId, setChatActiveProviderId] = useState('')
  /** 选中的实际请求模型；空则沿用该条目的默认模型字段 */
  const [chatActiveAnthropicModel, setChatActiveAnthropicModel] = useState('')
  const [envStatusTags, setEnvStatusTags] = useState<string[]>(() => [translate(getInitialLocale(), 'settings.models.envNotLoaded')])
  const [status, setStatus] = useState('')
  const [saveDisabled, setSaveDisabled] = useState(false)
  const [busy, setBusy] = useState(false)

  const editingProvider = useMemo(
    () => providers.find((provider) => provider.id === editingProviderId) ?? providers[0],
    [editingProviderId, providers],
  )

  const applySnapshot = useCallback((snapshot: ClaudeAgentSettingsSnapshot) => {
    const nextProviders = snapshot.settings.providers.length
      ? snapshot.settings.providers.map((provider) => ({ ...provider }))
      : [createModelProvider()]
    const nextChatActiveId = nextProviders.some((provider) => provider.id === snapshot.settings.activeProviderId)
      ? snapshot.settings.activeProviderId
      : nextProviders[0].id

    setConfigSource(snapshot.settings.configSource)
    setProviders(nextProviders)
    setChatActiveProviderId(nextChatActiveId)
    setChatActiveAnthropicModel(snapshot.settings.activeAnthropicModel ?? '')
    setEditingProviderId((prev) =>
      nextProviders.some((provider) => provider.id === prev) ? prev : nextProviders[0].id,
    )
    setEnvStatusTags(createEnvStatusTags(snapshot, t))
  }, [t])

  const load = useCallback(async () => {
    if (!window.claudeChat) {
      setStatus(t('settings.models.bridgeUnavailable'))
      setSaveDisabled(true)
      return
    }
    setStatus(t('settings.models.loading'))
    try {
      applySnapshot(await window.claudeChat.getSettings())
      setSaveDisabled(false)
      setStatus(t('settings.models.loaded'))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }, [applySnapshot, t])

  const save = useCallback(async () => {
    if (!window.claudeChat) {
      setStatus(t('settings.models.bridgeUnavailable'))
      return
    }
    const nextProviders = providers.length ? providers : [createModelProvider()]
    const persistedChatId = nextProviders.some((provider) => provider.id === chatActiveProviderId)
      ? chatActiveProviderId
      : nextProviders[0].id
    const overlay = pruneStoredAnthropicOverlay(nextProviders, persistedChatId, chatActiveAnthropicModel)
    const payload: ClaudeAgentSettings = {
      configSource,
      activeProviderId: persistedChatId,
      activeAnthropicModel: overlay,
      providers: nextProviders,
    }

    setBusy(true)
    setStatus(t('settings.models.saving'))
    try {
      const snapshot = await window.claudeChat.saveSettings(payload)
      applySnapshot(snapshot)
      window.dispatchEvent(new CustomEvent('claude-agent-settings:changed', { detail: snapshot }))
      setStatus(t('settings.models.saved'))
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      setBusy(false)
    }
  }, [applySnapshot, chatActiveAnthropicModel, chatActiveProviderId, configSource, providers, t])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void save()
  }

  const addProvider = () => {
    const provider = createModelProvider()
    setProviders((current) => [...current, provider])
    setEditingProviderId(provider.id)
    setStatus(t('settings.models.addedProvider'))
  }

  const removeProvider = (providerId: string) => {
    if (providers.length <= 1) return

    const nextProviders = providers.filter((provider) => provider.id !== providerId)
    setProviders(nextProviders)
    if (editingProviderId === providerId) {
      setEditingProviderId(nextProviders[0]?.id ?? '')
    }
    if (chatActiveProviderId === providerId) {
      setChatActiveProviderId(nextProviders[0]?.id ?? '')
    }
    setStatus(t('settings.models.removedProvider'))
  }

  const updateEditingProvider = (field: EditableProviderField, value: string) => {
    if (!editingProvider) return
    setProviders((current) =>
      current.map((provider) => (provider.id === editingProvider.id ? { ...provider, [field]: value } : provider)),
    )
  }

  useEffect(() => {
    const onExternal = (event: Event) => {
      const detail = (event as CustomEvent<ClaudeAgentSettingsSnapshot>).detail
      const id = detail.settings.activeProviderId
      if (detail.settings.providers.some((provider) => provider.id === id)) {
        setChatActiveProviderId(id)
        setChatActiveAnthropicModel(detail.settings.activeAnthropicModel ?? '')
      }
    }
    window.addEventListener(SETTINGS_CHANGED_EVENT, onExternal)
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, onExternal)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="app-main-inner settings-page settings-page--models" id="panel-settings" aria-hidden={false}>
      <header className="settings-page-header">
        <h1 className="app-main-heading">{t('settings.models.pageTitle')}</h1>
        <p className="settings-lede">{t('settings.models.pageLede')}</p>
      </header>

      <form className="settings-stack" id="claude-settings-form" onSubmit={handleSubmit}>
        <section className="settings-section" aria-labelledby="settings-section-source-heading">
          <h2 id="settings-section-source-heading" className="settings-section-heading">
            {t('settings.models.configSource')}
          </h2>
          <div className="settings-segmented" role="radiogroup" aria-label={t('settings.models.configSourceRadiogroup')}>
            <label className={configSource === 'settings' ? 'settings-segment is-selected' : 'settings-segment'}>
              <input
                type="radio"
                name="configSource"
                value="settings"
                className="settings-segment-input"
                checked={configSource === 'settings'}
                onChange={() => setConfigSource('settings')}
              />
              <span className="settings-segment-body">
                <span className="settings-segment-top">
                  <span className="settings-segment-title">
                    <IconInline name="settings" />
                    <span>{t('settings.models.settingsFirst')}</span>
                  </span>
                  <span className="settings-segment-radio" aria-hidden="true" />
                </span>
                <span className="settings-segment-desc">{t('settings.models.settingsFirstDesc')}</span>
              </span>
            </label>
            <label className={configSource === 'env' ? 'settings-segment is-selected' : 'settings-segment'}>
              <input
                type="radio"
                name="configSource"
                value="env"
                className="settings-segment-input"
                checked={configSource === 'env'}
                onChange={() => setConfigSource('env')}
              />
              <span className="settings-segment-body">
                <span className="settings-segment-top">
                  <span className="settings-segment-title">
                    <IconInline name="server" />
                    <span>{t('settings.models.envOnly')}</span>
                  </span>
                  <span className="settings-segment-radio" aria-hidden="true" />
                </span>
                <span className="settings-segment-desc">{t('settings.models.envOnlyDesc')}</span>
              </span>
            </label>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-section-providers-heading">
          <div className="settings-section-header">
            <h2 id="settings-section-providers-heading" className="settings-section-heading">
              {t('settings.models.providersHeading')}
            </h2>
            <button type="button" className="btn btn-ghost btn-compact" onClick={addProvider}>
              <IconInline name="plus" />
              <span>{t('settings.models.add')}</span>
            </button>
          </div>
          <p className="settings-section-caption">{t('settings.models.providersCaption')}</p>
          <div className="settings-provider-list" role="list" aria-label={t('settings.models.providerListAria')}>
            {providers.map((provider) => {
              const isEditing = provider.id === editingProvider?.id
              return (
                <div
                  key={provider.id}
                  className={['settings-provider-row', isEditing ? 'is-editing' : ''].filter(Boolean).join(' ')}
                >
                  <button
                    type="button"
                    className="settings-provider-select"
                    aria-current={isEditing ? 'true' : undefined}
                    onClick={() => setEditingProviderId(provider.id)}
                  >
                    <span className="settings-provider-chevron" aria-hidden="true">
                      <IconInline name="chevron" />
                    </span>
                    <span className="settings-provider-copy">
                      <span className="settings-provider-model">{providerDisplayName(provider, t)}</span>
                      <span className="settings-provider-meta">{providerMeta(provider, t)}</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="settings-icon-button"
                    title={providers.length <= 1 ? t('settings.models.deleteKeepOne') : t('settings.models.deleteProvider')}
                    aria-label={t('settings.models.deleteAria')}
                    disabled={providers.length <= 1}
                    onClick={() => removeProvider(provider.id)}
                  >
                    <IconInline name="trash" />
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-section-connection-heading">
          <h2 id="settings-section-connection-heading" className="settings-section-heading">
            {t('settings.models.detailHeading')}
          </h2>
          <p id="settings-section-connection-desc" className="settings-section-caption">
            {t('settings.models.detailCaption')}
          </p>
          <div className="settings-group" aria-describedby="settings-section-connection-desc">
            <div className="settings-field-row">
              <div className="settings-field-row__meta">
                <label htmlFor="claude-provider-name" className="settings-field-row__label">
                  <IconInline name="settings" />
                  {t('settings.models.fieldName')}
                </label>
                <p className="settings-field-row__hint">{t('settings.models.fieldNameHint')}</p>
              </div>
              <input
                id="claude-provider-name"
                type="text"
                className="settings-input"
                autoComplete="off"
                spellCheck={false}
                placeholder={t('settings.models.fieldNamePlaceholder')}
                value={editingProvider?.name ?? ''}
                onChange={(event) => updateEditingProvider('name', event.target.value)}
              />
            </div>
            <div className="settings-field-row">
              <div className="settings-field-row__meta">
                <label htmlFor="claude-api-key" className="settings-field-row__label">
                  <IconInline name="key" />
                  {t('settings.models.fieldApiKey')}
                </label>
                <p className="settings-field-row__hint">{t('settings.models.fieldApiKeyHint')}</p>
              </div>
              <input
                id="claude-api-key"
                type="password"
                className="settings-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="sk-ant-..."
                value={editingProvider?.apiKey ?? ''}
                onChange={(event) => updateEditingProvider('apiKey', event.target.value)}
              />
            </div>
            <div className="settings-field-row">
              <div className="settings-field-row__meta">
                <label htmlFor="claude-base-url" className="settings-field-row__label">
                  <IconInline name="server" />
                  {t('settings.models.fieldBaseUrl')}
                </label>
                <p className="settings-field-row__hint">{t('settings.models.fieldBaseUrlHint')}</p>
              </div>
              <input
                id="claude-base-url"
                type="url"
                className="settings-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://open.bigmodel.cn/api/anthropic"
                value={editingProvider?.baseUrl ?? ''}
                onChange={(event) => updateEditingProvider('baseUrl', event.target.value)}
              />
            </div>
            <div className="settings-field-row">
              <div className="settings-field-row__meta">
                <label htmlFor="claude-haiku-model" className="settings-field-row__label">
                  <IconInline name="chip" />
                  {t('settings.models.fieldHaiku')}
                </label>
                <p className="settings-field-row__hint">{t('settings.models.fieldHaikuHint')}</p>
              </div>
              <input
                id="claude-haiku-model"
                type="text"
                className="settings-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="glm-4.7"
                value={editingProvider?.defaultHaikuModel ?? ''}
                onChange={(event) => updateEditingProvider('defaultHaikuModel', event.target.value)}
              />
            </div>
            <div className="settings-field-row">
              <div className="settings-field-row__meta">
                <label htmlFor="claude-sonnet-model" className="settings-field-row__label">
                  <IconInline name="chip" />
                  {t('settings.models.fieldSonnet')}
                </label>
                <p className="settings-field-row__hint">{t('settings.models.fieldSonnetHint')}</p>
              </div>
              <input
                id="claude-sonnet-model"
                type="text"
                className="settings-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="glm-5"
                value={editingProvider?.defaultSonnetModel ?? ''}
                onChange={(event) => updateEditingProvider('defaultSonnetModel', event.target.value)}
              />
            </div>
            <div className="settings-field-row">
              <div className="settings-field-row__meta">
                <label htmlFor="claude-opus-model" className="settings-field-row__label">
                  <IconInline name="chip" />
                  {t('settings.models.fieldOpus')}
                </label>
                <p className="settings-field-row__hint">{t('settings.models.fieldOpusHint')}</p>
              </div>
              <input
                id="claude-opus-model"
                type="text"
                className="settings-input"
                autoComplete="off"
                spellCheck={false}
                placeholder="glm-5.1"
                value={editingProvider?.defaultOpusModel ?? ''}
                onChange={(event) => updateEditingProvider('defaultOpusModel', event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-section-env-heading">
          <h2 id="settings-section-env-heading" className="settings-section-heading">
            {t('settings.models.envHeading')}
          </h2>
          <p id="settings-section-env-desc" className="settings-section-caption">
            {t('settings.models.envCaption')}
          </p>
          <ul className="settings-env-tags" aria-describedby="settings-section-env-desc">
            {envStatusTags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </section>

        <div className="settings-footer">
          <div className="settings-actions">
            <button type="submit" className="btn btn-primary" id="btn-save-claude-settings" disabled={saveDisabled || busy}>
              <IconInline name="save" />
              <span>{t('settings.models.save')}</span>
            </button>
            <button type="button" className="btn btn-ghost" id="btn-reload-claude-settings" onClick={() => void load()}>
              <IconInline name="refresh" />
              <span>{t('settings.models.reload')}</span>
            </button>
            <span className="settings-status" id="claude-settings-status" role="status">
              {status}
            </span>
          </div>
        </div>
      </form>
    </section>
  )
}

function pruneStoredAnthropicOverlay(
  providers: ClaudeAgentModelProvider[],
  activeProviderId: string,
  overlayRaw: string,
): string {
  const provider = providers.find((p) => p.id === activeProviderId)
  const overlay = overlayRaw.trim()
  if (!provider || !overlay) return ''
  const primary = provider.model.trim()
  if (overlay === primary || !providerKnowsAnthropicModelId(provider, overlay)) return ''
  return overlay
}

function providerKnowsAnthropicModelId(provider: ClaudeAgentModelProvider, id: string): boolean {
  const m = id.trim()
  if (!m) return false
  const pool = [provider.model, provider.defaultHaikuModel, provider.defaultSonnetModel, provider.defaultOpusModel]
    .map((s) => s.trim())
    .filter(Boolean)
  return pool.includes(m)
}

function createModelProvider(): ClaudeAgentModelProvider {
  return {
    id: createProviderId(),
    name: '',
    apiKey: '',
    authToken: '',
    baseUrl: '',
    model: '',
    defaultHaikuModel: '',
    defaultOpusModel: '',
    defaultSonnetModel: '',
  }
}

function createProviderId(): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID()
  return `provider-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function providerDisplayName(
  provider: ClaudeAgentModelProvider,
  t: (path: string, vars?: Record<string, string | number>) => string,
): string {
  return provider.model || provider.name || t('settings.models.unnamedModel')
}

function providerMeta(
  provider: ClaudeAgentModelProvider,
  t: (path: string, vars?: Record<string, string | number>) => string,
): string {
  const parts = [
    provider.name && provider.model ? provider.name : '',
    provider.baseUrl,
    provider.apiKey ? t('settings.models.apiKeySet') : '',
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : t('settings.models.metaNoCredentials')
}

function createEnvStatusTags(
  snapshot: ClaudeAgentSettingsSnapshot,
  t: (path: string, vars?: Record<string, string | number>) => string,
): string[] {
  const env = snapshot.env
  const modelMapping = [
    env.defaultHaikuModel ? `Haiku ${env.defaultHaikuModel}` : '',
    env.defaultSonnetModel ? `Sonnet ${env.defaultSonnetModel}` : '',
    env.defaultOpusModel ? `Opus ${env.defaultOpusModel}` : '',
  ]
    .filter(Boolean)
    .join(' / ')

  return [
    env.hasApiKey
      ? t('settings.models.envApiKeySet')
      : env.hasAuthToken
        ? t('settings.models.envAuthTokenSet')
        : t('settings.models.envCredentialsUnset'),
    env.baseUrl ? t('settings.models.envBaseUrlValue', { value: env.baseUrl }) : t('settings.models.envBaseUrlDefault'),
    env.model ? t('settings.models.envModelValue', { value: env.model }) : t('settings.models.envModelDefault'),
    modelMapping ? t('settings.models.envMappingValue', { value: modelMapping }) : t('settings.models.envMappingDefault'),
  ]
}
