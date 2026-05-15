import DOMPurify from 'dompurify'
import { marked } from 'marked'
import type { ClaudeChatEvent } from '../claude-chat-types'
import { Icons } from '../icons'
import type { AppView } from './types'

marked.setOptions({
  breaks: true,
  gfm: true,
})

type MessageStatus = 'done' | 'streaming' | 'error' | 'cancelled'
type ToolStatus = 'running' | 'done' | 'error' | 'denied'

type ChatMessageItem = {
  type: 'message'
  id: string
  role: 'user' | 'assistant'
  content: string
  status: MessageStatus
}

type ChatToolItem = {
  type: 'tool'
  id: string
  toolUseId: string
  name: string
  inputPreview: string
  status: ToolStatus
}

type TranscriptItem = ChatMessageItem | ChatToolItem

type ChatState = {
  sessionId?: string
  model: string
  cwd?: string
  items: TranscriptItem[]
}

const CHAT_STATE_STORAGE_KEY = 'CodeX-UI-Template-chat-state-v1'

export class ChatPage implements AppView {
  readonly id = 'home'
  readonly heading = 'Codex Chatbot'
  readonly navLabel = '聊天'

  private root!: HTMLElement
  private emptyHeader!: HTMLElement
  private scrollRegion!: HTMLElement
  private transcript!: HTMLElement
  private btnScrollBottom!: HTMLButtonElement
  private chatForm!: HTMLFormElement
  private chatInput!: HTMLTextAreaElement
  private btnSend!: HTMLButtonElement
  private composerSpinner!: HTMLElement
  private composerModel!: HTMLElement
  private suggestions!: HTMLElement
  private statusTarget?: HTMLElement
  private chatState: ChatState = this.loadChatState()
  private isRunning = false
  private activeRequestId: string | undefined
  private activeAssistantMessageId: string | undefined
  private isComposingText = false

  render(): string {
    return `
      <section class="chat-page" id="panel-home" aria-label="Claude Agent 聊天">
        <div class="chat-empty-header" id="chat-empty-header">
          <h1>我们该构建什么？</h1>
        </div>
        <div class="chat-scroll-region" id="chat-scroll-region" hidden>
          <div class="chat-transcript" id="chat-transcript" aria-live="polite"></div>
        </div>
        <button type="button" class="btn btn-scroll-bottom" id="btn-scroll-bottom" title="滚动到底部" aria-label="滚动到底部" hidden>
          ${Icons.arrowDown}
        </button>
        <div class="chat-composer-wrap no-drag">
          <form class="chat-composer" id="chat-form">
            <textarea
              class="chat-input"
              id="chat-input"
              rows="1"
              placeholder="要求后续变更"
              autocomplete="off"
              spellcheck="false"
            ></textarea>
            <div class="composer-footer">
              <div class="composer-actions">
                <!-- 关掉，需要再打开 -->
                <!-- 
                <button type="button" class="composer-icon-button" id="btn-attach" title="添加上下文" aria-label="添加上下文">${Icons.plus}</button>
                <button type="button" class="composer-mode-button" title="权限模式：自动审查" aria-label="权限模式：自动审查">
                  ${Icons.shield}<span>自动审查</span>${Icons.chevron}
                </button>
                -->
              </div>
              <div class="composer-actions composer-actions--end">
                <span class="composer-spinner" id="composer-spinner" aria-hidden="true"></span>
                <button type="button" class="composer-model-button" title="模型" aria-label="模型">
                  <span id="composer-model">Claude Agent</span>${Icons.chevron}
                </button>
                <!-- 关掉，需要再打开 -->
                <!--  
                <button type="button" class="composer-icon-button" id="btn-dictate" title="语音输入" aria-label="语音输入">${Icons.mic}</button>
                -->
                <button type="submit" class="composer-send-button" id="btn-send" title="发送" aria-label="发送">${Icons.send}</button>
              </div>
            </div>
          </form>
          
          <!-- 关掉，需要再打开 -->
          <!-- 
          <div class="chat-context-strip" aria-label="当前上下文">
            <span>${Icons.folder}<span>CodeX-UI-Template</span>${Icons.chevron}</span>
            <span>${Icons.laptop}<span>本地模式</span>${Icons.chevron}</span>
            <span>${Icons.branch}<span>main</span>${Icons.chevron}</span>
          </div>
          -->
        </div>
        <div class="chat-suggestions" id="chat-suggestions" aria-label="建议提示">
          <button type="button" data-prompt="Replace electron-builder placeholders before the first packaged build ships wrong metadata">Replace electron-builder placeholders before the first packaged build ships wrong metadata</button>
          <button type="button" data-prompt="Make the 文档 tab render codex-ui-framework-notes.md instead of an empty placeholder">Make the 文档 tab render codex-ui-framework-notes.md instead of an empty placeholder</button>
          <button type="button" data-prompt="审查我最近的提交记录是否存在正确性风险和可维护性隐患">审查我最近的提交记录是否存在正确性风险和可维护性隐患</button>
          <button type="button" data-prompt="将你常用的应用连接到 Codex">将你常用的应用连接到 Codex</button>
        </div>
      </section>
    `
  }

