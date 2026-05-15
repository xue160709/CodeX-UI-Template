import { Icons } from '../icons'
import type { AppView, AppViewId } from './types'

const SIDEBAR_WIDTH_STORAGE_KEY = 'CodeX-UI-Template-sidebar-width-px'
const SIDEBAR_MAX_RATIO = 0.3

type AppShellOptions = {
  views: AppView[]
  navViewIds: AppViewId[]
  onNewThread?: () => void | Promise<void>
}

export class AppShell {
  private readonly viewMap: Map<AppViewId, AppView>
  private shell!: HTMLElement
  private appBody!: HTMLElement
  private appSidebar!: HTMLElement
  private sidebarSplitter!: HTMLElement
  private btnBack!: HTMLButtonElement
  private btnForward!: HTMLButtonElement
  private btnFooterSettings!: HTMLButtonElement
  private workspaceTitle!: HTMLElement
  private ipcStatus!: HTMLElement
  private sidebarResizeActive = false

  constructor(
    private readonly root: HTMLElement,
    private readonly options: AppShellOptions,
  ) {
    this.viewMap = new Map(options.views.map((view) => [view.id, view]))
  }

  mount(): void {
    this.root.innerHTML = this.render()
    this.cacheElements()
    this.options.views.forEach((view) => {
      const panel = document.getElementById(`panel-${view.id}`)
      if (!panel) throw new Error(`Missing panel for view: ${view.id}`)
      view.mount(panel)
    })
    this.bindEvents()
    this.initSidebarWidthFromStorage()
    this.renderView()
  }

  getStatusElement(): HTMLElement {
    return this.ipcStatus
  }

  private render(): string {
    return `
      <div class="app-shell" id="app-shell">
        <div class="app-body">
          <div class="app-chrome-toolbar no-drag" aria-label="窗口导航">
            <button type="button" class="btn btn-toolbar" id="btn-toggle-sidebar" title="切换侧栏" aria-label="切换侧栏">
              ${Icons.sidebar}
            </button>
            <button type="button" class="btn btn-toolbar" id="btn-back" title="后退" aria-label="后退" disabled>
              ${Icons.back}
            </button>
            <button type="button" class="btn btn-toolbar" id="btn-forward" title="前进" aria-label="前进" disabled>
              ${Icons.forward}
            </button>
          </div>
          <aside class="app-sidebar" aria-label="侧栏导航">
            <div class="app-sidebar-scroll">
              <div class="app-sidebar-inner">
                <div class="app-sidebar-section-label">工作区</div>
                ${this.renderNavItems()}
              </div>
            </div>
            <footer class="app-sidebar-footer">
              <button type="button" class="btn btn-toolbar" id="btn-footer-settings" title="设置" aria-label="设置">
                ${Icons.settings}
              </button>
              <span class="user-select-none text-token-secondary">CodeX-UI-Template</span>
            </footer>
          </aside>
          <div
            class="app-sidebar-splitter no-drag"
            id="app-sidebar-splitter"
            role="separator"
            aria-orientation="vertical"
            aria-label="调整侧栏宽度"
          ></div>
          <div class="app-workspace">
            <header class="app-workspace-header" role="banner">
              <span class="app-workspace-title no-drag" id="workspace-title">Codex Chatbot</span>
              <div class="app-workspace-drag-gap draggable" aria-hidden="true"></div>
              <div class="app-workspace-actions no-drag">
                <button type="button" class="btn btn-ghost" id="btn-new-thread">${Icons.plus}<span>新对话</span></button>
                <span class="status-pill user-select-none" id="ipc-status" title="Claude Agent 状态">Claude Agent</span>
              </div>
            </header>
            <main class="app-main" role="main">
              ${this.options.views.map((view) => view.render()).join('')}
            </main>
          </div>
        </div>
      </div>
    `
  }

  private renderNavItems(): string {
    return this.options.navViewIds
      .map((id) => {
        const view = this.viewMap.get(id)
        if (!view) return ''
        return `<button type="button" class="app-nav-item" data-view="${view.id}">${view.navLabel ?? view.heading}</button>`
      })
      .join('')
  }

  private cacheElements(): void {
    this.shell = this.query<HTMLElement>('#app-shell')
    this.appBody = this.query<HTMLElement>('.app-body')
    this.appSidebar = this.query<HTMLElement>('.app-sidebar')
    this.sidebarSplitter = this.query<HTMLElement>('#app-sidebar-splitter')
    this.btnBack = this.query<HTMLButtonElement>('#btn-back')
    this.btnForward = this.query<HTMLButtonElement>('#btn-forward')
    this.btnFooterSettings = this.query<HTMLButtonElement>('#btn-footer-settings')
    this.workspaceTitle = this.query<HTMLElement>('#workspace-title')
    this.ipcStatus = this.query<HTMLElement>('#ipc-status')
  }

