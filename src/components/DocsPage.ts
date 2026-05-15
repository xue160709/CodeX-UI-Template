import type { AppView } from './types'

export class DocsPage implements AppView {
  readonly id = 'docs'
  readonly heading = '文档'
  readonly navLabel = '文档'

  render(): string {
    return `
      <section class="app-main-inner" id="panel-docs" hidden>
        <div class="app-main-eyebrow">文档</div>
        <h1 class="app-main-heading">文档</h1>
        <section class="app-panel">
          <p class="text-token-secondary" style="margin:0">文档视图占位。可在此接入路由或 Webview。</p>
        </section>
      </section>
    `
  }

  mount(): void {
    return
  }
}