  mount(root: HTMLElement): void {
    this.root = root
    this.emptyHeader = this.query<HTMLElement>('#chat-empty-header')
    this.scrollRegion = this.query<HTMLElement>('#chat-scroll-region')
    this.transcript = this.query<HTMLElement>('#chat-transcript')
    this.btnScrollBottom = this.query<HTMLButtonElement>('#btn-scroll-bottom')
    this.chatForm = this.query<HTMLFormElement>('#chat-form')
    this.chatInput = this.query<HTMLTextAreaElement>('#chat-input')
    this.btnSend = this.query<HTMLButtonElement>('#btn-send')
    this.composerSpinner = this.query<HTMLElement>('#composer-spinner')
    this.composerModel = this.query<HTMLElement>('#composer-model')
    this.suggestions = this.query<HTMLElement>('#chat-suggestions')

    this.chatForm.addEventListener('submit', (event) => {
      event.preventDefault()
      if (this.isRunning) return
      void this.submitPrompt(this.chatInput.value)
    })

    this.btnSend.addEventListener('click', (event) => {
      if (!this.isRunning) return
      event.preventDefault()
      void this.cancelActiveRequest()
    })

    this.chatInput.addEventListener('input', () => {
      this.resizeComposer()
      this.refreshComposerControls()
    })
    this.chatInput.addEventListener('compositionstart', () => {
      this.isComposingText = true
    })
    this.chatInput.addEventListener('compositionend', () => {
      this.isComposingText = false
    })
    this.chatInput.addEventListener('keydown', (event) => this.handleInputKeydown(event))

    this.suggestions.querySelectorAll<HTMLButtonElement>('button[data-prompt]').forEach((button) => {
      button.addEventListener('click', () => {
        this.chatInput.value = button.dataset.prompt ?? ''
        this.chatInput.focus()
        this.resizeComposer()
        this.refreshComposerControls()
      })
    })

    this.btnScrollBottom.addEventListener('click', () => {
      this.scrollToBottom('smooth')
    })
    this.scrollRegion.addEventListener('scroll', () => this.updateScrollButton())

    window.claudeChat?.onEvent((event) => this.handleClaudeEvent(event))

    this.renderTranscript()
    this.resizeComposer()
    this.refreshComposerControls()
  }

  setStatusTarget(target: HTMLElement): void {
    this.statusTarget = target
    this.setStatusText(compactModelName(this.chatState.model))
  }

  focusComposer(): void {
    this.chatInput?.focus()
  }

  async startNewThread(): Promise<void> {
    if (window.claudeChat) {
      await window.claudeChat.newThread()
    }
    this.chatState = {
      model: 'Claude Agent',
      items: [],
    }
    this.isRunning = false
    this.activeRequestId = undefined
    this.activeAssistantMessageId = undefined
    this.setStatusText('Claude Agent')
    this.renderTranscript(true)
    this.refreshComposerControls()
    this.focusComposer()
  }

