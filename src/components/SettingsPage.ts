import type {
  ClaudeAgentConfigSource,
  ClaudeAgentSettings,
  ClaudeAgentSettingsSnapshot,
} from '../claude-chat-types'
import { Icons } from '../icons'
import type { AppView } from './types'

export class SettingsPage implements AppView {
  readonly id = 'settings'
  readonly heading = '设置'

  private root!: HTMLElement
  private form!: HTMLFormElement
  private sourceSettings!: HTMLInputElement
  private sourceEnv!: HTMLInputElement
  private apiKeyInput!: HTMLInputElement
  private baseUrlInput!: HTMLInputElement
  private modelInput!: HTMLInputElement
  private envApiKeyStatus!: HTMLElement
  private envBaseUrlStatus!: HTMLElement
  private envModelStatus!: HTMLElement
  private status!: HTMLElement
  private saveButton!: HTMLButtonElement

  render(): string {
    return `
      <section class="app-main-inner settings-page" id="panel-settings" hidden>
        <div class="app-main-eyebrow">设置</div>
        <h1 class="app-main-heading">Claude Agent</h1>
        <section class="app-panel settings-panel">
          <form class="settings-form" id="claude-settings-form">
            <div class="settings-source-grid" role="radiogroup" aria-label="Claude 配置来源">
              <label class="settings-source-card">
                <input type="radio" name="configSource" value="settings" id="claude-source-settings" />
                <span class="settings-source-card__title">${Icons.settings}<span>设置页优先</span></span>
                <span class="settings-source-card__copy">表单里的值会覆盖同名环境变量，空字段继续沿用环境变量。</span>
              </label>
              <label class="settings-source-card">
                <input type="radio" name="configSource" value="env" id="claude-source-env" />
                <span class="settings-source-card__title">${Icons.server}<span>环境变量</span></span>
                <span class="settings-source-card__copy">只从 Electron 主进程环境读取 ANTHROPIC_* 配置。</span>
              </label>
            </div>

            <label class="settings-field">
              <span>${Icons.key}<span>API Key</span></span>
              <input class="settings-input" id="claude-api-key" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-..." />
            </label>

            <label class="settings-field">
              <span>${Icons.server}<span>Base URL</span></span>
              <input class="settings-input" id="claude-base-url" type="url" autocomplete="off" spellcheck="false" placeholder="https://api.anthropic.com" />
            </label>

            <label class="settings-field">
              <span>${Icons.chip}<span>Model</span></span>
              <input class="settings-input" id="claude-model" type="text" autocomplete="off" spellcheck="false" placeholder="claude-sonnet-4-6" />
            </label>

            <div class="settings-env-summary" aria-label="环境变量状态">
              <span id="env-api-key-status">API Key: 未读取</span>
              <span id="env-base-url-status">Base URL: 未读取</span>
              <span id="env-model-status">Model: 未读取</span>
            </div>

            <div class="settings-actions">
              <button type="submit" class="btn btn-primary" id="btn-save-claude-settings">${Icons.save}<span>保存</span></button>
              <button type="button" class="btn btn-ghost" id="btn-reload-claude-settings">${Icons.refresh}<span>重新读取</span></button>
              <span class="settings-status" id="claude-settings-status" role="status"></span>
            </div>
          </form>
        </section>
      </section>
    `
  }

  mount(root: HTMLElement): void {
    this.root = root
    this.form = this.query<HTMLFormElement>('#claude-settings-form')
    this.sourceSettings = this.query<HTMLInputElement>('#claude-source-settings')
    this.sourceEnv = this.query<HTMLInputElement>('#claude-source-env')
    this.apiKeyInput = this.query<HTMLInputElement>('#claude-api-key')
    this.baseUrlInput = this.query<HTMLInputElement>('#claude-base-url')
    this.modelInput = this.query<HTMLInputElement>('#claude-model')
    this.envApiKeyStatus = this.query<HTMLElement>('#env-api-key-status')
    this.envBaseUrlStatus = this.query<HTMLElement>('#env-base-url-status')
    this.envModelStatus = this.query<HTMLElement>('#env-model-status')
    this.status = this.query<HTMLElement>('#claude-settings-status')
    this.saveButton = this.query<HTMLButtonElement>('#btn-save-claude-settings')

    this.form.addEventListener('submit', (event) => {
      event.preventDefault()
      void this.save()
    })
    this.query<HTMLButtonElement>('#btn-reload-claude-settings').addEventListener('click', () => {
      void this.load()
    })

    void this.load()
  }

  private async load(): Promise<void> {
    if (!window.claudeChat) {
      this.setStatus('Claude bridge 不可用')
      this.saveButton.disabled = true
      return
    }

    this.setStatus('读取中')
    try {
      this.renderSnapshot(await window.claudeChat.getSettings())
      this.saveButton.disabled = false
      this.setStatus('已读取')
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  private async save(): Promise<void> {
    if (!window.claudeChat) {
      this.setStatus('Claude bridge 不可用')
      return
    }

    this.saveButton.disabled = true
    this.setStatus('保存中')
    try {
      this.renderSnapshot(await window.claudeChat.saveSettings(this.collectSettings()))
      this.setStatus('已保存')
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : String(error))
    } finally {
      this.saveButton.disabled = false
    }
  }

  private renderSnapshot(snapshot: ClaudeAgentSettingsSnapshot): void {
    this.sourceSettings.checked = snapshot.settings.configSource === 'settings'
    this.sourceEnv.checked = snapshot.settings.configSource === 'env'
    this.apiKeyInput.value = snapshot.settings.apiKey
    this.baseUrlInput.value = snapshot.settings.baseUrl
    this.modelInput.value = snapshot.settings.model
    this.envApiKeyStatus.textContent = snapshot.env.hasApiKey
      ? 'ENV API Key: 已设置'
      : snapshot.env.hasAuthToken
        ? 'ENV Auth Token: 已设置'
        : 'ENV API Key: 未设置'
    this.envBaseUrlStatus.textContent = snapshot.env.baseUrl ? `ENV Base URL: ${snapshot.env.baseUrl}` : 'ENV Base URL: 默认'
    this.envModelStatus.textContent = snapshot.env.model ? `ENV Model: ${snapshot.env.model}` : 'ENV Model: 默认'
  }

  private collectSettings(): ClaudeAgentSettings {
    return {
      configSource: this.readSource(),
      apiKey: this.apiKeyInput.value,
      baseUrl: this.baseUrlInput.value,
      model: this.modelInput.value,
    }
  }

  private readSource(): ClaudeAgentConfigSource {
    return this.sourceEnv.checked ? 'env' : 'settings'
  }

  private setStatus(message: string): void {
    this.status.textContent = message
  }

  private query<T extends HTMLElement>(selector: string): T {
    const el = this.root.querySelector<T>(selector)
    if (!el) throw new Error(`Missing SettingsPage element: ${selector}`)
    return el
  }
}
