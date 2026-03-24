// ── テーマシステム ────────────────────────────────────────────
// テーマ型定義

export interface ThemeFortune {
  id: string
  result: string      // 表示テキスト（例: "大吉"）
  reading: string     // 読み（例: "だいきち"）
  message: string
  resultColor: string
  bg: string          // 結果画面背景グラデーション
  cardBg: string
  cardBorder: string
  accent: string
  shimmer: string     // CSSアニメーション名
  anim: string        // 結果テキスト出現アニメーション
}

export interface Theme {
  id: string
  name: string
  video: string
  fortunes: ThemeFortune[]
  resultBg?: string   // 結果画面背景（省略時は fortune.bg を使用）
}

// ── テーマレジストリ ──────────────────────────────────────────
import { defaultTheme } from './default'
import { ivisionTheme } from './ivision'

const THEMES: Record<string, Theme> = {
  default: defaultTheme,
  ivision: ivisionTheme,
}

export { defaultTheme }

export function loadTheme(id: string): Theme {
  return THEMES[id] ?? defaultTheme
}

export function getThemeIds(): string[] {
  return Object.keys(THEMES)
}