  private handleInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || event.shiftKey || this.isComposingText) return
    event.preventDefault()
    if (!this.isRunning) void this.submitPrompt(this.chatInput.value)
  }

  private async submitPrompt(rawText: string): Promise<void> {
    const text = rawText.trim()
    if (!text || this.isRunning) return

    const optimisticAssistantId = `assistant-pending-${Date.now()}`
    const userMessage: ChatMessageItem = {
      type: 'message',
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      status: 'done',
    }
    const assistantMessage: ChatMessageItem = {
      type: 'message',
      id: optimisticAssistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
    }

    this.chatState.items.push(userMessage, assistantMessage)
    this.chatInput.value = ''
    this.isRunning = true
    this.activeAssistantMessageId = optimisticAssistantId
    this.setStatusText('处理中')
    this.renderTranscript(true)
    this.resizeComposer()
    this.refreshComposerControls()

    if (!window.claudeChat) {
      assistantMessage.status = 'error'
      assistantMessage.content = 'Claude bridge unavailable. 请在 Electron 环境中运行应用。'
      this.isRunning = false
      this.activeAssistantMessageId = undefined
      this.setStatusText('桥接不可用')
      this.renderTranscript(true)
      this.refreshComposerControls()
      return
    }

    try {
      const { requestId } = await window.claudeChat.submit({ text })
      assistantMessage.id = `assistant-${requestId}`
      if (assistantMessage.status === 'streaming') {
        this.activeRequestId = requestId
        this.activeAssistantMessageId = assistantMessage.id
      } else {
        this.activeRequestId = undefined
        this.activeAssistantMessageId = undefined
      }
      this.renderTranscript(true)
    } catch (error) {
      assistantMessage.status = 'error'
      assistantMessage.content = error instanceof Error ? error.message : String(error)
      this.isRunning = false
      this.activeRequestId = undefined
      this.activeAssistantMessageId = undefined
      this.setStatusText('发送失败')
      this.renderTranscript(true)
      this.refreshComposerControls()
    }
  }

  private async cancelActiveRequest(): Promise<void> {
    if (!this.isRunning || !window.claudeChat) return
    await window.claudeChat.cancel(this.activeRequestId)
  }

  private handleClaudeEvent(event: ClaudeChatEvent): void {
    if (event.type === 'session_start') {
      this.chatState.sessionId = event.sessionId
      this.chatState.model = event.model || 'Claude Agent'
      this.chatState.cwd = event.cwd
      this.composerModel.textContent = compactModelName(this.chatState.model)
      this.setStatusText(compactModelName(this.chatState.model))
      this.persistChatState()
      return
    }

    if (event.type === 'assistant_delta') {
      const message = this.ensureAssistantMessage(event.messageId)
      message.content += event.text
      message.status = 'streaming'
      this.renderTranscript()
      return
    }

    if (event.type === 'tool_start') {
      const existing = this.findToolItem(event.toolUseId)
      if (existing) {
        existing.status = 'running'
      } else {
        this.chatState.items.push({
          type: 'tool',
          id: `tool-${event.toolUseId}`,
          toolUseId: event.toolUseId,
          name: event.name,
          inputPreview: event.inputPreview,
          status: 'running',
        })
      }
      this.renderTranscript()
      return
    }

    if (event.type === 'tool_done') {
      const item = this.findToolItem(event.toolUseId)
      if (item) item.status = event.status
      this.renderTranscript()
      return
    }

    if (event.type === 'result') {
      const assistant = this.findAssistantForRequest(event.requestId)
      if (assistant) {
        if (!assistant.content.trim() && event.result.trim()) assistant.content = event.result
        assistant.status = 'done'
      }
      this.chatState.sessionId = event.sessionId
      this.finishRequest(event.requestId, compactModelName(this.chatState.model))
      this.renderTranscript()
      return
    }

    if (event.type === 'error') {
      const assistant = this.findAssistantForRequest(event.requestId) ?? this.ensureAssistantMessage(`assistant-${event.requestId}`)
      assistant.status = 'error'
      if (!assistant.content.trim()) assistant.content = event.message
      this.finishRequest(event.requestId, event.code === 'missing_api_key' ? '缺少 API Key' : '出错')
      this.renderTranscript(true)
      return
    }

    if (event.type === 'cancelled') {
      const assistant = this.findAssistantForRequest(event.requestId)
      if (assistant) {
        assistant.status = 'cancelled'
        if (!assistant.content.trim()) assistant.content = '已停止。'
      }
      this.finishRequest(event.requestId, '已停止')
      this.renderTranscript(true)
    }
  }

  private finishRequest(requestId: string, statusText: string): void {
    if (this.activeRequestId && this.activeRequestId !== requestId) return
    this.isRunning = false
    this.activeRequestId = undefined
    this.activeAssistantMessageId = undefined
    this.setStatusText(statusText)
    this.refreshComposerControls()
  }

  private ensureAssistantMessage(messageId: string): ChatMessageItem {
    const existing = this.chatState.items.find(
      (item): item is ChatMessageItem => item.type === 'message' && item.id === messageId,
    )
    if (existing) return existing

    const pending = this.chatState.items.find((item): item is ChatMessageItem => {
      return item.type === 'message' && item.id === this.activeAssistantMessageId && item.role === 'assistant'
    })
    if (pending) {
      pending.id = messageId
      this.activeAssistantMessageId = messageId
      return pending
    }

    const message: ChatMessageItem = {
      type: 'message',
      id: messageId,
      role: 'assistant',
      content: '',
      status: 'streaming',
    }
    this.chatState.items.push(message)
    return message
  }

  private findAssistantForRequest(requestId: string): ChatMessageItem | undefined {
    const expectedId = `assistant-${requestId}`
    return this.chatState.items.find((item): item is ChatMessageItem => {
      if (item.type !== 'message' || item.role !== 'assistant') return false
      return item.id === expectedId || item.id === this.activeAssistantMessageId
    })
  }

  private findToolItem(toolUseId: string): ChatToolItem | undefined {
    return this.chatState.items.find((item): item is ChatToolItem => item.type === 'tool' && item.toolUseId === toolUseId)
  }

  private renderTranscript(forceScroll = false): void {
    const hasMessages = this.chatState.items.length > 0
    const shouldStick = forceScroll || this.isNearBottom()

    this.root.classList.toggle('has-messages', hasMessages)
    this.emptyHeader.hidden = hasMessages
    this.suggestions.hidden = hasMessages
    this.scrollRegion.hidden = !hasMessages
    this.composerModel.textContent = compactModelName(this.chatState.model)
    this.transcript.innerHTML = this.chatState.items.map(renderTranscriptItem).join('')
    this.persistChatState()

    if (shouldStick) {
      requestAnimationFrame(() => this.scrollToBottom('auto'))
    } else {
      this.updateScrollButton()
    }
  }

  private refreshComposerControls(): void {
    const hasText = this.chatInput.value.trim().length > 0
    this.btnSend.disabled = !this.isRunning && !hasText
    this.btnSend.innerHTML = this.isRunning ? Icons.stop : Icons.send
    this.btnSend.title = this.isRunning ? '停止' : '发送'
    this.btnSend.setAttribute('aria-label', this.isRunning ? '停止' : '发送')
    this.composerSpinner.classList.toggle('is-visible', this.isRunning)
  }

  private resizeComposer(): void {
    this.chatInput.style.height = 'auto'
    this.chatInput.style.height = `${Math.min(this.chatInput.scrollHeight, 180)}px`
  }

  private scrollToBottom(behavior: ScrollBehavior): void {
    this.scrollRegion.scrollTo({
      top: this.scrollRegion.scrollHeight,
      behavior,
    })
    this.updateScrollButton()
  }

  private isNearBottom(): boolean {
    if (this.scrollRegion.hidden) return true
    const remaining = this.scrollRegion.scrollHeight - this.scrollRegion.scrollTop - this.scrollRegion.clientHeight
    return remaining < 96
  }

  private updateScrollButton(): void {
    this.btnScrollBottom.hidden = !this.root.classList.contains('has-messages') || this.isNearBottom()
  }

  private loadChatState(): ChatState {
    try {
      const raw = localStorage.getItem(CHAT_STATE_STORAGE_KEY)
      if (!raw) return { model: 'Claude Agent', items: [] }
      const parsed = JSON.parse(raw) as Partial<ChatState>
      return {
        sessionId: typeof parsed.sessionId === 'string' ? parsed.sessionId : undefined,
        model: typeof parsed.model === 'string' ? parsed.model : 'Claude Agent',
        cwd: typeof parsed.cwd === 'string' ? parsed.cwd : undefined,
        items: Array.isArray(parsed.items) ? normalizeTranscriptItems(parsed.items) : [],
      }
    } catch {
      return { model: 'Claude Agent', items: [] }
    }
  }

  private persistChatState(): void {
    try {
      localStorage.setItem(CHAT_STATE_STORAGE_KEY, JSON.stringify(this.chatState))
    } catch {
      /* ignore */
    }
  }

  private setStatusText(text: string): void {
    if (this.statusTarget) this.statusTarget.textContent = text
  }

  private query<T extends HTMLElement>(selector: string): T {
    const el = this.root.querySelector<T>(selector)
    if (!el) throw new Error(`Missing ChatPage element: ${selector}`)
    return el
  }
}

