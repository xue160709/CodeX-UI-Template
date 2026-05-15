import { AppearanceSettingsPage } from './AppearanceSettingsPage'
import { ClaudeAgentSettingsPage } from './ClaudeAgentSettingsPage'
import type { SettingsCategoryId } from './types'

type SettingsPageProps = { hidden: boolean; settingsCategory: SettingsCategoryId }

export function SettingsPage({ hidden, settingsCategory }: SettingsPageProps) {
  if (hidden) {
    return null
  }

  if (settingsCategory === 'appearance') {
    return <AppearanceSettingsPage />
  }

  return <ClaudeAgentSettingsPage />
}
