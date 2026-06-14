// 主题偏好：'system'（默认，跟随系统）| 'light' | 'dark'
// DOM 上始终写入解析后的 'light' / 'dark'，CSS 仅需维护两套令牌。

const KEY = 'golf_theme'

export function getPreference() {
  const v = localStorage.getItem(KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

export function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function applyTheme(pref) {
  document.documentElement.setAttribute('data-theme', resolveTheme(pref))
}

export function setPreference(pref) {
  localStorage.setItem(KEY, pref)
  applyTheme(pref)
}
