import { useState, useEffect, useRef } from 'react'
import HandicapPrompt from '../../components/HandicapPrompt'
import { stages, getStageIndex } from './data'
import './style.css'

function ClubTag({ name, status }) {
  const labels = { core: '必备', new: '新增', skip: '不需要', later: '以后再说' }
  return (
    <span className={`club-tag club-tag-${status}`}>
      {name}
      <span className="club-tag-label">{labels[status]}</span>
    </span>
  )
}

function StageCard({ stage, isCurrent, stageIndex }) {
  const [checked, setChecked] = useState([])
  const ref = useRef(null)

  useEffect(() => {
    if (isCurrent && ref.current) {
      const timer = setTimeout(() => {
        ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isCurrent])

  const toggleSignal = (i) => {
    setChecked((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    )
  }

  const allChecked = stage.signals && checked.length === stage.signals.length

  return (
    <div
      ref={ref}
      className={`stage-card ${isCurrent ? 'stage-current' : ''}`}
      style={{ '--stage-color': stage.color }}
    >
      <div className="stage-header">
        <div className="stage-color-bar" />
        <span className="stage-badge" style={{ background: stage.badgeBg, color: stage.badgeText }}>
          阶段{stage.id}
        </span>
        <h3 className="stage-title">{stage.name}</h3>
        <span className="stage-range">{stage.range}</span>
        {isCurrent && <span className="stage-you">← 你在这里</span>}
      </div>

      <div className="stage-body">
        <div className="stage-clubs">
          <h4 className="stage-section-title">推荐配包</h4>
          <div className="club-tags">
            {stage.clubs.map((club, i) => (
              <ClubTag key={i} name={club.name} status={club.status} />
            ))}
          </div>
          <p className="stage-explanation">{stage.explanation}</p>
        </div>

        <div className="stage-signals">
          <h4 className="stage-section-title">
            {stage.signals ? '升入下一阶段的信号' : '进阶信号'}
          </h4>
          {stage.signals ? (
            <>
              <ul className="signal-list">
                {stage.signals.map((signal, i) => (
                  <li
                    key={i}
                    className={`signal-item ${checked.includes(i) ? 'signal-checked' : ''}`}
                    onClick={() => toggleSignal(i)}
                  >
                    <span className="signal-circle">
                      {checked.includes(i) ? '✓' : ''}
                    </span>
                    {signal}
                  </li>
                ))}
              </ul>
              {allChecked && (
                <div className="signal-complete">
                  你已达到下一阶段的标准！
                </div>
              )}
            </>
          ) : (
            <p className="signal-custom">
              没有固定的进阶信号，完全按自己的 Strokes Gained 弱点定制
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClubGuide({ handicap, setHandicap }) {
  if (handicap === null) {
    return <HandicapPrompt onSet={setHandicap} />
  }

  const currentIndex = getStageIndex(handicap)

  return (
    <div className="club-guide">
      <div className="club-guide-header">
        <h2 className="club-guide-title">球杆配置路线图</h2>
        <p className="club-guide-sub">
          根据你的差点，看清每个阶段该拿什么杆、不该碰什么杆
        </p>
        <p className="club-guide-hint">推荐电脑端学习，建立策略直觉后带上球场</p>
      </div>

      <div className="club-legend">
        <span className="legend-item legend-core">现阶段必备</span>
        <span className="legend-item legend-new">这个阶段新增</span>
        <span className="legend-item legend-skip">暂时不需要</span>
        <span className="legend-item legend-later">以后再说</span>
      </div>

      <div className="stage-list">
        {stages.map((stage, i) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isCurrent={i === currentIndex}
            stageIndex={i}
          />
        ))}
      </div>

      <div className="club-guide-footer">
        <div className="footer-block">
          <h4>常见误区</h4>
          <p>
            球道木（3号木、5号木）不是从地面随便打的杆，需要非常精准的击球点，比一号木难很多。Arccos 分析 1.8 亿次开球数据发现，业余球员用球道木和一号木的球道命中率几乎没有差别——但球道木少飞 20–30 码。除非有明确的战术需要，否则先把 Hybrid 和挖起杆用好，回报率更高。
          </p>
        </div>
        <div className="footer-block">
          <h4>数据说明</h4>
          <p>
            配包建议参考 Arccos、Shot Scope 真实数据，结合各差点段 Strokes Gained 分析推算。具体数字为参考区间，非精确统计值。
          </p>
        </div>
      </div>
    </div>
  )
}
