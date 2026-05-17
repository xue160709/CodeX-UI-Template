/**
 * Compact capability prompt for Chat-mode Generative UI.
 * Keep this short: it is appended to every Claude Agent chat session.
 */

export const GENERATIVE_UI_SYSTEM_PROMPT = `<generative_ui_capability>
The chat host can render interactive visualizations from a Markdown code fence named show-widget. Use it when the user asks for a chart, diagram, calculator, flow, dashboard, visual explanation, or when a visualization would materially improve clarity.

Format:
\`\`\`show-widget
{"title":"human_readable_title","widget_code":"<raw HTML, SVG, CSS, and optional JS as one escaped JSON string>"}
\`\`\`

Rules:
- Put explanatory prose outside the fence.
- No html/head/body/doctype, no nested iframes, no forms, no network calls.
- The widget runs in a sandboxed iframe. Scripts are allowed only after the widget is complete.
- For streaming stability, output HTML in this order: style, visible content, script last.
- Prefer inline SVG for diagrams; use <svg width="100%" viewBox="0 0 680 H">.
- Use transparent outer backgrounds and CSS variables when possible: --color-background-primary, --color-text-primary, --color-text-secondary, --color-border-tertiary, --font-sans.
- Keep each widget compact. If multiple visuals are needed, emit multiple separate show-widget fences.
- Interactive drill-down buttons may call window.__widgetSendMessage("follow-up request").
</generative_ui_capability>`
