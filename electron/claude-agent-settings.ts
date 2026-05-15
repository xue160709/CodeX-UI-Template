import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  ActiveChatPickPayload,
  ClaudeAgentConfigSource,
  ClaudeAgentEnvSnapshot,
  ClaudeAgentModelProvider,
  ClaudeAgentResolvedConfig,
  ClaudeAgentSettings,
  ClaudeAgentSettingsSnapshot,
} from '../src/claude-chat-types'

const SETTINGS_FILE_NAME = 'claude-agent-settings.json'
const DEFAULT_PROVIDER_ID = 'default-provider'

export class ClaudeAgentSettingsStore {
  private readonly settingsFilePath: string

  constructor(userDataPath: string) {
    this.settingsFilePath = path.join(userDataPath, SETTINGS_FILE_NAME)
  }

  getSnapshot(): ClaudeAgentSettingsSnapshot {
    return {
      settings: this.read(),
      env: this.getEnvSnapshot(),
    }
  }

  read(): ClaudeAgentSettings {
    if (!existsSync(this.settingsFilePath)) return createDefaultSettings()

    try {
      const raw = JSON.parse(readFileSync(this.settingsFilePath, 'utf8')) as unknown
      return normalizeSettings(raw)
    } catch {
      return createDefaultSettings()
    }
  }

