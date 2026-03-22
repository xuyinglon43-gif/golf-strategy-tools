import { useState, useRef } from 'react'
import './style.css'

export default function ReorderPanel({ rows, onSave, onCancel }) {
  const [items, setItems] = useState(rows.map((r, i) => ({ ...r, id: i })))
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  const handleDragStart = (idx) => {
    dragItem.current = idx
  }

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    dragOverItem.current = idx
  }

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    const newItems = [...items]
    const dragged = newItems.splice(dragItem.current, 1)[0]
    newItems.splice(dragOverItem.current, 0, dragged)
    setItems(newItems)
    dragItem.current = null
    dragOverItem.current = null
  }

  // Touch drag support
  const touchItem = useRef(null)
  const touchY = useRef(0)

  const handleTouchStart = (e, idx) => {
    touchItem.current = idx
    touchY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (touchItem.current === null) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchY.current
    const itemHeight = 48
    const steps = Math.round(diff / itemHeight)
    if (steps !== 0) {
      const newIdx = Math.max(0, Math.min(items.length - 1, touchItem.current + steps))
      if (newIdx !== touchItem.current) {
        const newItems = [...items]
        const dragged = newItems.splice(touchItem.current, 1)[0]
        newItems.splice(newIdx, 0, dragged)
        setItems(newItems)
        touchItem.current = newIdx
        touchY.current = currentY
      }
    }
  }

  const handleTouchEnd = () => {
    touchItem.current = null
  }

  return (
    <div className="reorder-overlay" onClick={onCancel}>
      <div className="reorder-panel" onClick={(e) => e.stopPropagation()}>
        <h3>调整果岭情况顺序</h3>
        <p className="reorder-hint">拖拽排序（上 = 安全，下 = 危险）</p>
        <ul
          className="reorder-list"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {items.map((item, idx) => (
            <li
              key={item.id}
              className="reorder-item"
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              onTouchStart={(e) => handleTouchStart(e, idx)}
            >
              <span className="reorder-num">{idx + 1}</span>
              <span className="reorder-grip">⠿</span>
              <span className="reorder-text">{item.zh}</span>
            </li>
          ))}
        </ul>
        <div className="reorder-actions">
          <button className="gto-btn" onClick={onCancel}>取消</button>
          <button className="gto-btn gto-btn-accent" onClick={() => onSave(items)}>完成</button>
        </div>
      </div>
    </div>
  )
}
