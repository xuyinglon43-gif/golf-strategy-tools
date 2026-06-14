import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { applyTheme, getPreference } from './lib/theme.js'

// 渲染前应用主题（默认跟随系统），避免首屏闪烁
applyTheme(getPreference())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