  save(settings: unknown): ClaudeAgentSettingsSnapshot {
    const normalized = normalizeSettings(settings)
    mkdirSync(path.dirname(this.settingsFilePath), { recursive: true })
    writeFileSync(this.settingsFilePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
    return this.getSnapshot()
  }

  /** 仅切换聊天当前条目与可选的具体模型 ID（由聊天输入框下拉调用）。 */
  setActiveChatPick(payload: ActiveChatPickPayload): ClaudeAgentSettingsSnapshot {
    const settings = this.read()
    const id = normalizeString(payload.providerId)
    const provider = settings.providers.find((p) => p.id === id)
    if (!id || !provider) {
      throw new Error(`Unknown provider id: ${payload.providerId}`)
    }
    const incoming = payload.anthropicModel != null ? normalizeString(payload.anthropicModel) : ''
    const primaryModel = normalizeString(provider.model)
    let activeAnthropicModel = ''
    if (incoming && providerAcceptsModel(provider, incoming)) {
      activeAnthropicModel = incoming === primaryModel ? '' : incoming
    }
    return this.save({ ...settings, activeProviderId: id, activeAnthropicModel })
  }

  resolve(): ClaudeAgentResolvedConfig {
    const settings = this.read()
    const env = this.getEnvSnapshot()

    if (settings.configSource === 'env') {
      return {
        configSource: 'env',
        apiKey: readEnv('ANTHROPIC_API_KEY'),
        authToken: readEnv('ANTHROPIC_AUTH_TOKEN'),
        baseUrl: env.baseUrl,
        model: env.model,
        defaultHaikuModel: env.defaultHaikuModel,
        defaultOpusModel: env.defaultOpusModel,
        defaultSonnetModel: env.defaultSonnetModel,
      }
    }

    const provider = selectActiveProvider(settings)
    const providerApiKey = provider?.apiKey ?? ''
    const envApiKey = readEnv('ANTHROPIC_API_KEY')

    const overlay = normalizeString(settings.activeAnthropicModel)
    const primaryModel = normalizeString(provider?.model ?? '')
    const effectiveOverlay =
      overlay && provider && providerAcceptsModel(provider, overlay) ? overlay : ''
    const resolvedModel = effectiveOverlay || primaryModel || env.model

    return {
      configSource: 'settings',
      apiKey: providerApiKey || envApiKey,
      authToken: providerApiKey || envApiKey ? '' : readEnv('ANTHROPIC_AUTH_TOKEN'),
      baseUrl: provider?.baseUrl || env.baseUrl,
      model: resolvedModel,
      defaultHaikuModel: provider?.defaultHaikuModel || env.defaultHaikuModel,
      defaultOpusModel: provider?.defaultOpusModel || env.defaultOpusModel,
      defaultSonnetModel: provider?.defaultSonnetModel || env.defaultSonnetModel,
    }
  }

  private getEnvSnapshot(): ClaudeAgentEnvSnapshot {
    return {
      hasApiKey: Boolean(readEnv('ANTHROPIC_API_KEY')),
      hasAuthToken: Boolean(readEnv('ANTHROPIC_AUTH_TOKEN')),
      baseUrl: readEnv('ANTHROPIC_BASE_URL'),
      model: readEnv('ANTHROPIC_MODEL') || readEnv('CLAUDE_MODEL'),
      defaultHaikuModel: readEnv('ANTHROPIC_DEFAULT_HAIKU_MODEL'),
      defaultOpusModel: readEnv('ANTHROPIC_DEFAULT_OPUS_MODEL'),
      defaultSonnetModel: readEnv('ANTHROPIC_DEFAULT_SONNET_MODEL'),
    }
  }
}

function normalizeSettings(raw: unknown): ClaudeAgentSettings {
  if (!isRecord(raw)) return createDefaultSettings()

  const configSource = normalizeSource(raw.configSource)
  const providers = normalizeProviders(raw)
  const activeProviderId = providers.some((provider) => provider.id === normalizeString(raw.activeProviderId))
    ? normalizeString(raw.activeProviderId)
    : providers[0].id

  const activeAnthropicModelRaw = normalizeString(raw.activeAnthropicModel)

  return pruneSettings({
    configSource,
    activeProviderId,
    activeAnthropicModel: activeAnthropicModelRaw,
    providers,
  })
}

function normalizeProviders(raw: Record<string, unknown>): ClaudeAgentModelProvider[] {
  const normalized = Array.isArray(raw.providers)
    ? raw.providers
        .map((provider, index) => normalizeProvider(provider, `provider-${index + 1}`))
        .filter((provider): provider is ClaudeAgentModelProvider => Boolean(provider))
    : [normalizeProvider(raw, DEFAULT_PROVIDER_ID)].filter((provider): provider is ClaudeAgentModelProvider =>
        Boolean(provider),
      )

  const providers = normalized.length ? normalized : [createDefaultProvider()]
  return dedupeProviderIds(providers)
}

function normalizeProvider(raw: unknown, fallbackId: string): ClaudeAgentModelProvider | undefined {
  if (!isRecord(raw)) return undefined

  const apiKey =
    normalizeString(raw.apiKey) ||
    normalizeString(raw.ANTHROPIC_API_KEY) ||
    normalizeString(raw.authToken) ||
    normalizeString(raw.ANTHROPIC_AUTH_TOKEN)

  return {
    id: normalizeString(raw.id) || fallbackId,
    name: normalizeString(raw.name) || normalizeString(raw.label) || normalizeString(raw.providerName),
    apiKey,
    authToken: '',
    baseUrl: normalizeString(raw.baseUrl) || normalizeString(raw.ANTHROPIC_BASE_URL),
    model: normalizeString(raw.model) || normalizeString(raw.ANTHROPIC_MODEL),
    defaultHaikuModel:
      normalizeString(raw.defaultHaikuModel) || normalizeString(raw.ANTHROPIC_DEFAULT_HAIKU_MODEL),
    defaultOpusModel: normalizeString(raw.defaultOpusModel) || normalizeString(raw.ANTHROPIC_DEFAULT_OPUS_MODEL),
    defaultSonnetModel:
      normalizeString(raw.defaultSonnetModel) || normalizeString(raw.ANTHROPIC_DEFAULT_SONNET_MODEL),
  }
}

function dedupeProviderIds(providers: ClaudeAgentModelProvider[]): ClaudeAgentModelProvider[] {
  const seen = new Set<string>()

  return providers.map((provider, index) => {
    let id = provider.id || `provider-${index + 1}`
    if (seen.has(id)) id = `${id}-${index + 1}`
    seen.add(id)
    return { ...provider, id }
  })
}

function selectActiveProvider(settings: ClaudeAgentSettings): ClaudeAgentModelProvider | undefined {
  return (
    settings.providers.find((provider) => provider.id === settings.activeProviderId) ??
    settings.providers[0]
  )
}

function createDefaultSettings(): ClaudeAgentSettings {
  const provider = createDefaultProvider()
  return {
    configSource: 'settings',
    activeProviderId: provider.id,
    activeAnthropicModel: '',
    providers: [provider],
  }
}

function pruneSettings(settings: ClaudeAgentSettings): ClaudeAgentSettings {
  const provider = selectActiveProvider(settings)
  const overlay = normalizeString(settings.activeAnthropicModel)
  if (!overlay || !provider || !providerAcceptsModel(provider, overlay)) {
    return { ...settings, activeAnthropicModel: '' }
  }
  const primary = normalizeString(provider.model)
  return {
    ...settings,
    activeAnthropicModel: overlay === primary ? '' : overlay,
  }
}

function createDefaultProvider(): ClaudeAgentModelProvider {
  return {
    id: DEFAULT_PROVIDER_ID,
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

function normalizeSource(value: unknown): ClaudeAgentConfigSource {
  return value === 'env' ? 'env' : 'settings'
}

function normalizeString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readEnv(name: string): string {
  return process.env[name]?.trim() ?? ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function providerAcceptsModel(provider: ClaudeAgentModelProvider, modelId: string): boolean {
  const m = normalizeString(modelId)
  if (!m) return false
  const candidates = [
    normalizeString(provider.model),
    normalizeString(provider.defaultHaikuModel),
    normalizeString(provider.defaultSonnetModel),
    normalizeString(provider.defaultOpusModel),
  ].filter(Boolean)
  return candidates.includes(m)
}
