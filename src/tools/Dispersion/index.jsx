import { useState, useEffect, useRef, useCallback } from 'react'
import HandicapPrompt from '../../components/HandicapPrompt'
import { SCENES, DISTANCE_OPTIONS } from './scenes'
import { getSpread, generateSamples, computeZones, calcEV } from './calc'
import './style.css'

const W = 500, H = 640

export default function Dispersion({ handicap, setHandicap }) {
  const canvasRef = useRef(null)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [distIdx, setDistIdx] = useState(2)
  const [pinIdx, setPinIdx] = useState(0)
  const [aimX, setAimX] = useState(250)
  const [aimY, setAimY] = useState(240)
  const [zones, setZones] = useState(null)
  const [ev, setEv] = useState(0)
  const dragging = useRef(null) // 'aim' or 'pin'
  const [pinPos, setPinPos] = useState(null)

  const scene = SCENES[sceneIdx]

  // Reset aim and pin when scene/pin changes
  useEffect(() => {
    const pin = scene.pins[pinIdx]
    setPinPos({ x: pin.x, y: pin.y })
    setAimX(pin.x)
    setAimY(pin.y)
  }, [sceneIdx, pinIdx, scene.pins])

  // Compute dispersion
  const compute = useCallback(() => {
    if (handicap === null) return
    const spread = getSpread(handicap, distIdx)
    const samples = generateSamples(aimX, aimY, spread)
    const result = computeZones(samples, scene, pinPos, handicap)
    setZones(result.zones)
    setEv(calcEV(result, handicap))
    return { samples, spread }
  }, [handicap, distIdx, aimX, aimY, scene, pinPos])

  // Draw canvas
  useEffect(() => {
    if (handicap === null) return
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    const spread = getSpread(handicap, distIdx)
    const samples = generateSamples(aimX, aimY, spread)
    const result = computeZones(samples, scene, pinPos, handicap)
    setZones(result.zones)
    setEv(calcEV(result, handicap))

    // Background
    ctx.fillStyle = '#1e3a12'
    ctx.fillRect(0, 0, W, H)

    // Fairway area
    ctx.fillStyle = '#2d5a1e'
    ctx.beginPath()
    ctx.ellipse(scene.green.cx, scene.green.cy, scene.green.rx * 1.8, scene.green.ry * 1.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Draw hazards
    for (const h of scene.hazards) {
      if (h.type === 'water') {
        ctx.fillStyle = '#1a4a7a'
        ctx.beginPath()
        ctx.moveTo(h.path[0][0], h.path[0][1])
        for (let i = 1; i < h.path.length; i++) ctx.lineTo(h.path[i][0], h.path[i][1])
        ctx.closePath()
        ctx.fill()
      } else if (h.type === 'cliff') {
        ctx.fillStyle = '#3a3428'
        ctx.beginPath()
        ctx.moveTo(h.path[0][0], h.path[0][1])
        for (let i = 1; i < h.path.length; i++) ctx.lineTo(h.path[i][0], h.path[i][1])
        ctx.closePath()
        ctx.fill()
        // hatching
        ctx.strokeStyle = '#5a5040'
        ctx.lineWidth = 1
        const minX = Math.min(...h.path.map(p => p[0]))
        const maxX = Math.max(...h.path.map(p => p[0]))
        const minY = Math.min(...h.path.map(p => p[1]))
        const maxY = Math.max(...h.path.map(p => p[1]))
        for (let x = minX; x < maxX; x += 6) {
          ctx.beginPath()
          ctx.moveTo(x, minY)
          ctx.lineTo(x + 10, maxY)
          ctx.stroke()
        }
      } else if (h.type === 'bunker') {
        ctx.fillStyle = '#c4a84a'
        ctx.beginPath()
        ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Green
    ctx.fillStyle = '#4a9e5e'
    ctx.beginPath()
    ctx.ellipse(scene.green.cx, scene.green.cy, scene.green.rx, scene.green.ry, 0, 0, Math.PI * 2)
    ctx.fill()

    // Samples as dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    for (const s of samples) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dispersion ellipses
    // 68% (1 sigma)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(aimX, aimY + spread.y * 0.15, spread.x, spread.y, 0, 0, Math.PI * 2)
    ctx.stroke()

    // 95% (2 sigma) dashed
    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.beginPath()
    ctx.ellipse(aimX, aimY + spread.y * 0.15, spread.x * 2, spread.y * 2, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Pin flag
    if (pinPos) {
      ctx.fillStyle = 'white'
      ctx.fillRect(pinPos.x, pinPos.y - 20, 2, 20)
      ctx.fillStyle = '#e03030'
      ctx.beginPath()
      ctx.moveTo(pinPos.x + 2, pinPos.y - 20)
      ctx.lineTo(pinPos.x + 14, pinPos.y - 15)
      ctx.lineTo(pinPos.x + 2, pinPos.y - 10)
      ctx.fill()
      // hole
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(pinPos.x, pinPos.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Aim point (crosshair)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(aimX - 10, aimY)
    ctx.lineTo(aimX + 10, aimY)
    ctx.moveTo(aimX, aimY - 10)
    ctx.lineTo(aimX, aimY + 10)
    ctx.stroke()
    ctx.fillStyle = '#e03030'
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(aimX, aimY, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Golfer indicator at bottom
    ctx.fillStyle = '#fff'
    ctx.font = '12px DM Sans, Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('⛳ 球手位置', 250, H - 20)

  }, [handicap, distIdx, aimX, aimY, scene, pinPos])

  // Mouse/touch drag handling
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const distTo = (px, py, tx, ty) => Math.sqrt((px - tx) ** 2 + (py - ty) ** 2)

  const handlePointerDown = (e) => {
    const pos = getCanvasPos(e)
    const distAim = distTo(pos.x, pos.y, aimX, aimY)
    const distPin = pinPos ? distTo(pos.x, pos.y, pinPos.x, pinPos.y) : Infinity
    if (distAim < 20 || (distAim < distPin && distAim < 40)) {
      dragging.current = 'aim'
    } else if (distPin < 30) {
      dragging.current = 'pin'
    }
  }

  const handlePointerMove = (e) => {
    if (!dragging.current) return
    e.preventDefault()
    const pos = getCanvasPos(e)
    if (dragging.current === 'aim') {
      setAimX(Math.max(0, Math.min(W, pos.x)))
      setAimY(Math.max(0, Math.min(H, pos.y)))
    } else if (dragging.current === 'pin') {
      setPinPos({ x: Math.max(0, Math.min(W, pos.x)), y: Math.max(0, Math.min(H, pos.y)) })
    }
  }

  const handlePointerUp = () => {
    dragging.current = null
  }

  if (handicap === null) {
    return <HandicapPrompt onSet={setHandicap} />
  }

  const evColor = ev < 0 ? 'var(--green)' : ev < 0.5 ? 'var(--green)' : ev < 1.2 ? 'var(--yellow)' : 'var(--red)'
  const safeZone = zones ? (zones.green + zones.fairway) : 0

  return (
    <div className="disp-page">
      <h1 className="disp-title no-print">散布圈策略模拟器</h1>
      <p className="disp-sub no-print">差点 {handicap} · 拖动红色瞄准点，观察散布变化</p>

      <div className="disp-controls no-print">
        <div className="disp-control-group">
          <label>果岭场景</label>
          <div className="disp-btn-group">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                className={`disp-btn ${i === sceneIdx ? 'active' : ''}`}
                onClick={() => { setSceneIdx(i); setPinIdx(0) }}
              >{s.name}</button>
            ))}
          </div>
        </div>
        <div className="disp-control-group">
          <label>攻击距离</label>
          <div className="disp-btn-group">
            {DISTANCE_OPTIONS.map((d) => (
              <button
                key={d.value}
                className={`disp-btn ${d.index === distIdx ? 'active' : ''}`}
                onClick={() => setDistIdx(d.index)}
              >{d.label}</button>
            ))}
          </div>
        </div>
        <div className="disp-control-group">
          <label>旗位</label>
          <div className="disp-btn-group">
            {scene.pins.map((p, i) => (
              <button
                key={p.id}
                className={`disp-btn ${i === pinIdx ? 'active' : ''}`}
                onClick={() => setPinIdx(i)}
              >{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="disp-content">
        <div className="disp-canvas-wrap">
          <canvas
            ref={canvasRef}
            style={{ width: '100%', maxWidth: W, aspectRatio: `${W}/${H}` }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        </div>

        <div className="disp-stats">
          <div className="disp-ev-card">
            <div className="disp-ev-label">预期额外杆数</div>
            <div className="disp-ev-value" style={{ color: evColor }}>
              {ev >= 0 ? '+' : ''}{ev.toFixed(2)}
            </div>
          </div>

          {zones && (
            <div className="disp-zones">
              <h3>落区分布</h3>
              <ZoneBar label="果岭" pct={zones.green} color="#4a9e5e" />
              <ZoneBar label="球道/安全区" pct={zones.fairway} color="#2d5a1e" />
              <ZoneBar label="沙坑" pct={zones.bunker} color="#c4a84a" />
              <ZoneBar label="长草" pct={zones.rough} color="#1e3a12" />
              <ZoneBar label="水障碍" pct={zones.water} color="#1a4a7a" />
              {zones.cliff > 0 && <ZoneBar label="断崖" pct={zones.cliff} color="#3a3428" />}
            </div>
          )}

          <div className="disp-tip">
            <h3>策略建议</h3>
            <p>{scene.desc}</p>
            {safeZone > 0.7 && <p className="disp-tip-good">安全落区 {(safeZone * 100).toFixed(0)}%，这个策略不错</p>}
            {safeZone < 0.5 && <p className="disp-tip-bad">安全落区仅 {(safeZone * 100).toFixed(0)}%，考虑保守一些</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

function ZoneBar({ label, pct, color }) {
  return (
    <div className="zone-bar-row">
      <span className="zone-label">{label}</span>
      <div className="zone-bar-track">
        <div className="zone-bar-fill" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className="zone-pct">{(pct * 100).toFixed(0)}%</span>
    </div>
  )
}