  private bindEvents(): void {
    this.query<HTMLButtonElement>('#btn-toggle-sidebar').addEventListener('click', () => {
      this.shell.classList.toggle('is-sidebar-collapsed')
    })

    this.btnBack.addEventListener('click', () => {
      window.history.back()
    })
    this.btnForward.addEventListener('click', () => {
      window.history.forward()
    })
    this.btnFooterSettings.addEventListener('click', () => {
      window.location.hash = 'settings'
    })
    this.query<HTMLButtonElement>('#btn-new-thread').addEventListener('click', () => {
      void this.options.onNewThread?.()
    })

    this.root.querySelectorAll<HTMLElement>('.app-nav-item').forEach((el) => {
      el.addEventListener('click', () => {
        const view = this.normalizeViewId(el.getAttribute('data-view') ?? 'home')
        window.location.hash = view === 'home' ? '' : view
      })
    })

    this.sidebarSplitter.addEventListener('pointerdown', (event) => this.handleSidebarPointerDown(event))
    window.addEventListener('resize', () => this.handleWindowResize())
    window.addEventListener('hashchange', () => {
      this.renderView()
    })
  }

  private handleSidebarPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return
    if (this.shell.classList.contains('is-sidebar-collapsed')) return

    event.preventDefault()
    this.sidebarResizeActive = true
    this.shell.classList.add('is-resizing-sidebar')
    const startX = event.clientX
    const startWidth = this.appSidebar.getBoundingClientRect().width || this.readCssPxVar('--width-sidebar-min', 240)
    const onMove = (moveEvent: PointerEvent) => {
      if (!this.sidebarResizeActive) return
      this.applySidebarWidthPx(startWidth + moveEvent.clientX - startX)
    }
    const onUp = () => {
      this.sidebarResizeActive = false
      this.shell.classList.remove('is-resizing-sidebar')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    try {
      this.sidebarSplitter.setPointerCapture(event.pointerId)
    } catch {
      /* ignore */
    }
  }

  private handleWindowResize(): void {
    if (this.shell.classList.contains('is-sidebar-collapsed')) return
    const width = Number.parseFloat(getComputedStyle(this.appBody).getPropertyValue('--sidebar-current-width').trim())
    if (Number.isFinite(width)) this.applySidebarWidthPx(width)
  }

  private viewFromLocation(): AppViewId {
    return this.normalizeViewId(window.location.hash.replace(/^#/, ''))
  }

  private normalizeViewId(value: string): AppViewId {
    return value === 'docs' || value === 'settings' ? value : 'home'
  }

  private renderView(): void {
    const activeViewId = this.viewFromLocation()
    const activeView = this.viewMap.get(activeViewId) ?? this.viewMap.get('home')
    this.workspaceTitle.textContent = activeView?.heading ?? 'Codex Chatbot'

    this.options.views.forEach((view) => {
      const panel = document.getElementById(`panel-${view.id}`)
      if (panel) panel.hidden = view.id !== activeViewId
      view.setVisible?.(view.id === activeViewId)
    })

    this.root.querySelectorAll('.app-nav-item').forEach((el) => {
      el.classList.toggle('is-active', el.getAttribute('data-view') === activeViewId)
    })
    this.btnFooterSettings.classList.toggle('is-active', activeViewId === 'settings')
    this.syncHistoryButtons()
  }

  private syncHistoryButtons(): void {
    const nav = (window as unknown as { navigation?: { canGoBack?: boolean; canGoForward?: boolean } }).navigation
    if (nav && typeof nav.canGoBack === 'boolean') {
      this.btnBack.disabled = !nav.canGoBack
      this.btnForward.disabled = !nav.canGoForward
      return
    }
    this.btnBack.disabled = window.history.length <= 1
    this.btnForward.disabled = true
  }

  private readCssPxVar(name: string, fallback: number): number {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : fallback
  }

  private clampSidebarWidth(px: number): number {
    const min = this.readCssPxVar('--width-sidebar-min', 160)
    const bodyW = this.appBody.getBoundingClientRect().width
    const max = Math.max(min, bodyW * SIDEBAR_MAX_RATIO)
    return Math.min(max, Math.max(min, px))
  }

  private applySidebarWidthPx(px: number): void {
    const clamped = this.clampSidebarWidth(px)
    this.appBody.style.setProperty('--sidebar-user-width', `${clamped}px`)
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(clamped)))
    } catch {
      /* ignore */
    }
  }

  private initSidebarWidthFromStorage(): void {
    try {
      const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
      if (!raw) return
      const n = Number.parseInt(raw, 10)
      if (Number.isFinite(n)) this.applySidebarWidthPx(n)
    } catch {
      /* ignore */
    }
  }

  private query<T extends HTMLElement>(selector: string): T {
    const el = this.root.querySelector<T>(selector)
    if (!el) throw new Error(`Missing AppShell element: ${selector}`)
    return el
  }
}
