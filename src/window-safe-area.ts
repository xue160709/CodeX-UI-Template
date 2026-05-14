export type SafeArea = {
  left: number
  right: number
  /** 为 macOS 交通灯预留的顶部内边距（与 hiddenInset 搭配） */
  top: number
}

declare global {
  interface Navigator {
    windowControlsOverlay?: {
      visible: boolean
      getTitlebarAreaRect(): DOMRect
    }
  }
}

function platformFromBridge(): NodeJS.Platform | undefined {
  return typeof window !== 'undefined' ? window.desktop?.platform : undefined
}

/** 与 codex-ui-framework-notes.md §5 一致：为系统窗口控件预留安全区 */
export function getWindowControlsSafeArea(): SafeArea {
  if (typeof navigator !== 'undefined') {
    const overlay = navigator.windowControlsOverlay
    if (overlay?.visible) {
      const rect = overlay.getTitlebarAreaRect()
      return {
        left: Math.max(0, Math.round(rect.x)),
        right: Math.max(0, Math.round(window.innerWidth - (rect.x + rect.width))),
        top: Math.max(0, Math.round(rect.y + rect.height)),
      }
    }
  }

  const platform = platformFromBridge()
  if (platform === 'darwin') {
    return { left: 76, right: 0, top: 34 }
  }
  if (platform === 'win32') {
    return { left: 0, right: 0, top: 0 }
  }
  if (platform === 'linux') {
    return { left: 0, right: 120, top: 0 }
  }

  return { left: 0, right: 0, top: 0 }
}

export function applySafeAreaToDocument(area: SafeArea): void {
  document.documentElement.style.setProperty('--spacing-token-safe-header-left', `${area.left}px`)
  document.documentElement.style.setProperty('--spacing-token-safe-header-right', `${area.right}px`)
  document.documentElement.style.setProperty('--spacing-token-safe-header-top', `${area.top}px`)
}

export function installWindowSafeAreaListeners(onChange: (area: SafeArea) => void): () => void {
  const emit = () => onChange(getWindowControlsSafeArea())

  emit()
  window.addEventListener('resize', emit)

  const overlay = navigator.windowControlsOverlay
  const overlayEvents = overlay as unknown as EventTarget | null
  if (overlayEvents && 'addEventListener' in overlayEvents) {
    overlayEvents.addEventListener('geometrychange', emit)
    return () => {
      window.removeEventListener('resize', emit)
      overlayEvents.removeEventListener('geometrychange', emit)
    }
  }

  return () => {
    window.removeEventListener('resize', emit)
  }
}
