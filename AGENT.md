# Agent Notes For Codex UI Cloning

This project is a Codex.app-inspired Electron/Vite UI template. When cloning or
developing the interface, treat the installed local Codex app as reference
material for observable structure, naming, layout, and token choices. Do not
copy large minified source chunks verbatim.

## First Read In This Repo

Start with these project files before touching implementation:

- `codex-ui-framework-notes.md`: architecture notes from the local Codex app.
- `codex-css-tokens.md`: short summary of extracted Codex CSS custom properties.
- `codex-css-tokens.json`: complete raw token inventory with definitions,
  alternate values, references, and source files.
- `codex-css-tokens.css`: readable raw token inventory. Use for reference only.
- `src/theme/tokens.css`: curated project token set. This is the file the app
  should import and evolve.
- `src/style.css`: app shell, sidebar, workspace, buttons, and utility classes.
- `src/main.ts`: renderer DOM, shell controls, navigation, sidebar resizing.
- `src/window-safe-area.ts`: window controls safe-area logic.
- `electron/main.ts`: BrowserWindow shell, titlebar, vibrancy, and system theme.
- `electron/preload.ts`: narrow bridge from Electron to the renderer.

## Local Codex Reference Files

Installed app root:

- `/Applications/Codex.app`

High-level bundle metadata:

- `/Applications/Codex.app/Contents/Info.plist`
  - Check bundle id, version, URL schemes, permissions, asar integrity, minimum
    macOS version, and Electron identity.
- `/Applications/Codex.app/Contents/Resources/package.json` does not exist
  directly. Read `package.json` from `app.asar` instead.

Main resource directory:

- `/Applications/Codex.app/Contents/Resources/app.asar`
  - Main Electron bundle and renderer bundle.
- `/Applications/Codex.app/Contents/Resources/app.asar.unpacked`
  - Native node modules and unpacked runtime dependencies.
- `/Applications/Codex.app/Contents/Resources/codex`
  - Bundled Codex CLI/runtime binary.
- `/Applications/Codex.app/Contents/Resources/node`
  - Bundled Node runtime.
- `/Applications/Codex.app/Contents/Resources/node_repl`
  - Bundled Node REPL runtime used by tools/plugins.
- `/Applications/Codex.app/Contents/Resources/rg`
  - Bundled ripgrep.
- `/Applications/Codex.app/Contents/Resources/native`
  - Native helpers such as Sparkle, browser-use authorization, launch services.
- `/Applications/Codex.app/Contents/Resources/plugins`
  - Bundled plugin marketplace and skills.

## Files Inside `app.asar` To Inspect

The local Codex app is Vite-built and minified. There are no source maps in the
observed production bundle, so inspect names, constants, CSS variables, and
short snippets rather than relying on original source structure.

Top-level asar entries:

- `package.json`
  - Confirms `openai-codex-electron`, Electron/Vite versions, native deps, build
    flavor, scripts, bundled runtime deps.
- `.vite/build/bootstrap.js`
  - Bootstrap process and startup error handling.
- `.vite/build/main-*.js`
  - BrowserWindow creation, window appearances, titlebar style, vibrancy,
    preload path, menu/IPC/window lifecycle.
- `.vite/build/preload.js`
  - Renderer bridge exposed as `electronBridge`.
- `.vite/build/sandbox-preload.js`
  - Sandbox/webview bridge, MCP app sandbox messaging.
- `.vite/build/comment-preload.js`
  - Comment/browser overlay preload logic.

Renderer shell and CSS:

- `webview/index.html`
  - Startup loader, root element, CSP, entry assets, initial drag region.
- `webview/assets/app-main-*.css`
  - Main token set, utility classes, font sizing, radii, heights, drag/no-drag,
    scrollbar utilities, theme adapter variables.
- `webview/assets/app-shell-*.css`
  - Shell-specific styles, tab shimmer, header tint, main viewport container.
- `webview/assets/app-shell-*.js`
  - App shell layout, left panel, right panel, bottom panel, header slots, top
    controls, focus areas.
- `webview/assets/app-shell-panel-animation-*.js`
  - Panel animation and resize handles.
- `webview/assets/app-shell-bottom-panel-scroll-sync-*.js`
  - Bottom panel scroll sync behavior.
- `webview/assets/use-window-controls-safe-area-*.js`
  - Safe-area calculation for macOS, Windows overlay, Linux, fullscreen.

Design-system components:

- `webview/assets/button-*.js`
  - Button variants, sizes, `no-drag`, toolbar buttons, loading spinner.
- `webview/assets/tooltip-*.js`
  - Floating UI tooltip, shortcut label rendering, portal behavior.
- `webview/assets/dialog-*.js`
  - Dialog primitive, focus trap, overlay, title/description accessibility.
- `webview/assets/dialog-*.css`
  - Dialog animation and transition tokens.
- `webview/assets/dropdown-*.js`
  - Dropdown primitives, menu items, groups, separators, checkbox/radio/submenu.
- `webview/assets/dropdown-*.css`
  - Dropdown placement and enter/exit transforms.
- `webview/assets/checkbox-*.js`, `badge-*.js`, `avatar-*.js`
  - Smaller reusable primitives when needed.

Commands and navigation:

- `webview/assets/electron-menu-shortcuts-*.js`
  - Canonical command ids, menu labels, shortcut defaults, command groups.
- `webview/assets/command-keybindings-*.js`
  - Keybinding lookup, shortcut labels, enabled/binding state.
- `webview/assets/command-messages-*.js`
  - Localized command strings.
- `webview/assets/use-command-hotkey-*.js`
  - Renderer command hotkey registration.
