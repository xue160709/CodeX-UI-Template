import './style.css'
import typescriptLogo from './typescript.svg'
import { setupCounter } from './counter.ts'
import { applySafeAreaToDocument, installWindowSafeAreaListeners } from './window-safe-area.ts'

const ICON_SIDEBAR = `<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h16"/></svg>`
const ICON_BACK = `<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/></svg>`
const ICON_FORWARD = `<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" style="transform:scaleX(-1)"><path stroke-linecap="round" stroke-linejoin="round" d="M15 18l-6-6 6-6"/></svg>`
const ICON_SETTINGS = `<svg class="icon-xs" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="app-shell" id="app-shell">
    <div class="app-body">
      <div class="app-chrome-toolbar no-drag" aria-label="窗口导航">
        <button type="button" class="btn btn-toolbar" id="btn-toggle-sidebar" title="切换侧栏" aria-label="切换侧栏">
          ${ICON_SIDEBAR}
        </button>
        <button type="button" class="btn btn-toolbar" id="btn-back" title="后退" aria-label="后退" disabled>
          ${ICON_BACK}
        </button>
        <button type="button" class="btn btn-toolbar" id="btn-forward" title="前进" aria-label="前进" disabled>
          ${ICON_FORWARD}
        </button>
      </div>
      <aside class="app-sidebar" aria-label="侧栏导航">
        <div class="app-sidebar-scroll">
          <div class="app-sidebar-inner">
            <div class="app-sidebar-section-label">工作区</div>
            <button type="button" class="app-nav-item is-active" data-view="home">概览</button>
            <button type="button" class="app-nav-item" data-view="docs">文档</button>
          </div>
        </div>
        <footer class="app-sidebar-footer">
          <button type="button" class="btn btn-toolbar" id="btn-footer-settings" title="设置" aria-label="设置">
            ${ICON_SETTINGS}
          </button>
          <span class="user-select-none text-token-secondary" style="font-size:10px">CodeX-UI-Template</span>
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
          <span class="app-workspace-title no-drag" id="workspace-title">欢迎使用 CodeX-UI-Template</span>
          <div class="app-workspace-drag-gap draggable" aria-hidden="true"></div>
          <div class="app-workspace-actions no-drag">
            <span class="status-pill user-select-none" id="ipc-status" title="主进程推送">等待连接…</span>
          </div>
        </header>
        <main class="app-main" role="main">
          <div class="app-main-inner">
            <div class="app-main-eyebrow" id="main-eyebrow">概览</div>
            <h1 class="app-main-heading" id="main-heading">欢迎使用 CodeX-UI-Template</h1>
            <section class="app-panel" id="panel-home">
              <div class="app-logos">
                <a href="https://electron-vite.github.io" target="_blank" rel="noreferrer">
                  <img src="/electron-vite.svg" class="logo" alt="Electron Vite" />
                </a>
                <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer">
                  <img src="${typescriptLogo}" class="logo" alt="TypeScript" />
                </a>
              </div>
              <p class="text-token-secondary" style="margin:0 0 1rem">
                无全宽顶栏：左侧顶到窗口上沿（交通灯区域可拖拽），右侧独立标题栏；macOS 下为透明窗口 + <code style="font-family:var(--font-mono);font-size:12px">vibrancy: under-window</code>，侧栏半透明透出系统 material。
              </p>
              <button id="counter" type="button" class="btn btn-primary"></button>
              <p class="read-the-docs">主进程时间戳在右上状态胶囊 · 中间空白条可拖拽移动窗口</p>
            </section>
            <section class="app-panel" id="panel-docs" hidden>
              <p class="text-token-secondary" style="margin:0">文档视图占位。可在此接入路由或 Webview。</p>
            </section>
            <section class="app-panel" id="panel-settings" hidden>
              <p class="text-token-secondary" style="margin:0">设置视图占位。</p>
            </section>
          </div>
        </main>
      </div>
    </div>
  </div>
`

if (window.desktop?.windowEffects?.macVibrancy) {
  document.documentElement.dataset.windowEffects = 'mac-vibrancy'
}

const shell = document.getElementById('app-shell')!
const appBody = document.querySelector<HTMLElement>('.app-body')!
const appSidebar = document.querySelector<HTMLElement>('.app-sidebar')!
const sidebarSplitter = document.getElementById('app-sidebar-splitter')!
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar')!
const btnBack = document.getElementById('btn-back') as HTMLButtonElement
const btnForward = document.getElementById('btn-forward') as HTMLButtonElement
const btnFooterSettings = document.getElementById('btn-footer-settings')!
const ipcStatus = document.getElementById('ipc-status')!
const workspaceTitle = document.getElementById('workspace-title')!
const mainEyebrow = document.getElementById('main-eyebrow')!
const mainHeading = document.getElementById('main-heading')!
const panelHome = document.getElementById('panel-home')!
const panelDocs = document.getElementById('panel-docs')!
const panelSettings = document.getElementById('panel-settings')!

