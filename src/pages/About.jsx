import './About.css'

export default function About() {
  return (
    <div className="about">
      <h1>关于</h1>

      <section className="about-section">
        <h2>这个工具箱是什么</h2>
        <p>
          帮助高尔夫球友用概率思维做球场决策。灵感来自德州扑克的GTO（Game Theory Optimal）思维
          —— 你不能选起手牌，但可以选怎么打。
        </p>
      </section>

      <section className="about-section">
        <h2>数据来源</h2>
        <ul>
          <li>Arccos — 15亿+击球数据</li>
          <li>PGA ShotLink — 职业巡回赛数据</li>
          <li>Strokes Gained 研究 — Mark Broadie</li>
          <li>Shot Scope — 业余球手统计</li>
          <li>Lou Stagner — 散布研究</li>
          <li>GOLFTEC — 10000+次挥杆分析</li>
        </ul>
      </section>

      <section className="about-section">
        <h2>作者</h2>
        <p>许多帕 × Claude</p>
      </section>

      <section className="about-section">
        <h2>声明</h2>
        <p>
          数据为近似值，仅供参考，不替代教练指导。
          所有计算基于统计平均值，个体差异请结合自身情况调整。
        </p>
      </section>
    </div>
  )
}