function renderTranscriptItem(item: TranscriptItem): string {
  if (item.type === 'tool') {
    const statusLabel: Record<ToolStatus, string> = {
      denied: '已拒绝',
      done: '已完成',
      error: '出错',
      running: '运行中',
    }
    return `
      <div class="tool-row tool-row--${item.status}">
        <span class="tool-row__dot"></span>
        <span class="tool-row__name">${escapeHtml(item.name)}</span>
        <span class="tool-row__status">${statusLabel[item.status]}</span>
        ${item.inputPreview ? `<code>${escapeHtml(item.inputPreview)}</code>` : ''}
      </div>
    `
  }

  const body =
    item.role === 'assistant'
      ? renderMarkdown(item.content || (item.status === 'streaming' ? '' : ' '))
      : `<p>${escapeHtml(item.content).replace(/\n/g, '<br>')}</p>`
  const pending = item.role === 'assistant' && item.status === 'streaming' ? '<span class="typing-dot"></span>' : ''

  return `
    <article class="chat-message chat-message--${item.role} chat-message--${item.status}">
      <div class="chat-message__bubble markdown-body">
        ${body}${pending}
      </div>
    </article>
  `
}

function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false }) as string
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
    USE_PROFILES: { html: true },
  })
}

function normalizeTranscriptItems(items: unknown[]): TranscriptItem[] {
  const normalized: TranscriptItem[] = []

  for (const item of items) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.type !== 'string') continue

    if (item.type === 'message' && (item.role === 'user' || item.role === 'assistant')) {
      normalized.push({
        type: 'message',
        id: item.id,
        role: item.role,
        content: typeof item.content === 'string' ? item.content : '',
        status: item.status === 'error' || item.status === 'cancelled' ? item.status : 'done',
      })
      continue
    }

    if (item.type === 'tool' && typeof item.toolUseId === 'string' && typeof item.name === 'string') {
      normalized.push({
        type: 'tool',
        id: item.id,
        toolUseId: item.toolUseId,
        name: item.name,
        inputPreview: typeof item.inputPreview === 'string' ? item.inputPreview : '',
        status: item.status === 'error' || item.status === 'denied' ? item.status : 'done',
      })
    }
  }

  return normalized
}

function compactModelName(model: string): string {
  return model
    .replace(/^claude-/i, '')
    .replace(/-/g, ' ')
    .replace(/\b(\w)/g, (letter) => letter.toUpperCase())
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
