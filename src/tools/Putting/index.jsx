import { useState } from 'react'
import HandicapPrompt from '../../components/HandicapPrompt'
import {
  getPgaMakeRateYards,
  getAmateurMakeRateYards,
  getThreePuttRateYards,
  getExpectedPuttsYards,
  getInsightYards,
  DISTANCE_REFS,
} from './data'
import './style.css'

export default function Putting({ handicap, setHandicap }) {
  const [distance, setDistance] = useState(3) // yards

  if (handicap === null) {
    return <HandicapPrompt onSet={setHandicap} />
  }

  const makeRate = getAmateurMakeRateYards(distance, handicap)
  const pgaRate = getPgaMakeRateYards(distance)
  const threePuttRate = getThreePuttRateYards(distance, handicap)
  const twoPuttRate = Math.max(0, 1 - makeRate - threePuttRate)
  const expected = getExpectedPuttsYards(distance, handicap)
  const insight = getInsightYards(distance, handicap)

  return (
    <div className="putt-page">
      <h1 className="putt-title no-print">推杆期望值计算器</h1>
      <p className="putt-sub no-print">差点 {handicap} · 拖动滑块或输入距离</p>

      <div className="putt-input-area no-print">
        <div className="putt-slider-wrap">
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={distance}
            onChange={(e) => setDistance(parseFloat(e.target.value))}
            className="putt-slider"
          />
          <div className="putt-slider-labels">
            <span>1码</span>
            <span>5码</span>
            <span>10码</span>
            <span>15码</span>
            <span>20码</span>
          </div>
        </div>
        <div className="putt-dist-input">
          <input
            type="number"
            min="1"
            max="20"
            step="0.5"
            value={distance}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v) && v >= 1 && v <= 20) setDistance(v)
            }}
            className="putt-num-input"
          />
          <span className="putt-unit">码</span>
          <span className="putt-yards">≈ {(distance * 0.9144).toFixed(1)} 米</span>
        </div>
      </div>

      <div className="putt-grid">
        <div className="putt-card putt-card-main">
          <div className="putt-card-label">一推进洞概率</div>
          <div className="putt-ring-wrap">
            <svg viewBox="0 0 120 120" className="putt-ring">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--green)"
                strokeWidth="8"
                strokeDasharray={`${makeRate * 327} 327`}
                strokeDashoffset="0"
                transform="rotate(-90 60 60)"
                strokeLinecap="round"
              />
            </svg>
            <div className="putt-ring-text">{(makeRate * 100).toFixed(0)}%</div>
          </div>
        </div>

        <div className="putt-card">
          <div className="putt-card-label">两推概率</div>
          <div className="putt-big-num" style={{ color: 'var(--yellow)' }}>
            {(twoPuttRate * 100).toFixed(0)}%
          </div>
        </div>

        <div className="putt-card">
          <div className="putt-card-label">三推概率</div>
          <div className="putt-big-num" style={{ color: threePuttRate > 0.1 ? 'var(--red)' : 'var(--text-secondary)' }}>
            {(threePuttRate * 100).toFixed(0)}%
          </div>
          {threePuttRate > 0.1 && <div className="putt-warning">三推风险较高</div>}
        </div>

        <div className="putt-card putt-card-expected">
          <div className="putt-card-label">预期推杆数</div>
          <div className="putt-huge-num">{expected.toFixed(2)}</div>
        </div>
      </div>

      <div className="putt-compare">
        <h3>你 vs PGA Tour</h3>
        <div className="putt-compare-row">
          <span className="putt-compare-label">你 (差点{handicap})</span>
          <div className="putt-compare-bar-track">
            <div className="putt-compare-bar" style={{ width: `${makeRate * 100}%`, background: 'var(--accent)' }} />
          </div>
          <span className="putt-compare-val">{(makeRate * 100).toFixed(0)}%</span>
        </div>
        <div className="putt-compare-row">
          <span className="putt-compare-label">PGA Tour</span>
          <div className="putt-compare-bar-track">
            <div className="putt-compare-bar" style={{ width: `${pgaRate * 100}%`, background: 'var(--green)' }} />
          </div>
          <span className="putt-compare-val">{(pgaRate * 100).toFixed(0)}%</span>
        </div>
      </div>

      <div className="putt-insight">
        <h3>洞察</h3>
        <p>{insight}</p>
      </div>

      <div className="putt-refs">
        <h3>距离参考</h3>
        <div className="putt-ref-list">
          {DISTANCE_REFS.map((r) => (
            <span key={r.yards} className={`putt-ref ${Math.abs(distance - r.yards) <= 0.5 ? 'active' : ''}`}>
              {r.yards}码 ≈ {r.desc}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
