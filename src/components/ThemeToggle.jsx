import { useState, useEffect } from 'react'
import { getPreference, setPreference, applyTheme } from '../lib/theme.js'
import './ThemeToggle.css'

// 三态循环：跟随系统 → 浅色 → 深色 → 跟随系统
const NEXT = { system: 'light', light: 'dark', dark: 'system' }
const META = {
  system: { icon: '🖥️', label: '主题：跟随系统' },
  light: { icon: '☀️', label: '主题：浅色' },
  dark: { icon: '🌙', label: '主题：深色' },
}

export default function ThemeToggle() {
  const [pref, setPref] = useState(getPreference)

  // 当偏好为“跟随系统”时，监听系统明暗变化并实时应用
  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const cycle = () => {
    const next = NEXT[pref]
    setPref(next)
    setPreference(next)
  }

  return (
    <button
      className="theme-toggle"
      onClick={cycle}
      title={META[pref].label}
      aria-label={META[pref].label}
    >
      {META[pref].icon}
    </button>
  )
}