- `webview/assets/app-shell-*.js`
  - Look for `toggleSidebar`, `navigateBack`, `navigateForward` top-left shell
    control behavior.

State and shell signals:

- `webview/assets/sidebar-signals-*.js`
  - Sidebar filters, sort keys, collapsed groups, persisted UI preferences.
- `webview/assets/app-server-manager-signals-*.js`
  - App server connection/global state shape.
- `webview/assets/app-server-connection-state-*.js`
  - Runtime connection states.
- `webview/assets/app-intl-signal-*.js`
  - Internationalization signal setup.
- `webview/assets/use-resolved-theme-variant-*.js`
  - Theme variant resolution.

Feature references worth checking only when working on that surface:

- `webview/assets/composer-*.js` and `webview/assets/composer-*.css`
  - Composer controls, input sizing, send controls.
- `webview/assets/thread-side-panel-browser-tab-state-*.js`
  - Browser/right panel state.
- `webview/assets/review-header-toolbar-*.js`
  - Review toolbar patterns.
- `webview/assets/diff-unified-*.css`
  - Diff coloring and layout.
- `webview/assets/markdown-*.css`
  - Markdown rendering tokens.
- `webview/assets/pdf-preview-panel-*.css`
  - Artifact preview panel styling.
- `webview/apps/*`
  - External app icons and launch targets.

## How To Inspect `app.asar`

There is no `asar` CLI required. Use Node to read the asar header and extract
specific files. Keep extracted analysis temporary unless the user asks to save
it.

List top-level entries:

```sh
node -e "const fs=require('fs');const p='/Applications/Codex.app/Contents/Resources/app.asar';const b=fs.readFileSync(p);const hs=b.readUInt32LE(12);const h=JSON.parse(b.subarray(16,16+hs));console.log(Object.keys(h.files));"
```

Read a file from `app.asar`:

```sh
node -e "const fs=require('fs');const p='/Applications/Codex.app/Contents/Resources/app.asar';const b=fs.readFileSync(p);const hs=b.readUInt32LE(12);const h=JSON.parse(b.subarray(16,16+hs));const data=16+hs;function e(path){return path.split('/').filter(Boolean).reduce((n,k)=>n.files[k],h)}function r(path){const x=e(path);return b.subarray(data+Number(x.offset),data+Number(x.offset)+x.size).toString()}console.log(r('package.json'))"
```

List renderer CSS files:

```sh
node -e "const fs=require('fs');const p='/Applications/Codex.app/Contents/Resources/app.asar';const b=fs.readFileSync(p);const hs=b.readUInt32LE(12);const h=JSON.parse(b.subarray(16,16+hs));function walk(n,p=''){for(const [k,e] of Object.entries(n.files||{})){const q=p?p+'/'+k:k;if(e.files)walk(e,q);else if(q.startsWith('webview/')&&q.endsWith('.css'))console.log(q)}}walk(h)"
```

## What To Use From The Raw Tokens

Use these categories directly in project CSS:

- Font tokens: `--font-sans`, `--font-mono`, font weights.
- Type tokens: `--text-xs`, `--text-sm`, `--text-base`, headings.
- Spacing tokens: `--spacing`, `--padding-panel`, `--padding-toolbar`.
- Shell layout tokens: `--height-toolbar`, `--height-toolbar-sm`,
  `--height-toolbar-pane`, safe-header variables, sidebar width.
- Radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`,
  `--radius-workspace`.
- Semantic colors: `--color-token-main-surface-primary`,
  `--color-token-foreground`, `--color-token-text-primary`,
  `--color-token-text-secondary`, `--color-token-border`,
  `--color-token-list-hover-background`.
- App shell colors: `--codex-titlebar-tint`,
  `--color-token-sidebar-glass-surface`,
  `--color-token-sidebar-glass-fallback`,
  `--color-token-sidebar-edge-border`.
- Motion tokens: `--transition-duration-basic`,
  `--transition-duration-relaxed`, `--cubic-enter`, `--cubic-exit-snappy`.

Do not use these as project-level design tokens unless a feature specifically
needs them:

- `--tw-*`: Tailwind/compiler runtime variables.
- `--radix-*`: runtime placement and primitive state variables.
- `--katex-*`: math rendering internals.
- Most `--vscode-*`: external adapter inputs. Map them into project semantic
  tokens instead of using them throughout app code.
- Feature-only tokens from markdown, PDF, Popcorn, diff, or browser panels
  unless implementing that exact surface.

## Project Theme Policy

The app follows the operating system theme. Do not add manual theme toggles,
`localStorage` theme persistence, or `[data-theme]` selectors.

Use:

```css
:root {
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
  }
}
```

Electron may use `nativeTheme.shouldUseDarkColors` for startup background and
window chrome alignment, but should keep `nativeTheme.themeSource = 'system'`.

## Implementation Rules For Codex-Like UI

- Build from shell primitives first: window, safe area, sidebar, workspace,
  toolbar, panel resize, command ids.
- Keep `src/theme/tokens.css` as the semantic design-system source of truth.
- Do not import `codex-css-tokens.css` into runtime app styles. It is raw
  reference material.
- All interactive elements inside draggable areas must be `no-drag`.
- Icon buttons need stable dimensions, `aria-label`, disabled state, and tooltip
  once a tooltip system exists.
- Use command ids for toolbar/menu/shortcut actions instead of wiring unrelated
  click logic in each component.
- Keep macOS vibrancy and transparent areas separated from opaque workspace
  surfaces.
- Run `npm run build` after token, CSS, Electron, or renderer changes.
