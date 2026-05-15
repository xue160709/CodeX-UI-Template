import './style.css'
import { AppShell } from './components/AppShell'
import { ChatPage } from './components/ChatPage'
import { DocsPage } from './components/DocsPage'
import { SettingsPage } from './components/SettingsPage'
import { applySafeAreaToDocument, installWindowSafeAreaListeners } from './window-safe-area'

if (window.desktop?.windowEffects?.macVibrancy) {
  document.documentElement.dataset.windowEffects = 'mac-vibrancy'
}

const appRoot = document.querySelector<HTMLDivElement>('#app')
if (!appRoot) throw new Error('Missing #app root element.')

const chatPage = new ChatPage()
const shell = new AppShell(appRoot, {
  views: [chatPage, new DocsPage(), new SettingsPage()],
  navViewIds: ['home', 'docs'],
  onNewThread: () => chatPage.startNewThread(),
})

shell.mount()
chatPage.setStatusTarget(shell.getStatusElement())

installWindowSafeAreaListeners((area) => {
  applySafeAreaToDocument(area)
})
