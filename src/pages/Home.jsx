import { Link } from 'react-router-dom'
import './Home.css'

const tools = [
  {
    id: 'gto',
    name: '攻果岭GTO矩阵',
    desc: '告诉你这一杆该不该攻果岭',
    path: '/gto',
    available: true,
    icon: '🟢🟡🔴',
  },
  {
    id: 'dispersion',
    name: '散布圈策略模拟器',
    desc: '告诉你攻果岭的时候瞄哪里',
    path: '/dispersion',
    available: true,
    icon: '🎯',
  },
  {
    id: 'putting',
    name: '推杆期望值计算器',
    desc: '告诉你推杆应该有什么期望',
    path: '/putting',
    available: true,
    icon: '🏌️',
  },
  {
    id: 'roadmap',
    name: '差点路线图',
    desc: '告诉你该练什么能最快降差点',
    path: null,
    available: false,
    icon: '📈',
  },
  {
    id: 'risk-reward',
    name: '风险回报模拟器',
    desc: '告诉你par5第二杆该不该搏',
    path: null,
    available: false,
    icon: '⚖️',
  },
]

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero-title">理解你的概率，做+EV的决策</h1>
        <p className="hero-sub">你不能选起手牌，但可以选怎么打</p>
      </section>
      <section className="tool-grid">
        {tools.map((tool) => (
          <div key={tool.id} className={`tool-card ${!tool.available ? 'disabled' : ''}`}>
            <div className="tool-icon">{tool.icon}</div>
            <h3 className="tool-name">{tool.name}</h3>
            <p className="tool-desc">{tool.desc}</p>
            {tool.available ? (
              <Link to={tool.path} className="tool-btn">进入工具</Link>
            ) : (
              <span className="tool-coming">Coming Soon</span>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
