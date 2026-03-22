import { Link, useLocation } from 'react-router-dom'
import HandicapInput from './HandicapInput'
import './Layout.css'

export default function Layout({ handicap, setHandicap, children }) {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="layout">
      <header className="topbar no-print">
        <Link to="/" className="logo">
          <span className="logo-icon">&#9971;</span>
          <span className="logo-text">高尔夫策略工具箱</span>
        </Link>
        <div className="topbar-right">
          <HandicapInput handicap={handicap} setHandicap={setHandicap} />
          <Link to="/about" className="about-link">关于</Link>
        </div>
      </header>
      <main className={isHome ? 'main-home' : 'main-tool'}>
        {children}
      </main>
      <footer className="footer no-print">
        <span>许多帕 × Claude</span>
        <span className="footer-sep">·</span>
        <span>数据来源：Arccos / PGA ShotLink / Strokes Gained 研究</span>
      </footer>
    </div>
  )
}
