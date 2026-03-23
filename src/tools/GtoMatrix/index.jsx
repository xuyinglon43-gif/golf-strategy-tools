import { useState, useEffect, useCallback } from 'react'
import HandicapPrompt from '../../components/HandicapPrompt'
import ReorderPanel from './ReorderPanel'
import { DISTANCES, DEFAULT_ROWS, generateDefaultGrid, loadGtoData, saveGtoData } from './data'
import './style.css'

const COLOR_CYCLE = { g: 'y', y: 'r', r: 'g' }
const COLOR_LABELS = { g: '进攻旗杆', y: '攻果岭中心', r: '打安全位置' }

export default function GtoMatrix({ handicap, setHandicap }) {
  const [grid, setGrid] = useState(null)
  const [rows, setRows] = useState(null)
  const [showReorder, setShowReorder] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [editText, setEditText] = useState('')

  const initData = useCallback((h) => {
    const saved = loadGtoData(h)
    if (saved) {
      setGrid(saved.grid)
      setRows(saved.rows)
    } else {
      setGrid(generateDefaultGrid(h))
      setRows(DEFAULT_ROWS.map((r) => ({ ...r })))
    }
  }, [])

  useEffect(() => {
    if (handicap !== null) {
      initData(handicap)
    }
  }, [handicap, initData])

  useEffect(() => {
    if (handicap !== null && grid && rows) {
      saveGtoData(handicap, { grid, rows })
    }
  }, [grid, rows, handicap])

  if (handicap === null) {
    return <HandicapPrompt onSet={setHandicap} />
  }
  if (!grid || !rows) return null

  const toggleCell = (r, c) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row])
      next[r][c] = COLOR_CYCLE[next[r][c]]
      return next
    })
  }

  const startEditRow = (idx) => {
    setEditingRow(idx)
    setEditText(rows[idx].zh)
  }

  const saveEditRow = () => {
    if (editingRow !== null && editText.trim()) {
      setRows((prev) => {
        const next = [...prev]
        next[editingRow] = { ...next[editingRow], zh: editText.trim() }
        return next
      })
    }
    setEditingRow(null)
  }

  const handleReorder = (newRows) => {
    setRows(newRows)
    setShowReorder(false)
  }

  const resetAll = () => {
    setGrid(generateDefaultGrid(handicap))
    setRows(DEFAULT_ROWS.map((r) => ({ ...r })))
    localStorage.removeItem(`ggto_${handicap}`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="gto-page">
      <div className="gto-header no-print">
        <div>
          <h1 className="gto-title">攻果岭GTO矩阵</h1>
          <p className="gto-sub">差点 {handicap} · 横轴=距离 · 纵轴=果岭风险 · 交叉格=决策</p>
          <p className="gto-desktop-hint">推荐电脑端学习，建立策略直觉后带上球场</p>
        </div>
        <div className="gto-actions">
          <button className="gto-btn" onClick={() => setShowReorder(true)}>调整顺序</button>
          <button className="gto-btn" onClick={resetAll}>恢复默认</button>
          <button className="gto-btn gto-btn-accent" onClick={handlePrint}>打印 / PDF</button>
        </div>
      </div>

      <div className="gto-matrix-wrap">
        <table className="gto-matrix">
          <thead>
            <tr>
              <th className="gto-corner"></th>
              {DISTANCES.map((d) => (
                <th key={d} className="gto-dist">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                <td className="gto-row-label">
                  {editingRow === ri ? (
                    <input
                      className="gto-row-edit"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={saveEditRow}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditRow()}
                      autoFocus
                    />
                  ) : (
                    <span
                      className="gto-row-text no-print-interactive"
                      onClick={() => startEditRow(ri)}
                      title="点击编辑"
                    >
                      {row.zh}
                    </span>
                  )}
                </td>
                {grid[ri].map((color, ci) => (
                  <td
                    key={ci}
                    className={`gto-cell gto-cell-${color}`}
                    onClick={() => toggleCell(ri, ci)}
                    title={COLOR_LABELS[color]}
                  ></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gto-legend no-print">
        <span className="gto-legend-item"><span className="gto-dot gto-dot-g"></span> 进攻旗杆 Attack pin</span>
        <span className="gto-legend-item"><span className="gto-dot gto-dot-y"></span> 攻果岭中心 Aim center</span>
        <span className="gto-legend-item"><span className="gto-dot gto-dot-r"></span> 打安全位置 Play safe</span>
      </div>

      <div className="gto-instructions no-print">
        <h3>使用说明</h3>
        <ul>
          <li><strong>下场时：</strong>① 测距仪 → 横轴 ② 果岭最严重风险 → 纵轴 ③ 交叉格 = 决策</li>
          <li><strong>复合风险：</strong>按最严重的查</li>
          <li><strong>自定义：</strong>点格子换颜色 · 点文字改描述 · 拖拽调顺序</li>
        </ul>
      </div>

      <div className="gto-print-footer print-only">
        许多帕 × Claude · 高尔夫策略工具箱 · 差点 {handicap}
      </div>

      {showReorder && (
        <ReorderPanel
          rows={rows}
          onSave={handleReorder}
          onCancel={() => setShowReorder(false)}
        />
      )}
    </div>
  )
}
