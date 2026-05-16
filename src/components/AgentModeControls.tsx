import { useI18n } from '../i18n/i18n'

type AgentModeControlsProps = {
  variant: 'popover' | 'embedded'
  enabled: boolean
  todoEnabled: boolean
  loading: boolean
  onAgentSwitchChange: (checked: boolean) => void
  onTodoSwitchChange: (checked: boolean) => void
}

export function AgentModeControls({
  variant,
  enabled,
  todoEnabled,
  loading,
  onAgentSwitchChange,
  onTodoSwitchChange,
}: AgentModeControlsProps) {
  const { t } = useI18n()

  return (
    <div
      className={`agent-mode-controls${variant === 'embedded' ? ' agent-mode-controls--embedded' : ''}`}
      aria-busy={loading}
    >
      <label className="agent-mode-switch">
        <span className="agent-mode-switch__copy">
          <span>{t('workspace.agentModeToggle')}</span>
          <span>{t('workspace.agentModeToggleDesc')}</span>
        </span>
        <span className="settings-switch-control">
          <input
            className="settings-switch-input"
            type="checkbox"
            checked={enabled}
            disabled={loading}
            onChange={(event) => {
              onAgentSwitchChange(event.target.checked)
            }}
          />
          <span className="settings-switch-track" aria-hidden="true">
            <span className="settings-switch-thumb" />
          </span>
        </span>
      </label>
      {enabled ? (
        <label className="agent-mode-switch">
          <span className="agent-mode-switch__copy">
            <span>{t('workspace.todoModeToggle')}</span>
            <span>{t('workspace.todoModeToggleDesc')}</span>
          </span>
          <span className="settings-switch-control">
            <input
              className="settings-switch-input"
              type="checkbox"
              checked={todoEnabled}
              disabled={loading}
              onChange={(event) => {
                onTodoSwitchChange(event.target.checked)
              }}
            />
            <span className="settings-switch-track" aria-hidden="true">
              <span className="settings-switch-thumb" />
            </span>
          </span>
        </label>
      ) : null}
    </div>
  )
}
