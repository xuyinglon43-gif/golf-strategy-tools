import { useState, useEffect, useRef, useCallback } from 'react'
import HandicapPrompt from '../../components/HandicapPrompt'
import CustomEditor from './CustomEditor'
import { SCENES, DISTANCE_OPTIONS, loadCustomLayouts, saveCustomLayout, deleteCustomLayout, makeDefaultCustomScene } from './scenes'
import { getSpread, generateSamples, computeZones, calcEV, findBestAimPoint } from './calc'
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
  const dragging = useRef(null)
  const [pinPos, setPinPos] = useState(null)

  // Custom mode
  const [isCustom, setIsCustom] = useState(false)
  const [editing, setEditing] = useState(false)
  const [customScene, setCustomScene] = useState(null)
  const [savedLayouts, setSavedLayouts] = useState(() => loadCustomLayouts())
  const [selectedLayoutId, setSelectedLayoutId] = useState(null)
  const [showLayoutMenu, setShowLayoutMenu] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  // Best aim point
  const [bestAim, setBestAim] = useState(null)
  const [findingBest, setFindingBest] = useState(false)

  const scene = isCustom && customScene ? customScene : SCENES[sceneIdx]

  // Reset aim and pin when scene/pin changes (preset mode)
  useEffect(() => {
    if (isCustom) return
    const pin = scene.pins[pinIdx]
    if (pin) {
      setPinPos({ x: pin.x, y: pin.y })
      setAimX(pin.x)
      setAimY(pin.y)
    }
    setBestAim(null)
  }, [sceneIdx, pinIdx, scene.pins, isCustom])

  // Reset when entering custom simulate mode
  useEffect(() => {
    if (isCustom && !editing && customScene) {
      const pin = customScene.pins[0]
      if (pin) {
        setPinPos({ x: pin.x, y: pin.y })
        setAimX(pin.x)
        setAimY(pin.y)
      }
      setBestAim(null)
    }
  }, [isCustom, editing, customScene])

  // Draw canvas (simulation mode only)
  useEffect(() => {
    if (handicap === null || editing) return
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

    // Fairway
    ctx.fillStyle = '#2d5a1e'
    ctx.beginPath()
    ctx.ellipse(scene.green.cx, scene.green.cy, scene.green.rx * 1.8, scene.green.ry * 1.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Hazards
    for (const h of scene.hazards) {
      if (h.type === 'water') {
        ctx.fillStyle = '#1a4a7a'
        if (h.path) {
          ctx.beginPath()
          ctx.moveTo(h.path[0][0], h.path[0][1])
          for (let i = 1; i < h.path.length; i++) ctx.lineTo(h.path[i][0], h.path[i][1])
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (h.type === 'cliff') {
        ctx.fillStyle = '#3a3428'
        if (h.path) {
          ctx.beginPath()
          ctx.moveTo(h.path[0][0], h.path[0][1])
          for (let i = 1; i < h.path.length; i++) ctx.lineTo(h.path[i][0], h.path[i][1])
          ctx.closePath()
          ctx.fill()
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
        } else {
          ctx.beginPath()
          ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.save()
          ctx.beginPath()
          ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
          ctx.clip()
          ctx.strokeStyle = '#5a5040'
          ctx.lineWidth = 1
          for (let x = h.cx - h.rx; x < h.cx + h.rx; x += 6) {
            ctx.beginPath()
            ctx.moveTo(x, h.cy - h.ry)
            ctx.lineTo(x + h.ry, h.cy + h.ry)
            ctx.stroke()
          }
          ctx.restore()
        }
      } else if (h.type === 'bunker') {
        ctx.fillStyle = '#c4a84a'
        ctx.beginPath()
        ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
        ctx.fill()
      } else if (h.type === 'tree') {
        const r = h.r || 12
        ctx.fillStyle = '#0d2a08'
        ctx.beginPath()
        ctx.arc(h.cx, h.cy, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#1a4a1a'
        ctx.beginPath()
        ctx.arc(h.cx - 2, h.cy - 2, r * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Green
    ctx.fillStyle = '#4a9e5e'
    ctx.beginPath()
    ctx.ellipse(scene.green.cx, scene.green.cy, scene.green.rx, scene.green.ry, 0, 0, Math.PI * 2)
    ctx.fill()

    // Samples
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    for (const s of samples) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dispersion ellipses
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.ellipse(aimX, aimY + spread.y * 0.15, spread.x, spread.y, 0, 0, Math.PI * 2)
    ctx.stroke()

    ctx.setLineDash([6, 4])
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.beginPath()
    ctx.ellipse(aimX, aimY + spread.y * 0.15, spread.x * 2, spread.y * 2, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Best aim point
    if (bestAim) {
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(bestAim.point.x, bestAim.point.y, 8, 0, Math.PI * 2)
      ctx.stroke()
      // Star
      drawStar(ctx, bestAim.point.x, bestAim.point.y, 5, 10, 5)
      ctx.fillStyle = '#ffd700'
      ctx.fill()
      // Label
      ctx.fillStyle = '#ffd700'
      ctx.font = 'bold 11px DM Sans, Noto Sans SC, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`最佳 ${bestAim.ev >= 0 ? '+' : ''}${bestAim.ev.toFixed(2)}`, bestAim.point.x, bestAim.point.y + 22)
    }

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
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(pinPos.x, pinPos.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Aim point
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

    ctx.fillStyle = '#fff'
    ctx.font = '12px DM Sans, Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('球手位置', 250, H - 20)

  }, [handicap, distIdx, aimX, aimY, scene, pinPos, editing, bestAim])

  function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
    let rot = Math.PI / 2 * 3
    const step = Math.PI / spikes
    ctx.beginPath()
    ctx.moveTo(cx, cy - outerR)
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR)
      rot += step
      ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR)
      rot += step
    }
    ctx.lineTo(cx, cy - outerR)
    ctx.closePath()
  }

  // Drag handling
  const getCanvasPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
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

  const handlePointerUp = () => { dragging.current = null }

  // Best aim point
  const handleFindBest = () => {
    if (!pinPos) return
    setFindingBest(true)
    setTimeout(() => {
      const result = findBestAimPoint(scene, pinPos, handicap, distIdx)
      setBestAim(result)
      setFindingBest(false)
    }, 50)
  }

  // Custom mode handlers
  const enterCustom = () => {
    setIsCustom(true)
    setEditing(true)
    setCustomScene(makeDefaultCustomScene())
    setSelectedLayoutId(null)
    setBestAim(null)
  }

  const loadLayout = (layout) => {
    setIsCustom(true)
    setEditing(false)
    setCustomScene(layout)
    setSelectedLayoutId(layout.id)
    setShowLayoutMenu(false)
    setBestAim(null)
  }

  const handleSave = () => {
    if (!customScene) return
    const name = saveName.trim() || '自定义果岭'
    const toSave = { ...customScene, name }
    saveCustomLayout(toSave)
    setSavedLayouts(loadCustomLayouts())
    setShowSaveDialog(false)
    setSaveName('')
  }

  const handleDeleteLayout = (id) => {
    deleteCustomLayout(id)
    setSavedLayouts(loadCustomLayouts())
    if (selectedLayoutId === id) {
      setIsCustom(false)
      setCustomScene(null)
      setSceneIdx(0)
    }
  }

  const exitCustom = () => {
    setIsCustom(false)
    setEditing(false)
    setCustomScene(null)
    setSelectedLayoutId(null)
    setSceneIdx(0)
    setPinIdx(0)
    setBestAim(null)
  }

  if (handicap === null) {
    return <HandicapPrompt onSet={setHandicap} />
  }

  const evColor = ev < 0 ? 'var(--green)' : ev < 0.5 ? 'var(--green)' : ev < 1.2 ? 'var(--yellow)' : 'var(--red)'
  const safeZone = zones ? (zones.green + zones.fairway) : 0

  return (
    <div className="disp-page">
      <h1 className="disp-title no-print">散布圈策略模拟器</h1>
      <p className="disp-sub no-print">差点 {handicap} · {editing ? '编辑果岭布局' : '拖动红色瞄准点，观察散布变化'}</p>
      <p className="disp-desktop-hint no-print">推荐电脑端学习，建立策略直觉后带上球场</p>

      <div className="disp-controls no-print">
        <div className="disp-control-group">
          <label>果岭场景</label>
          <div className="disp-btn-group">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                className={`disp-btn ${!isCustom && i === sceneIdx ? 'active' : ''}`}
                onClick={() => { exitCustom(); setSceneIdx(i); setPinIdx(0) }}
              >{s.name}</button>
            ))}
            <button
              className={`disp-btn disp-btn-custom ${isCustom && !selectedLayoutId ? 'active' : ''}`}
              onClick={enterCustom}
            >+ 自定义</button>
            {savedLayouts.length > 0 && (
              <div className="layout-menu-wrap">
                <button
                  className={`disp-btn ${selectedLayoutId ? 'active' : ''}`}
                  onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                >我的果岭 ({savedLayouts.length})</button>
                {showLayoutMenu && (
                  <div className="layout-menu">
                    {savedLayouts.map((l) => (
                      <div key={l.id} className="layout-menu-item">
                        <button className="layout-menu-name" onClick={() => loadLayout(l)}>{l.name}</button>
                        <button className="layout-menu-edit" onClick={() => { setIsCustom(true); setEditing(true); setCustomScene({ ...l }); setShowLayoutMenu(false) }}>编辑</button>
                        <button className="layout-menu-del" onClick={() => handleDeleteLayout(l.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {!editing && (
          <>
            <div className="disp-control-group">
              <label>攻击距离</label>
              <div className="disp-btn-group">
                {DISTANCE_OPTIONS.map((d) => (
                  <button
                    key={d.value}
                    className={`disp-btn ${d.index === distIdx ? 'active' : ''}`}
                    onClick={() => { setDistIdx(d.index); setBestAim(null) }}
                  >{d.label}</button>
                ))}
              </div>
            </div>

            {!isCustom && (
              <div className="disp-control-group">
                <label>旗位</label>
                <div className="disp-btn-group">
                  {scene.pins.map((p, i) => (
                    <button
                      key={p.id}
                      className={`disp-btn ${i === pinIdx ? 'active' : ''}`}
                      onClick={() => { setPinIdx(i); setBestAim(null) }}
                    >{p.label}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editing && customScene ? (
        <div className="disp-content">
          <CustomEditor
            scene={customScene}
            onChange={setCustomScene}
            onDone={() => setEditing(false)}
          />
          <div className="disp-stats">
            <div className="editor-help">
              <h3>编辑说明</h3>
              <ul>
                <li>选择工具栏中的元素类型</li>
                <li>在画布上点击放置</li>
                <li>选择已有元素后可拖动、调整大小</li>
                <li>使用删除工具点击元素删除</li>
                <li>编辑完成后点击"完成编辑"</li>
              </ul>
            </div>
            <button className="gto-btn" style={{ width: '100%', marginTop: 12 }}
              onClick={() => setShowSaveDialog(true)}>保存布局</button>
            {showSaveDialog && (
              <div className="save-dialog">
                <input
                  className="save-input"
                  placeholder="布局名称"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  autoFocus
                />
                <div className="save-actions">
                  <button className="gto-btn" onClick={() => setShowSaveDialog(false)}>取消</button>
                  <button className="gto-btn gto-btn-accent" onClick={handleSave}>保存</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
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

            <div className="best-aim-section">
              <button
                className="gto-btn gto-btn-accent best-aim-btn"
                onClick={handleFindBest}
                disabled={findingBest}
              >{findingBest ? '计算中...' : '最佳瞄点推荐'}</button>
              {bestAim && (
                <div className="best-aim-result">
                  <span className="best-aim-star">★</span>
                  最佳EV: {bestAim.ev >= 0 ? '+' : ''}{bestAim.ev.toFixed(2)}
                  {ev !== bestAim.ev && (
                    <span className="best-aim-diff">
                      (比当前 {(bestAim.ev - ev) >= 0 ? '+' : ''}{(bestAim.ev - ev).toFixed(2)})
                    </span>
                  )}
                </div>
              )}
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

            {isCustom && (
              <div className="custom-actions">
                <button className="gto-btn" onClick={() => setEditing(true)}>返回编辑</button>
                <button className="gto-btn" onClick={() => setShowSaveDialog(true)}>保存布局</button>
                {showSaveDialog && (
                  <div className="save-dialog">
                    <input
                      className="save-input"
                      placeholder="布局名称"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                      autoFocus
                    />
                    <div className="save-actions">
                      <button className="gto-btn" onClick={() => setShowSaveDialog(false)}>取消</button>
                      <button className="gto-btn gto-btn-accent" onClick={handleSave}>保存</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
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
