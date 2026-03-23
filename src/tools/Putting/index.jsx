import { useState, useRef, useEffect, useCallback } from 'react'
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

const W = 400, H = 400
const CX = W / 2, CY = H / 2
const HOLE_R = 6
const BALL_R = 8
const RINGS = [1, 2, 3, 5, 7, 10] // yards
const PX_PER_YARD = 16 // scale: 1 yard = 16px

export default function Putting({ handicap, setHandicap }) {
  const canvasRef = useRef(null)
  const [ballX, setBallX] = useState(CX + 3 * PX_PER_YARD)
  const [ballY, setBallY] = useState(CY)
  const dragging = useRef(false)

  const distance = Math.max(0.3, Math.sqrt((ballX - CX) ** 2 + (ballY - CY) ** 2) / PX_PER_YARD)

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
      <p className="putt-sub no-print">差点 {handicap} · 拖动白球改变距离</p>
      <p className="putt-desktop-hint no-print">推荐电脑端学习，建立策略直觉后带上球场</p>

      <div className="putt-layout">
        <div className="putt-canvas-wrap">
          <PuttingCanvas
            canvasRef={canvasRef}
            ballX={ballX} ballY={ballY}
            setBallX={setBallX} setBallY={setBallY}
            dragging={dragging}
            distance={distance}
            makeRate={makeRate}
          />
        </div>

        <div className="putt-stats">
          <div className="putt-dist-display">
            <span className="putt-dist-num">{distance.toFixed(1)}</span>
            <span className="putt-dist-unit">码</span>
          </div>

          <div className="putt-grid">
            <div className="putt-card putt-card-main">
              <div className="putt-card-label">一推进洞</div>
              <div className="putt-ring-wrap">
                <svg viewBox="0 0 120 120" className="putt-ring">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--green)" strokeWidth="8"
                    strokeDasharray={`${makeRate * 327} 327`} strokeDashoffset="0"
                    transform="rotate(-90 60 60)" strokeLinecap="round" />
                </svg>
                <div className="putt-ring-text">{(makeRate * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div className="putt-card">
              <div className="putt-card-label">两推</div>
              <div className="putt-big-num" style={{ color: 'var(--yellow)' }}>{(twoPuttRate * 100).toFixed(0)}%</div>
            </div>
            <div className="putt-card">
              <div className="putt-card-label">三推</div>
              <div className="putt-big-num" style={{ color: threePuttRate > 0.1 ? 'var(--red)' : 'var(--text-secondary)' }}>
                {(threePuttRate * 100).toFixed(0)}%
              </div>
              {threePuttRate > 0.1 && <div className="putt-warning">三推风险较高</div>}
            </div>
          </div>

          <div className="putt-card putt-card-expected">
            <div className="putt-card-label">预期推杆数</div>
            <div className="putt-huge-num">{expected.toFixed(2)}</div>
          </div>

          <div className="putt-compare">
            <h3>你 vs PGA Tour · 一推率</h3>
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
            <h3>建议</h3>
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
      </div>
    </div>
  )
}

function PuttingCanvas({ canvasRef, ballX, ballY, setBallX, setBallY, dragging, distance, makeRate }) {
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Green background
    ctx.fillStyle = '#4a9e5e'
    ctx.fillRect(0, 0, W, H)

    // Subtle grain
    ctx.fillStyle = '#3d8a50'
    for (let y = 0; y < H; y += 8) {
      ctx.fillRect(0, y, W, 1)
    }

    // Concentric rings
    for (const r of RINGS) {
      const px = r * PX_PER_YARD
      if (px > W / 2 + 20) continue
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.arc(CX, CY, px, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      // Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = '10px DM Sans, Noto Sans SC, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`${r}码`, CX + px - 12, CY - 4)
    }

    // Distance line from hole to ball
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(CX, CY)
    ctx.lineTo(ballX, ballY)
    ctx.stroke()
    ctx.setLineDash([])

    // Hole
    ctx.fillStyle = '#1a1a18'
    ctx.beginPath()
    ctx.arc(CX, CY, HOLE_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(CX, CY, HOLE_R, 0, Math.PI * 2)
    ctx.stroke()

    // Flag
    ctx.fillStyle = 'white'
    ctx.fillRect(CX, CY - 30, 2, 30)
    ctx.fillStyle = '#e03030'
    ctx.beginPath()
    ctx.moveTo(CX + 2, CY - 30)
    ctx.lineTo(CX + 14, CY - 25)
    ctx.lineTo(CX + 2, CY - 20)
    ctx.fill()

    // Ball
    ctx.fillStyle = '#fff'
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2
    ctx.beginPath()
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    // Ball dimple effect
    ctx.strokeStyle = 'rgba(200,200,200,0.5)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2)
    ctx.stroke()

    // Distance label near ball
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px DM Sans, Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${distance.toFixed(1)}码`, ballX, ballY + BALL_R + 16)

  }, [ballX, ballY, distance, canvasRef])

  useEffect(() => { draw() }, [draw])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const handleDown = (e) => {
    const pos = getPos(e)
    if ((pos.x - ballX) ** 2 + (pos.y - ballY) ** 2 < 400) {
      dragging.current = true
    }
  }

  const handleMove = (e) => {
    if (!dragging.current) return
    e.preventDefault()
    const pos = getPos(e)
    // Clamp to canvas
    setBallX(Math.max(BALL_R, Math.min(W - BALL_R, pos.x)))
    setBallY(Math.max(BALL_R, Math.min(H - BALL_R, pos.y)))
  }

  const handleUp = () => { dragging.current = false }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', maxWidth: W, aspectRatio: '1/1' }}
      onMouseDown={handleDown}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      onTouchStart={handleDown}
      onTouchMove={handleMove}
      onTouchEnd={handleUp}
    />
  )
}
