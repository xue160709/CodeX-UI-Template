# Codex CSS Token Extraction

Source: `/Applications/Codex.app/Contents/Resources/app.asar`

App: Codex 26.506.31421

Generated: 2026-05-14T15:38:10.382Z

Default value policy: first definition encountered in source-order CSS asset scan.

## Counts

- CSS files scanned: 18
- Tokens total: 1216
- Tokens with definitions: 1191
- Referenced-only tokens: 25
- Definition occurrences: 2430
- Reference occurrences: 4539

## Categories

- font: 9
- typography: 23
- spacing: 8
- layout: 11
- radius: 20
- motion: 8
- effect: 6
- color-primitive-semantic: 110
- color-token: 97
- codex-component: 6
- app-shell: 10
- overlay-component: 4
- vscode-theme-adapter: 703
- radix-runtime: 6
- tailwind-runtime: 77
- other: 118

## Key Shell Tokens

- `--font-sans-default`: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- `--font-mono-default`: `ui-monospace, "SFMono-Regular", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`
- `--font-sans`: `var(--vscode-font-family,var(--font-sans-default))`
- `--font-mono`: `var(--vscode-editor-font-family,var(--font-mono-default))`
- `--spacing`: `.25rem`
- `--height-toolbar`: `46px`
- `--height-toolbar-sm`: `36px`
- `--height-toolbar-pane`: `40px`
- `--spacing-token-sidebar`: `clamp(240px, 300px, min(520px, calc(100vw - 320px)))`
- `--spacing-token-safe-header-left`: `0px`
- `--spacing-token-safe-header-right`: `0px`
- `--radius-xs-base`: `.25rem`
- `--radius-sm-base`: `.375rem`
- `--radius-md-base`: `.5rem`
- `--radius-lg-base`: `.625rem`
- `--transition-duration-basic`: `.15s`
- `--transition-duration-relaxed`: `.3s`
- `--cubic-enter`: `cubic-bezier(.19, 1, .22, 1)`
- `--cubic-exit-snappy`: `cubic-bezier(.65, 0, .4, 1)`
- `--color-token-main-surface-primary`: `var(--color-background-surface)`
- `--color-token-text-primary`: `var(--color-token-foreground)`
- `--color-token-text-secondary`: `var(--color-token-foreground)`
- `--color-token-border`: `var(--color-border,var(--vscode-foreground))`
- `--color-token-list-hover-background`: `var(--vscode-list-hoverBackground)`

## Files

- `codex-css-tokens.json`: complete token definitions, references, source files, and alternate values.
- `codex-css-tokens.css`: readable grouped custom-property inventory.
