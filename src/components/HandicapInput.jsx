import { useState } from 'react'
import './HandicapInput.css'

export default function HandicapInput({ handicap, setHandicap }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(handicap !== null ? String(handicap) : '')

  const handleSubmit = () => {
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= 36) {
      setHandicap(num)
      setEditing(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setEditing(false)
  }

  if (editing) {
    return (
      <div className="handicap-edit">
        <label>差点:</label>
        <input
          type="number"
          min="0"
          max="36"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          autoFocus
          className="handicap-input"
        />
      </div>
    )
  }

  return (
    <button
      className="handicap-badge"
      onClick={() => {
        setValue(handicap !== null ? String(handicap) : '')
        setEditing(true)
      }}
    >
      {handicap !== null ? (
        <>差点 <strong>{handicap}</strong></>
      ) : (
        '设置差点'
      )}
    </button>
  )
}
