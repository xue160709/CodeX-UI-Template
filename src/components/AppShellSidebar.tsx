import { useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { IconInline } from '../icon-inline'
import type { AppLocale } from '../i18n/i18n'
import { useI18n } from '../i18n/i18n'
import type { AppViewId, ProjectSkillListState, SettingsCategoryId, WorkspaceProject, WorkspaceThread } from './types'
import { SETTINGS_SIDEBAR_NAV } from './app-shell-constants.ts'

type AppShellSidebarProps = {
  activeViewId: AppViewId
  settingsCategory: SettingsCategoryId
  projects: WorkspaceProject[]
  threads: WorkspaceThread[]
  activeProjectId: string
  activeThreadId: string
  showProjectSkills: boolean
  projectSkillStates: Record<string, ProjectSkillListState>
  canBack: boolean
  canForward: boolean
  onNewThread: () => void
  onSelectProject: (projectId: string) => void
  onSelectThread: (threadId: string) => void
  onCreateThreadInProject: (projectId: string) => void
  onRunProjectSkill: (projectId: string, prompt: string) => void
  onToggleThreadPinned: (threadId: string) => void
  onArchiveThread: (threadId: string) => void
  onToggleCollapsed: () => void
  sidebarRef: RefObject<HTMLElement | null>
  splitterRef: RefObject<HTMLDivElement | null>
  onSplitterPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void
}

export function AppShellSidebar({
  activeViewId,
  settingsCategory,
  projects,
  threads,
  activeProjectId,
  activeThreadId,
  showProjectSkills,
  projectSkillStates,
  canBack,
  canForward,
  onNewThread,
  onSelectProject,
  onSelectThread,
  onCreateThreadInProject,
  onRunProjectSkill,
  onToggleThreadPinned,
  onArchiveThread,
  onToggleCollapsed,
  sidebarRef,
  splitterRef,
  onSplitterPointerDown,
}: AppShellSidebarProps) {
  const { locale, t } = useI18n()
  const isSettingsSidebar = activeViewId === 'settings'
  const [confirmingArchiveThreadId, setConfirmingArchiveThreadId] = useState<string | null>(null)

  const goLeaveSettings = () => {
    window.location.hash = ''
  }

  const visibleThreads = threads.filter((thread) => !thread.archivedAt)
  const threadsByProject = new Map<string, WorkspaceThread[]>()
  for (const thread of visibleThreads) {
    const list = threadsByProject.get(thread.projectId) ?? []
    list.push(thread)
    threadsByProject.set(thread.projectId, list)
  }
  for (const list of threadsByProject.values()) {
    list.sort((a, b) => {
      const pinDiff = (b.pinnedAt ?? 0) - (a.pinnedAt ?? 0)
      return pinDiff || b.updatedAt - a.updatedAt
    })
  }

  const requestArchive = (threadId: string) => {
    if (confirmingArchiveThreadId === threadId) {
      onArchiveThread(threadId)
      setConfirmingArchiveThreadId(null)
      return
    }
    setConfirmingArchiveThreadId(threadId)
  }

  return (
    <>
      <div className="app-chrome-toolbar no-drag" aria-label={t('sidebar.windowNav')}>
        <button
          type="button"
          className="btn btn-toolbar"
          id="btn-toggle-sidebar"
          title={t('sidebar.toggleSidebar')}
          aria-label={t('sidebar.toggleSidebar')}
          onClick={onToggleCollapsed}
        >
          <IconInline name="sidebar" />
        </button>
        <button
          type="button"
          className="btn btn-toolbar"
          id="btn-back"
          title={t('sidebar.back')}
          aria-label={t('sidebar.back')}
          disabled={!canBack}
          onClick={() => window.history.back()}
        >
          <IconInline name="back" />
        </button>
        <button
          type="button"
          className="btn btn-toolbar"
          id="btn-forward"
          title={t('sidebar.forward')}
          aria-label={t('sidebar.forward')}
          disabled={!canForward}
          onClick={() => window.history.forward()}
        >
          <IconInline name="forward" />
        </button>
      </div>
      <aside
        className={`app-sidebar${isSettingsSidebar ? ' is-settings-mode' : ''}`}
        aria-label={isSettingsSidebar ? t('sidebar.settingsNav') : t('sidebar.appNav')}
        ref={sidebarRef}
      >
        <div className="app-sidebar-scroll">
          <div className="app-sidebar-inner">
            {isSettingsSidebar ? (
              <>
                <button type="button" className="app-sidebar-new-thread" id="btn-settings-back-app" onClick={goLeaveSettings}>
                  <IconInline name="back" />
                  <span>{t('sidebar.backToApp')}</span>
                </button>
                <div className="app-sidebar-section-label">{t('sidebar.settingsSection')}</div>
                {SETTINGS_SIDEBAR_NAV.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={item.disabled}
                    title={item.disabled ? t('sidebar.notImplemented') : undefined}
                    className={`app-nav-item${settingsCategory === item.id ? ' is-active' : ''}`}
                    data-settings-category={item.id}
                    onClick={() => {
                      if (item.disabled) {
                        return
                      }
                      window.location.hash = `settings/${item.id}`
                    }}
                  >
                    <IconInline name={item.icon} />
                    <span>{t(item.labelKey)}</span>
                  </button>
                ))}
              </>
            ) : (
              <>
                <button type="button" className="app-sidebar-new-thread" id="btn-sidebar-new-thread" onClick={onNewThread}>
                  <IconInline name="plus" />
                  <span>{t('sidebar.newThread')}</span>
                </button>
                <div className="app-sidebar-section-label">{t('sidebar.projectsSection')}</div>
                <div className="app-project-list">
                  {projects.map((project) => {
                    const projectThreads = threadsByProject.get(project.id) ?? []
                    const projectActive = activeProjectId === project.id
                    const projectSkillState = projectSkillStates[project.id]
                    const projectSkills = projectSkillState?.skills ?? []
                    const showSkillsSection = Boolean(projectSkillState?.loading) || projectSkills.length > 0
                    const showThreadHistoryDivider = projectThreads.length > 0 && showProjectSkills
                    return (
                      <section key={project.id} className={`app-project-group${projectActive ? ' is-active' : ''}`}>
                        <div className="app-project-row">
                          <button
                            type="button"
                            className="app-project-select"
                            aria-current={projectActive ? 'true' : undefined}
                            onClick={() => {
                              setConfirmingArchiveThreadId(null)
                              onSelectProject(project.id)
                            }}
                          >
                            <IconInline name="folder" />
                            <span className="app-project-copy">
                              <span className="app-project-name">{project.name}</span>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="app-project-new-thread"
                            title={t('sidebar.newThreadInProject')}
                            aria-label={t('sidebar.newThreadInProjectAria', { name: project.name })}
                            onClick={(event) => {
                              event.stopPropagation()
                              setConfirmingArchiveThreadId(null)
                              onCreateThreadInProject(project.id)
                            }}
                          >
                            <IconInline name="plus" />
                          </button>
                        </div>
                        {showProjectSkills && showSkillsSection ? (
                          <div className="app-project-skill-block" aria-label={`${project.name} Skills`}>
                            <div className="app-sidebar-divider">
                              <span>{t('sidebar.skillsDivider')}</span>
                            </div>
                            <div className="app-skill-list">
                              {projectSkillState?.loading ? (
                                <div className="app-skill-empty">{t('sidebar.scanning')}</div>
                              ) : (
                                projectSkills.map((skill) => (
                                  <button
                                    key={skill.path}
                                    type="button"
                                    className="app-skill-row"
                                    title={skill.description || skill.relativePath}
                                    onClick={() => {
                                      setConfirmingArchiveThreadId(null)
                                      onRunProjectSkill(project.id, skill.title)
                                    }}
                                  >
                                    <IconInline name="chip" />
                                    <span className="app-skill-title">{skill.title}</span>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        ) : null}
                        {showProjectSkills && showThreadHistoryDivider ? (
                          <div className="app-sidebar-divider app-sidebar-divider--threads">
                            <span>{t('sidebar.threadHistory')}</span>
                          </div>
                        ) : null}
                        <div className="app-thread-list" aria-label={t('sidebar.threadsForProjectAria', { name: project.name })}>
                          {projectThreads.map((thread) => {
                            const isThreadActive = activeThreadId === thread.id
                            const isConfirming = confirmingArchiveThreadId === thread.id
                            const isPinned = Boolean(thread.pinnedAt)
                            const timeLabel = formatThreadTime(thread.updatedAt, locale, t)
                            return (
                              <div
                                key={thread.id}
                                className={`app-thread-row${isThreadActive ? ' is-active' : ''}${isPinned ? ' is-pinned' : ''}${isConfirming ? ' is-confirming-archive' : ''}`}
                              >
                                <button
                                  type="button"
                                  className={`app-thread-pin${isPinned ? ' is-pinned' : ''}`}
                                  title={isPinned ? t('sidebar.unpin') : t('sidebar.pin')}
                                  aria-label={
                                    isPinned
                                      ? t('sidebar.unpinThreadAria', { title: thread.title })
                                      : t('sidebar.pinThreadAria', { title: thread.title })
                                  }
                                  aria-pressed={isPinned}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setConfirmingArchiveThreadId(null)
                                    onToggleThreadPinned(thread.id)
                                  }}
                                >
                                  <IconInline name="pin" />
                                </button>
                                <button
                                  type="button"
                                  className="app-thread-select"
                                  aria-current={isThreadActive ? 'page' : undefined}
                                  onClick={() => {
                                    setConfirmingArchiveThreadId(null)
                                    onSelectThread(thread.id)
                                  }}
                                >
                                  <span className="app-thread-title">{thread.title}</span>
                                </button>
                                <div className="app-thread-trailing">
                                  <span className="app-thread-time" aria-label={t('sidebar.lastChatAria', { time: timeLabel })}>
                                    {timeLabel}
                                  </span>
                                  <button
                                    type="button"
                                    className={`app-thread-archive${isConfirming ? ' is-confirming' : ''}`}
                                    title={isConfirming ? t('sidebar.confirmArchive') : t('sidebar.archive')}
                                    aria-label={
                                      isConfirming
                                        ? t('sidebar.confirmArchiveAria', { title: thread.title })
                                        : t('sidebar.archiveAria', { title: thread.title })
                                    }
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      requestArchive(thread.id)
                                    }}
                                  >
                                    {isConfirming ? <span>{t('sidebar.confirm')}</span> : <IconInline name="trash" />}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </section>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
        {!isSettingsSidebar && (
          <footer className="app-sidebar-footer">
            <button
              type="button"
              className="btn btn-toolbar"
              id="btn-footer-settings"
              title={t('sidebar.settings')}
              aria-label={t('sidebar.settings')}
              onClick={() => {
                window.location.hash = 'settings/general'
              }}
            >
              <IconInline name="settings" />
            </button>
          </footer>
        )}
      </aside>
      <div
        className="app-sidebar-splitter no-drag"
        id="app-sidebar-splitter"
        ref={splitterRef}
        role="separator"
        aria-orientation="vertical"
        aria-label={t('sidebar.resizeSidebar')}
        onPointerDown={onSplitterPointerDown}
      />
    </>
  )
}

function formatThreadTime(timestamp: number, locale: AppLocale, t: (path: string, vars?: Record<string, string | number>) => string): string {
  const diff = Date.now() - timestamp
  if (diff < 60_000) return t('sidebar.justNow')
  if (diff < 3_600_000) return t('sidebar.minutesShort', { n: Math.max(1, Math.floor(diff / 60_000)) })
  if (diff < 86_400_000) return t('sidebar.hoursShort', { n: Math.floor(diff / 3_600_000) })
  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { month: 'numeric', day: 'numeric' }).format(timestamp)
}
