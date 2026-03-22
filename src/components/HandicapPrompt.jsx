import { useState } from 'react'
import './HandicapPrompt.css'

export default function HandicapPrompt({ onSet }) {
  const [value, setValue] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const num = parseInt(value, 10)
    if (!isNaN(num) && num >= 0 && num <= 36) {
      onSet(num)
    }
  }

  return (
    <div className="handicap-prompt-overlay">
      <form className="handicap-prompt" onSubmit={handleSubmit}>
        <h3>请先设置你的差点</h3>
        <p>差点范围：0-36</p>
        <input
          type="number"
          min="0"
          max="36"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="例如：18"
          autoFocus
          className="handicap-prompt-input"
        />
        <button type="submit" className="handicap-prompt-btn">确认</button>
      </form>
    </div>
  )
}
