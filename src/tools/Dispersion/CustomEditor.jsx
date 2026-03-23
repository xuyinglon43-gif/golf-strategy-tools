import { useState, useRef, useEffect, useCallback } from 'react'

const W = 500, H = 640

const TOOLS = [
  { id: 'select', label: '选择', icon: '👆' },
  { id: 'bunker', label: '沙坑', icon: '🟡', color: '#c4a84a' },
  { id: 'water', label: '水', icon: '🔵', color: '#1a4a7a' },
  { id: 'cliff', label: '断崖', icon: '🟤', color: '#3a3428' },
  { id: 'tree', label: '树', icon: '🌲', color: '#0d2a08' },
  { id: 'flag', label: '旗', icon: '🚩' },
  { id: 'delete', label: '删除', icon: '🗑️' },
]

export default function CustomEditor({ scene, onChange, onDone }) {
  const canvasRef = useRef(null)
  const [activeTool, setActiveTool] = useState('select')
  const [selectedIdx, setSelectedIdx] = useState(-1) // index into hazards, -1=none, -2=green, -3=flag
  const dragging = useRef(null)
  const dragStart = useRef(null)
  const resizeHandle = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#1e3a12'
    ctx.fillRect(0, 0, W, H)

    // Fairway
    ctx.fillStyle = '#2d5a1e'
    ctx.beginPath()
    ctx.ellipse(scene.green.cx, scene.green.cy, scene.green.rx * 1.8, scene.green.ry * 1.8, 0, 0, Math.PI * 2)
    ctx.fill()

    // Hazards
    scene.hazards.forEach((h, i) => {
      drawHazard(ctx, h)
      if (i === selectedIdx) drawSelection(ctx, h)
    })

    // Green
    ctx.fillStyle = '#4a9e5e'
    ctx.beginPath()
    ctx.ellipse(scene.green.cx, scene.green.cy, scene.green.rx, scene.green.ry, 0, 0, Math.PI * 2)
    ctx.fill()
    if (selectedIdx === -2) {
      drawEllipseHandles(ctx, scene.green.cx, scene.green.cy, scene.green.rx, scene.green.ry)
    }

    // Flag
    const flag = scene.pins[0]
    if (flag) {
      ctx.fillStyle = 'white'
      ctx.fillRect(flag.x, flag.y - 20, 2, 20)
      ctx.fillStyle = '#e03030'
      ctx.beginPath()
      ctx.moveTo(flag.x + 2, flag.y - 20)
      ctx.lineTo(flag.x + 14, flag.y - 15)
      ctx.lineTo(flag.x + 2, flag.y - 10)
      ctx.fill()
      ctx.fillStyle = '#111'
      ctx.beginPath()
      ctx.arc(flag.x, flag.y, 3, 0, Math.PI * 2)
      ctx.fill()
      if (selectedIdx === -3) {
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.beginPath()
        ctx.arc(flag.x, flag.y, 12, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    // Grid hint
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = '12px DM Sans, Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('点击放置元素 · 拖动调整位置', 250, H - 20)
  }, [scene, selectedIdx])

  useEffect(() => { draw() }, [draw])

  function drawHazard(ctx, h) {
    if (h.type === 'bunker') {
      ctx.fillStyle = '#c4a84a'
      ctx.beginPath()
      ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (h.type === 'water') {
      ctx.fillStyle = '#1a4a7a'
      ctx.beginPath()
      ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
      ctx.fill()
    } else if (h.type === 'cliff') {
      ctx.fillStyle = '#3a3428'
      ctx.beginPath()
      ctx.ellipse(h.cx, h.cy, h.rx, h.ry, 0, 0, Math.PI * 2)
      ctx.fill()
      // hatching
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

  function drawSelection(ctx, h) {
    if (h.type === 'tree') {
      const r = h.r || 12
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.arc(h.cx, h.cy, r + 4, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      drawEllipseHandles(ctx, h.cx, h.cy, h.rx, h.ry)
    }
  }

  function drawEllipseHandles(ctx, cx, cy, rx, ry) {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx + 4, ry + 4, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Corner handles
    const handles = [
      { x: cx + rx, y: cy },
      { x: cx - rx, y: cy },
      { x: cx, y: cy + ry },
      { x: cx, y: cy - ry },
    ]
    ctx.fillStyle = '#fff'
    for (const p of handles) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const scaleX = W / rect.width
    const scaleY = H / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }
  }

  const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)

  const hitTest = (pos) => {
    // Flag
    const flag = scene.pins[0]
    if (flag && dist(pos, flag) < 15) return { type: 'flag', idx: -3 }

    // Hazards (reverse order, top-most first)
    for (let i = scene.hazards.length - 1; i >= 0; i--) {
      const h = scene.hazards[i]
      if (h.type === 'tree') {
        if (dist(pos, { x: h.cx, y: h.cy }) < (h.r || 12) + 5) return { type: 'hazard', idx: i }
      } else {
        if (((pos.x - h.cx) / (h.rx + 5)) ** 2 + ((pos.y - h.cy) / (h.ry + 5)) ** 2 <= 1)
          return { type: 'hazard', idx: i }
      }
    }

    // Green
    if (((pos.x - scene.green.cx) / (scene.green.rx + 5)) ** 2 +
        ((pos.y - scene.green.cy) / (scene.green.ry + 5)) ** 2 <= 1)
      return { type: 'green', idx: -2 }

    return null
  }

  const checkResizeHandle = (pos) => {
    let target = null, handles = []
    if (selectedIdx === -2) {
      const g = scene.green
      handles = [
        { dir: 'r', x: g.cx + g.rx, y: g.cy },
        { dir: 'l', x: g.cx - g.rx, y: g.cy },
        { dir: 'b', x: g.cx, y: g.cy + g.ry },
        { dir: 't', x: g.cx, y: g.cy - g.ry },
      ]
      target = 'green'
    } else if (selectedIdx >= 0) {
      const h = scene.hazards[selectedIdx]
      if (h.type === 'tree') return null
      handles = [
        { dir: 'r', x: h.cx + h.rx, y: h.cy },
        { dir: 'l', x: h.cx - h.rx, y: h.cy },
        { dir: 'b', x: h.cx, y: h.cy + h.ry },
        { dir: 't', x: h.cx, y: h.cy - h.ry },
      ]
      target = 'hazard'
    }
    for (const handle of handles) {
      if (dist(pos, handle) < 12) return { target, dir: handle.dir }
    }
    return null
  }

  const handleDown = (e) => {
    e.preventDefault()
    const pos = getPos(e)

    // Place new element
    if (activeTool !== 'select' && activeTool !== 'delete') {
      const updated = { ...scene }
      if (activeTool === 'flag') {
        updated.pins = [{ id: 'custom', label: '旗位', x: pos.x, y: pos.y }]
      } else if (activeTool === 'tree') {
        updated.hazards = [...updated.hazards, { type: 'tree', cx: pos.x, cy: pos.y, r: 12 }]
      } else {
        const sizes = { bunker: [25, 18], water: [50, 35], cliff: [50, 15] }
        const [rx, ry] = sizes[activeTool]
        updated.hazards = [...updated.hazards, { type: activeTool, cx: pos.x, cy: pos.y, rx, ry }]
      }
      onChange(updated)
      setActiveTool('select')
      return
    }

    // Delete tool
    if (activeTool === 'delete') {
      const hit = hitTest(pos)
      if (hit && hit.type === 'hazard') {
        const updated = { ...scene, hazards: scene.hazards.filter((_, i) => i !== hit.idx) }
        onChange(updated)
        setSelectedIdx(-1)
      }
      return
    }

    // Select / drag / resize
    const rh = checkResizeHandle(pos)
    if (rh) {
      resizeHandle.current = rh
      dragStart.current = pos
      dragging.current = 'resize'
      return
    }

    const hit = hitTest(pos)
    if (hit) {
      setSelectedIdx(hit.idx)
      dragging.current = hit.type
      dragStart.current = pos
    } else {
      setSelectedIdx(-1)
    }
  }

  const handleMove = (e) => {
    if (!dragging.current) return
    e.preventDefault()
    const pos = getPos(e)
    const dx = pos.x - dragStart.current.x
    const dy = pos.y - dragStart.current.y
    dragStart.current = pos

    if (dragging.current === 'resize') {
      const rh = resizeHandle.current
      const updated = { ...scene }
      if (rh.target === 'green') {
        const g = { ...updated.green }
        if (rh.dir === 'r' || rh.dir === 'l') g.rx = Math.max(20, g.rx + (rh.dir === 'r' ? dx : -dx))
        if (rh.dir === 'b' || rh.dir === 't') g.ry = Math.max(20, g.ry + (rh.dir === 'b' ? dy : -dy))
        updated.green = g
      } else {
        const hazards = [...updated.hazards]
        const h = { ...hazards[selectedIdx] }
        if (rh.dir === 'r' || rh.dir === 'l') h.rx = Math.max(10, h.rx + (rh.dir === 'r' ? dx : -dx))
        if (rh.dir === 'b' || rh.dir === 't') h.ry = Math.max(8, h.ry + (rh.dir === 'b' ? dy : -dy))
        hazards[selectedIdx] = h
        updated.hazards = hazards
      }
      onChange(updated)
      return
    }

    if (dragging.current === 'green') {
      onChange({ ...scene, green: { ...scene.green, cx: scene.green.cx + dx, cy: scene.green.cy + dy } })
    } else if (dragging.current === 'flag') {
      onChange({ ...scene, pins: [{ ...scene.pins[0], x: scene.pins[0].x + dx, y: scene.pins[0].y + dy }] })
    } else if (dragging.current === 'hazard' && selectedIdx >= 0) {
      const hazards = [...scene.hazards]
      const h = { ...hazards[selectedIdx] }
      h.cx += dx
      h.cy += dy
      hazards[selectedIdx] = h
      onChange({ ...scene, hazards })
    }
  }

  const handleUp = () => {
    dragging.current = null
    resizeHandle.current = null
  }

  return (
    <div className="editor-wrap">
      <div className="editor-toolbar">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            className={`editor-tool-btn ${activeTool === t.id ? 'active' : ''}`}
            onClick={() => setActiveTool(t.id)}
          >
            <span className="editor-tool-icon">{t.icon}</span>
            <span className="editor-tool-label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="editor-canvas-wrap">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', maxWidth: W, aspectRatio: `${W}/${H}` }}
          onMouseDown={handleDown}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
          onTouchStart={handleDown}
          onTouchMove={handleMove}
          onTouchEnd={handleUp}
        />
      </div>
      {selectedIdx >= 0 && scene.hazards[selectedIdx] && scene.hazards[selectedIdx].type !== 'tree' && (
        <div className="editor-size-controls">
          <label>宽度</label>
          <input
            type="range" min="10" max="120"
            value={scene.hazards[selectedIdx].rx}
            onChange={(e) => {
              const hazards = [...scene.hazards]
              hazards[selectedIdx] = { ...hazards[selectedIdx], rx: parseInt(e.target.value) }
              onChange({ ...scene, hazards })
            }}
          />
          <label>高度</label>
          <input
            type="range" min="8" max="100"
            value={scene.hazards[selectedIdx].ry}
            onChange={(e) => {
              const hazards = [...scene.hazards]
              hazards[selectedIdx] = { ...hazards[selectedIdx], ry: parseInt(e.target.value) }
              onChange({ ...scene, hazards })
            }}
          />
          <button className="editor-del-btn" onClick={() => {
            onChange({ ...scene, hazards: scene.hazards.filter((_, i) => i !== selectedIdx) })
            setSelectedIdx(-1)
          }}>删除此元素</button>
        </div>
      )}
      {selectedIdx >= 0 && scene.hazards[selectedIdx] && scene.hazards[selectedIdx].type === 'tree' && (
        <div className="editor-size-controls">
          <label>大小</label>
          <input
            type="range" min="6" max="30"
            value={scene.hazards[selectedIdx].r || 12}
            onChange={(e) => {
              const hazards = [...scene.hazards]
              hazards[selectedIdx] = { ...hazards[selectedIdx], r: parseInt(e.target.value) }
              onChange({ ...scene, hazards })
            }}
          />
          <button className="editor-del-btn" onClick={() => {
            onChange({ ...scene, hazards: scene.hazards.filter((_, i) => i !== selectedIdx) })
            setSelectedIdx(-1)
          }}>删除此元素</button>
        </div>
      )}
      {selectedIdx === -2 && (
        <div className="editor-size-controls">
          <label>果岭宽度</label>
          <input
            type="range" min="30" max="150"
            value={scene.green.rx}
            onChange={(e) => onChange({ ...scene, green: { ...scene.green, rx: parseInt(e.target.value) } })}
          />
          <label>果岭高度</label>
          <input
            type="range" min="30" max="120"
            value={scene.green.ry}
            onChange={(e) => onChange({ ...scene, green: { ...scene.green, ry: parseInt(e.target.value) } })}
          />
        </div>
      )}
      <div className="editor-actions">
        <button className="gto-btn gto-btn-accent" onClick={onDone}>完成编辑 → 开始模拟</button>
        <button className="gto-btn" onClick={() => {
          onChange({ ...scene, hazards: [], pins: [{ id: 'custom', label: '旗位', x: scene.green.cx, y: scene.green.cy }] })
          setSelectedIdx(-1)
        }}>重置</button>
      </div>
    </div>
  )
}
