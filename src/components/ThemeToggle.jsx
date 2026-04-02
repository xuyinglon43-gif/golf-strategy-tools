import { useState, useEffect } from 'react'
import './ThemeToggle.css'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('golf_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('golf_theme', theme)
  }, [theme])

  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
