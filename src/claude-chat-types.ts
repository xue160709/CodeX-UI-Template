export type ClaudeChatSubmitPayload = {
  text: string
}

export type ClaudeAgentConfigSource = 'settings' | 'env'

export type ClaudeAgentSettings = {
  configSource: ClaudeAgentConfigSource
  apiKey: string
  baseUrl: string
  model: string
}

export type ClaudeAgentEnvSnapshot = {
  hasApiKey: boolean
  hasAuthToken: boolean
  baseUrl: string
  model: string
}

export type ClaudeAgentSettingsSnapshot = {
  settings: ClaudeAgentSettings
  env: ClaudeAgentEnvSnapshot
}

export type ClaudeAgentResolvedConfig = {
  configSource: ClaudeAgentConfigSource
  apiKey: string
  authToken: string
  baseUrl: string
  model: string
}

export type ClaudeChatSubmitResult = {
  requestId: string
}

export type ClaudeChatEvent =
  | {
      type: 'session_start'
      requestId: string
      sessionId: string
      model: string
      cwd: string
    }
  | {
      type: 'assistant_delta'
      requestId: string
      messageId: string
      text: string
    }
  | {
      type: 'tool_start'
      requestId: string
      toolUseId: string
      name: string
      inputPreview: string
    }
  | {
      type: 'tool_done'
      requestId: string
      toolUseId: string
      status: 'done' | 'error' | 'denied'
    }
  | {
      type: 'result'
      requestId: string
      sessionId: string
      result: string
      costUsd?: number
      durationMs?: number
    }
  | {
      type: 'error'
      requestId: string
      code: string
      message: string
    }
  | {
      type: 'cancelled'
      requestId: string
    }

export type ClaudeChatEventHandler = (event: ClaudeChatEvent) => void

export type ClaudeChatAPI = {
  submit(payload: ClaudeChatSubmitPayload): Promise<ClaudeChatSubmitResult>
  cancel(requestId?: string): Promise<void>
  newThread(): Promise<void>
  getSettings(): Promise<ClaudeAgentSettingsSnapshot>
  saveSettings(settings: ClaudeAgentSettings): Promise<ClaudeAgentSettingsSnapshot>
  onEvent(handler: ClaudeChatEventHandler): () => void
}
