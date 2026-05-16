import './style.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from './components/AppShell'
import { I18nProvider } from './i18n/i18n'
import { applySafeAreaToDocument, installWindowSafeAreaListeners } from './window-safe-area'

if (window.desktop?.windowEffects?.macVibrancy) {
  document.documentElement.dataset.windowEffects = 'mac-vibrancy'
}

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) throw new Error('Missing #app root element.')

createRoot(appRoot).render(
  <StrictMode>
    <I18nProvider>
      <AppShell />
    </I18nProvider>
  </StrictMode>,
)

installWindowSafeAreaListeners((area) => {
  applySafeAreaToDocument(area)
})
