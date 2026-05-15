export type AppViewId = 'home' | 'docs' | 'settings'

export type AppView = {
  id: AppViewId
  heading: string
  navLabel?: string
  render(): string
  mount(root: HTMLElement): void
  setVisible?(visible: boolean): void
}
