import { useEffect, type ReactNode, type RefObject } from 'react'
import { IconInline } from '../icon-inline'
import { useI18n } from '../i18n/i18n'
import type { AppFileTreePaneHandle } from './AppFileTreePane'

export type WorkspaceSidePanelTab = 'files' | 'agent'

type AppWorkspaceSidePanelProps = {
  open: boolean
  activeTab: WorkspaceSidePanelTab
  onActiveTabChange: (tab: WorkspaceSidePanelTab) => void
  onClose: () => void
  /** Agent 已开启时显示「Agent」标签，与目录共用侧栏 */
  showAgentTab: boolean
  filePaneRef: RefObject<AppFileTreePaneHandle | null>
  filesPane: ReactNode
  agentPane: ReactNode
}

export function AppWorkspaceSidePanel({
  open,
  activeTab,
  onActiveTabChange,
  onClose,
  showAgentTab,
  filePaneRef,
  filesPane,
  agentPane,
}: AppWorkspaceSidePanelProps) {
  const { t } = useI18n()

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  const heading =
    showAgentTab ? (
      <div className="app-workspace-side-panel-tabs" role="tablist" aria-label={t('workspace.sidePanelTabsAria')}>
        <button
          type="button"
          role="tab"
          id="workspace-side-tab-files"
          aria-selected={activeTab === 'files'}
          aria-controls="workspace-side-panel-files"
          className={`app-workspace-side-panel-tab${activeTab === 'files' ? ' is-selected' : ''}`}
          onClick={() => onActiveTabChange('files')}
        >
          <IconInline name="files" />
          <span>{t('filePanel.heading')}</span>
        </button>
        <button
          type="button"
          role="tab"
          id="workspace-side-tab-agent"
          aria-selected={activeTab === 'agent'}
          aria-controls="workspace-side-panel-agent"
          className={`app-workspace-side-panel-tab${activeTab === 'agent' ? ' is-selected' : ''}`}
          onClick={() => onActiveTabChange('agent')}
        >
          <IconInline name="agent" />
          <span>{t('workspace.agentModeTitle')}</span>
        </button>
      </div>
    ) : (
      <div className="app-file-panel-heading">
        <IconInline name="files" />
        <span>{t('filePanel.heading')}</span>
      </div>
    )

  return (
    <aside
      className={`app-file-panel app-workspace-side-panel${open ? ' is-open' : ''}`}
      id="app-file-panel"
      aria-label={t('workspace.sidePanelAria')}
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      <div className="app-file-panel-header">
        {heading}
        <div className="app-file-panel-actions">
          {activeTab === 'files' ? (
            <button
              type="button"
              className="btn btn-toolbar"
              title={t('filePanel.refreshTitle')}
              aria-label={t('filePanel.refreshAria')}
              disabled={!open}
              onClick={() => filePaneRef.current?.refresh()}
            >
              <IconInline name="refresh" />
            </button>
          ) : null}
          <button type="button" className="btn btn-toolbar" title={t('filePanel.closeTitle')} aria-label={t('filePanel.closeAria')} onClick={onClose}>
            <IconInline name="x" />
          </button>
        </div>
      </div>

      <div className="app-workspace-side-panel-panes">
        <div
          id="workspace-side-panel-files"
          role="tabpanel"
          aria-labelledby={showAgentTab ? 'workspace-side-tab-files' : undefined}
          className="app-workspace-side-panel-pane"
          hidden={activeTab !== 'files'}
        >
          {filesPane}
        </div>
        <div
          id="workspace-side-panel-agent"
          role="tabpanel"
          aria-labelledby={showAgentTab ? 'workspace-side-tab-agent' : undefined}
          className="app-workspace-side-panel-pane"
          hidden={activeTab !== 'agent'}
        >
          {agentPane}
        </div>
      </div>
    </aside>
  )
}
