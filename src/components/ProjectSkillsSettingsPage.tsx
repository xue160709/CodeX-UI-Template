import { useCallback, useState } from 'react'
import { IconInline } from '../icon-inline'
import { getInitialLocale, LOCALE_STORAGE_KEY, useI18n, type AppLocale } from '../i18n/i18n'

type ProjectSkillsSettingsPageProps = {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
}

export function ProjectSkillsSettingsPage({ enabled, onEnabledChange }: ProjectSkillsSettingsPageProps) {
  const { locale: sessionLocale, t } = useI18n()
  const [pickerLocale, setPickerLocale] = useState<AppLocale>(() => getInitialLocale())
  const [showRestartHint, setShowRestartHint] = useState(false)

  const requestQuit = useCallback(() => {
    const quit = window.desktop?.quitApp
    if (quit) {
      void quit()
      return
    }
    window.close()
  }, [])

  const pickLocale = useCallback(
    (next: AppLocale) => {
      setPickerLocale(next)
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, next)
      } catch {
        /* ignore */
      }
      setShowRestartHint(next !== sessionLocale)
    },
    [sessionLocale],
  )

  return (
    <section className="app-main-inner settings-page settings-page--models" id="panel-settings" aria-hidden={false}>
      <header className="settings-page-header">
        <h1 className="app-main-heading">{t('settings.general.pageTitle')}</h1>
        <p className="settings-lede">{t('settings.general.pageLede')}</p>
      </header>

      <div className="settings-stack">
        <section className="settings-section" aria-labelledby="settings-section-language-heading">
          <h2 id="settings-section-language-heading" className="settings-section-heading">
            {t('settings.general.languageHeading')}
          </h2>
          <p className="settings-section-caption">{t('settings.general.languageCaption')}</p>
          <div className="settings-segmented" role="radiogroup" aria-label={t('settings.general.languageHeading')}>
            <label className={pickerLocale === 'zh' ? 'settings-segment is-selected' : 'settings-segment'}>
              <input
                type="radio"
                name="appLocale"
                value="zh"
                className="settings-segment-input"
                checked={pickerLocale === 'zh'}
                onChange={() => pickLocale('zh')}
              />
              <span className="settings-segment-body">
                <span className="settings-segment-top">
                  <span className="settings-segment-title">{t('settings.general.languageZh')}</span>
                  <span className="settings-segment-radio" aria-hidden="true" />
                </span>
              </span>
            </label>
            <label className={pickerLocale === 'en' ? 'settings-segment is-selected' : 'settings-segment'}>
              <input
                type="radio"
                name="appLocale"
                value="en"
                className="settings-segment-input"
                checked={pickerLocale === 'en'}
                onChange={() => pickLocale('en')}
              />
              <span className="settings-segment-body">
                <span className="settings-segment-top">
                  <span className="settings-segment-title">{t('settings.general.languageEn')}</span>
                  <span className="settings-segment-radio" aria-hidden="true" />
                </span>
              </span>
            </label>
          </div>
          {showRestartHint ? (
            <div className="settings-group" role="alert">
              <p className="settings-section-caption" style={{ marginTop: '0.75rem' }}>
                {t('settings.general.languageRestartHint')}
              </p>
              <div className="settings-actions" style={{ marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-primary" onClick={requestQuit}>
                  {t('settings.general.quitApp')}
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <section className="settings-section" aria-labelledby="settings-section-project-skills-heading">
          <h2 id="settings-section-project-skills-heading" className="settings-section-heading">
            {t('settings.general.projectSkillsHeading')}
          </h2>
          <p className="settings-section-caption">{t('settings.general.projectSkillsCaption')}</p>
          <div className="settings-group">
            <label className="settings-switch-row">
              <span className="settings-field-row__meta">
                <span className="settings-field-row__label">
                  <IconInline name="chip" />
                  {t('settings.general.showProjectSkills')}
                </span>
                <span className="settings-field-row__hint">{t('settings.general.showProjectSkillsHint')}</span>
              </span>
              <span className="settings-switch-control">
                <input
                  type="checkbox"
                  className="settings-switch-input"
                  checked={enabled}
                  onChange={(event) => onEnabledChange(event.target.checked)}
                />
                <span className="settings-switch-track" aria-hidden="true">
                  <span className="settings-switch-thumb" />
                </span>
              </span>
            </label>
          </div>
          <p className="settings-switch-status" role="status">
            {enabled ? t('settings.general.statusOn') : t('settings.general.statusOff')}
          </p>
        </section>
      </div>
    </section>
  )
}
