import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import en from '../locales/en.json'
import zh from '../locales/zh.json'

export type AppLocale = 'en' | 'zh'

export const LOCALE_STORAGE_KEY = 'CodeX-UI-Template-locale-v1'

type Messages = typeof en

const CATALOG: Record<AppLocale, Messages> = { en, zh }

export function getInitialLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw === 'en' || raw === 'zh') return raw
  } catch {
    /* ignore */
  }
  return 'zh'
}

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

function applyInterpolation(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  let out = template
  for (const [key, value] of Object.entries(vars)) {
    const token = `{{${key}}}`
    out = out.split(token).join(String(value))
  }
  return out
}

export function translate(
  locale: AppLocale,
  path: string,
  vars?: Record<string, string | number>,
): string {
  const msg = getByPath(CATALOG[locale], path)
  if (msg !== undefined) return applyInterpolation(msg, vars)
  const fb = getByPath(CATALOG.en, path)
  if (import.meta.env?.DEV && fb === undefined) {
    console.warn(`[i18n] missing translation: ${path}`)
  }
  return applyInterpolation(fb ?? path, vars)
}

const zhTitle = getByPath(CATALOG.zh, 'thread.newThreadTitle')
const enTitle = getByPath(CATALOG.en, 'thread.newThreadTitle')
export const defaultThreadTitleSet = new Set([zhTitle, enTitle].filter(Boolean) as string[])

type I18nContextValue = {
  locale: AppLocale
  t: (path: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = getInitialLocale()
  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => translate(locale, path, vars),
    [locale],
  )
  const value = useMemo(() => ({ locale, t }), [locale, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
