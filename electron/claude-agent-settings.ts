import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type {
  ClaudeAgentConfigSource,
  ClaudeAgentEnvSnapshot,
  ClaudeAgentResolvedConfig,
  ClaudeAgentSettings,
  ClaudeAgentSettingsSnapshot,
} from '../src/claude-chat-types'

const SETTINGS_FILE_NAME = 'claude-agent-settings.json'

const DEFAULT_SETTINGS: ClaudeAgentSettings = {
  configSource: 'settings',
  apiKey: '',
  baseUrl: '',
  model: '',
}

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
    if (!existsSync(this.settingsFilePath)) return { ...DEFAULT_SETTINGS }

    try {
      const raw = JSON.parse(readFileSync(this.settingsFilePath, 'utf8')) as unknown
      return normalizeSettings(raw)
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  save(settings: unknown): ClaudeAgentSettingsSnapshot {
    const normalized = normalizeSettings(settings)
    mkdirSync(path.dirname(this.settingsFilePath), { recursive: true })
    writeFileSync(this.settingsFilePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8')
    return this.getSnapshot()
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
      }
    }

    return {
      configSource: 'settings',
      apiKey: settings.apiKey || readEnv('ANTHROPIC_API_KEY'),
      authToken: settings.apiKey ? '' : readEnv('ANTHROPIC_AUTH_TOKEN'),
      baseUrl: settings.baseUrl || env.baseUrl,
      model: settings.model || env.model,
    }
  }

  private getEnvSnapshot(): ClaudeAgentEnvSnapshot {
    return {
      hasApiKey: Boolean(readEnv('ANTHROPIC_API_KEY')),
      hasAuthToken: Boolean(readEnv('ANTHROPIC_AUTH_TOKEN')),
      baseUrl: readEnv('ANTHROPIC_BASE_URL'),
      model: readEnv('ANTHROPIC_MODEL') || readEnv('CLAUDE_MODEL'),
    }
  }
}

function normalizeSettings(raw: unknown): ClaudeAgentSettings {
  if (!isRecord(raw)) return { ...DEFAULT_SETTINGS }

  const configSource = normalizeSource(raw.configSource)
  return {
    configSource,
    apiKey: normalizeString(raw.apiKey),
    baseUrl: normalizeString(raw.baseUrl),
    model: normalizeString(raw.model),
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