const viewMeta: Record<string, { eyebrow: string; heading: string }> = {
  home: { eyebrow: '概览', heading: '欢迎使用 CodeX-UI-Template' },
  docs: { eyebrow: '文档', heading: '文档' },
  settings: { eyebrow: '设置', heading: '设置' },
}

function syncHistoryButtons() {
  const nav = (window as unknown as { navigation?: { canGoBack?: boolean; canGoForward?: boolean } }).navigation
  if (nav && typeof nav.canGoBack === 'boolean') {
    btnBack.disabled = !nav.canGoBack
    btnForward.disabled = !nav.canGoForward
    return
  }
  btnBack.disabled = window.history.length <= 1
  btnForward.disabled = true
}

btnBack.addEventListener('click', () => {
  window.history.back()
})

btnForward.addEventListener('click', () => {
  window.history.forward()
})

const SIDEBAR_WIDTH_STORAGE_KEY = 'CodeX-UI-Template-sidebar-width-px'
const SIDEBAR_MAX_RATIO = 0.3

function readCssPxVar(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : fallback
}

function clampSidebarWidth(px: number): number {
  const min = readCssPxVar('--width-sidebar-min', 160)
  const bodyW = appBody.getBoundingClientRect().width
  const max = Math.max(min, bodyW * SIDEBAR_MAX_RATIO)
  return Math.min(max, Math.max(min, px))
}

function applySidebarWidthPx(px: number) {
  const clamped = clampSidebarWidth(px)
  appBody.style.setProperty('--sidebar-user-width', `${clamped}px`)
  try {
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(Math.round(clamped)))
  } catch {
    /* ignore */
  }
}

function initSidebarWidthFromStorage() {
  const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY)
  if (!raw) return
  const n = Number.parseInt(raw, 10)
  if (!Number.isFinite(n)) return
  applySidebarWidthPx(n)
}

initSidebarWidthFromStorage()

let sidebarResizeActive = false

sidebarSplitter.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return
  if (shell.classList.contains('is-sidebar-collapsed')) return
  e.preventDefault()
  sidebarResizeActive = true
  shell.classList.add('is-resizing-sidebar')
  const startX = e.clientX
  const startWidth = appSidebar.getBoundingClientRect().width || readCssPxVar('--width-sidebar-min', 240)
  const onMove = (ev: PointerEvent) => {
    if (!sidebarResizeActive) return
    const dx = ev.clientX - startX
    applySidebarWidthPx(startWidth + dx)
  }
  const onUp = () => {
    sidebarResizeActive = false
    shell.classList.remove('is-resizing-sidebar')
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
    window.removeEventListener('pointercancel', onUp)
  }
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('pointercancel', onUp)
  try {
    sidebarSplitter.setPointerCapture(e.pointerId)
  } catch {
    /* ignore */
  }
})

window.addEventListener('resize', () => {
  if (shell.classList.contains('is-sidebar-collapsed')) return
  const cs = getComputedStyle(appBody)
  const w = Number.parseFloat(cs.getPropertyValue('--sidebar-current-width').trim())
  if (Number.isFinite(w)) applySidebarWidthPx(w)
})

btnToggleSidebar.addEventListener('click', () => {
  shell.classList.toggle('is-sidebar-collapsed')
})

btnFooterSettings.addEventListener('click', () => {
  window.location.hash = 'settings'
})

function viewFromLocation(): 'home' | 'docs' | 'settings' {
  const h = window.location.hash.replace(/^#/, '')
  if (h === 'docs' || h === 'settings') return h
  return 'home'
}

function renderView() {
  const view = viewFromLocation()
  const meta = viewMeta[view]
  mainEyebrow.textContent = meta.eyebrow
  mainHeading.textContent = meta.heading
  workspaceTitle.textContent = meta.heading
  panelHome.hidden = view !== 'home'
  panelDocs.hidden = view !== 'docs'
  panelSettings.hidden = view !== 'settings'

  document.querySelectorAll('.app-nav-item').forEach((el) => {
    el.classList.toggle('is-active', el.getAttribute('data-view') === view)
  })
  btnFooterSettings.classList.toggle('is-active', view === 'settings')
  syncHistoryButtons()
}

document.querySelectorAll('.app-nav-item').forEach((el) => {
  el.addEventListener('click', () => {
    const view = el.getAttribute('data-view') ?? 'home'
    window.location.hash = view === 'home' ? '' : view
  })
})

window.addEventListener('hashchange', () => {
  renderView()
})

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)

installWindowSafeAreaListeners((area) => {
  applySafeAreaToDocument(area)
})

renderView()

window.ipcRenderer.on('main-process-message', (_event, message: string) => {
  ipcStatus.textContent = message
  console.log(message)
})
