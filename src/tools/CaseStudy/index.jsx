import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { rounds as ALL } from './data.json'
import { LANGS, t, formatMonth, fillTemplate } from './i18n'
import './style.css'

const LANG_KEY = 'golf_case_lang'
const MIN_COURSE_ROUNDS = 2

// —— 指标定义：field 取值字段 / agg 聚合方式 / family 量纲族（图表分轴）/ lower 越低越好 / dec 小数位 ——
const MEASURES = [
  { key: 'count', field: null, agg: 'count', unit: '', family: 'count', lower: false, dec: 0 },
  { key: 'gross', field: 'gross', agg: 'avg', unit: '', family: 'big', lower: true, dec: 1 },
  { key: 'toPar', field: 'toPar', agg: 'avg', unit: '', family: 'big', lower: true, dec: 1, signed: true },
  { key: 'diff', field: 'diff', agg: 'avg', unit: '', family: 'big', lower: true, dec: 1 },
  { key: 'fairway', field: 'fairway', agg: 'avg', unit: '%', family: 'pct', lower: false, dec: 1 },
  { key: 'gir', field: 'gir', agg: 'avg', unit: '%', family: 'pct', lower: false, dec: 1 },
  { key: 'puttsPerHole', field: 'puttsPerHole', agg: 'avg', unit: '', family: 'small', lower: true, dec: 2 },
  { key: 'puttsTotal', field: 'putts', agg: 'avg', unit: '', family: 'big', lower: true, dec: 1 },
  { key: 'doublePlus', field: 'doublePlus', agg: 'avg', unit: '%', family: 'pct', lower: true, dec: 1 },
  { key: 'parBetter', field: 'parBetter', agg: 'avg', unit: '%', family: 'pct', lower: false, dec: 1 },
  { key: 'birdie', field: 'birdie', agg: 'avg', unit: '%', family: 'pct', lower: false, dec: 1 },
  { key: 'par3', field: 'par3', agg: 'avg', unit: '', family: 'small', lower: true, dec: 2 },
  { key: 'par4', field: 'par4', agg: 'avg', unit: '', family: 'small', lower: true, dec: 2 },
  { key: 'par5', field: 'par5', agg: 'avg', unit: '', family: 'small', lower: true, dec: 2 },
  { key: 'best', field: 'gross', agg: 'min', unit: '', family: 'big', lower: true, dec: 0 },
  { key: 'worst', field: 'gross', agg: 'max', unit: '', family: 'big', lower: true, dec: 0 },
  { key: 'hcp', field: 'hcp', agg: 'lastHcp', unit: '', family: 'big', lower: true, dec: 1 },
]
const M = Object.fromEntries(MEASURES.map((m) => [m.key, m]))
const DIMS = ['round', 'day', 'week', 'month', 'quarter', 'year', 'course', 'venue', 'holes', 'par']
const KPI_KEYS = ['count', 'gross', 'diff', 'fairway', 'gir', 'puttsPerHole', 'doublePlus', 'hcp']
const RANGES = ['all', 'ytd', 'half', '3m', '4w', 'custom']

// —— 主题感知 ——
function useTheme() {
  const read = () => document.documentElement.getAttribute('data-theme') || 'light'
  const [th, setTh] = useState(read)
  useEffect(() => {
    const o = new MutationObserver(() => setTh(read()))
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => o.disconnect()
  }, [])
  return th
}
function palette(theme) {
  const d = theme === 'dark'
  return {
    grid: d ? '#38383a' : '#e6e6ea', axis: d ? '#98989d' : '#6e6e73',
    tipBg: d ? '#1c1c1e' : '#fff', tipBorder: d ? '#38383a' : '#d8d8de', text: d ? '#f5f5f7' : '#1d1d1f',
    series: d
      ? ['#34c759', '#0a84ff', '#ff9f0a', '#bf5af2', '#ff453a', '#5ac8fa', '#ffd60a']
      : ['#2a7d46', '#1a6fb0', '#cc7000', '#8e5bd0', '#c4302b', '#0a84ff', '#b8770a'],
    good: d ? '#34c759' : '#248a3d', bad: d ? '#ff453a' : '#c4302b',
  }
}

// —— 工具 ——
const nn = (a) => a.filter((v) => v != null)
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
const rnd = (v, dec) => (v == null ? null : Math.round(v * 10 ** dec) / 10 ** dec)
const shortCourse = (name) => {
  if (!name) return ''
  const zh = name.match(/[一-龥][一-龥A-Za-z0-9·\s]*[一-龥]/)
  let s = zh ? zh[0].replace(/\s+/g, '') : name.split(' - ')[0]
  return s.length > 13 ? s.slice(0, 13) + '…' : s
}
function isoWeek(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  const dn = (dt.getUTCDay() + 6) % 7
  dt.setUTCDate(dt.getUTCDate() - dn + 3)
  const ft = new Date(Date.UTC(dt.getUTCFullYear(), 0, 4))
  const fn = (ft.getUTCDay() + 6) % 7
  ft.setUTCDate(ft.getUTCDate() - fn + 3)
  const w = 1 + Math.round((dt - ft) / (7 * 864e5))
  return { y: dt.getUTCFullYear(), w }
}
const addMonths = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 10) }
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5)

// 聚合：对一组回合算某指标
function aggregate(rows, key) {
  const m = M[key]
  if (!m) return null
  if (m.agg === 'count') return rows.length
  if (m.agg === 'lastHcp') {
    const e = rows.filter((r) => r.hcp != null && r.eligible)
    return e.length ? e[e.length - 1].hcp : null
  }
  const vals = nn(rows.map((r) => r[m.field]))
  if (!vals.length) return null
  if (m.agg === 'min') return Math.min(...vals)
  if (m.agg === 'max') return Math.max(...vals)
  return mean(vals)
}
// 分组键
function groupOf(r, dim, lang, home) {
  switch (dim) {
    case 'round': return { key: `${r.seq}`, label: r.date, sort: `${r.date}#${String(r.seq).padStart(4, '0')}` }
    case 'day': return { key: r.date, label: r.date, sort: r.date }
    case 'week': { const { y, w } = isoWeek(r.date); const k = `${y}-W${String(w).padStart(2, '0')}`; return { key: k, label: k, sort: k } }
    case 'month': { const k = r.date.slice(0, 7); return { key: k, label: formatMonth(k, lang), sort: k } }
    case 'quarter': { const y = r.date.slice(0, 4); const q = Math.ceil(+r.date.slice(5, 7) / 3); const k = `${y}-Q${q}`; return { key: k, label: k, sort: k } }
    case 'year': return { key: r.year, label: r.year, sort: r.year }
    case 'course': return { key: r.course, label: shortCourse(r.course), sort: r.course }
    case 'venue': { const h = r.course === home; return { key: h ? 'home' : 'away', label: h ? t[lang].homeLabel : t[lang].awayLabel, sort: h ? '0' : '1' } }
    case 'holes': { const suf = lang === 'zh' ? '洞' : lang === 'ko' ? '홀' : 'H'; return { key: `${r.holes}`, label: `${r.holes}${suf}`, sort: String(100 - r.holes).padStart(3, '0') } }
    case 'par': return { key: `${r.par}`, label: `Par ${r.par}`, sort: String(r.par).padStart(3, '0') }
    default: return { key: r.date, label: r.date, sort: r.date }
  }
}
const heatClass = (over) => over <= -2 ? 'eagle' : over === -1 ? 'birdie' : over === 0 ? 'par' : over === 1 ? 'bogey' : over === 2 ? 'double' : 'triple'

export default function CaseStudy() {
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'zh')
  useEffect(() => { localStorage.setItem(LANG_KEY, lang) }, [lang])
  const theme = useTheme()
  const c = palette(theme)
  const L = t[lang]

  const minDate = ALL[0].date, maxDate = ALL[ALL.length - 1].date

  // —— 筛选状态 ——
  const [range, setRange] = useState('all')
  const [customFrom, setCustomFrom] = useState(minDate)
  const [customTo, setCustomTo] = useState(maxDate)
  const [courses, setCourses] = useState(() => new Set())
  const [holes, setHoles] = useState('18')
  const [eligibleOnly, setEligibleOnly] = useState(false)
  const [groupBy, setGroupBy] = useState('month')
  const [measures, setMeasures] = useState(() => new Set(['gross', 'gir']))
  const [chartType, setChartType] = useState('line')
  const [showTable, setShowTable] = useState(false)
  const [sort, setSort] = useState({ key: '__g', dir: 'asc' })

  // 维度切换 → 同时重置排序（避免 effect 内 setState）
  const changeDim = (d) => {
    setGroupBy(d)
    setSort(d === 'round' ? { key: 'date', dir: 'desc' }
      : d === 'course' ? { key: 'count', dir: 'desc' }
        : { key: '__g', dir: 'asc' })
  }

  // —— 时间窗口 ——
  const win = useMemo(() => {
    switch (range) {
      case 'ytd': return { from: `${maxDate.slice(0, 4)}-01-01`, to: maxDate }
      case 'half': return { from: addMonths(maxDate, -6), to: maxDate }
      case '3m': return { from: addMonths(maxDate, -3), to: maxDate }
      case '4w': return { from: addDays(maxDate, -28), to: maxDate }
      case 'custom': return { from: customFrom || minDate, to: customTo || maxDate }
      default: return { from: minDate, to: maxDate }
    }
  }, [range, customFrom, customTo, minDate, maxDate])

  const filtered = useMemo(() => ALL.filter((r) =>
    r.date >= win.from && r.date <= win.to &&
    (courses.size === 0 || courses.has(r.course)) &&
    (holes === 'all' || String(r.holes) === holes) &&
    (!eligibleOnly || r.eligible)
  ), [win, courses, holes, eligibleOnly])

  // 上一等长周期
  const prevFiltered = useMemo(() => {
    if (range === 'all') return null
    const len = daysBetween(win.from, win.to)
    const pTo = addDays(win.from, -1), pFrom = addDays(pTo, -len)
    return ALL.filter((r) => r.date >= pFrom && r.date <= pTo &&
      (courses.size === 0 || courses.has(r.course)) &&
      (holes === 'all' || String(r.holes) === holes) &&
      (!eligibleOnly || r.eligible))
  }, [range, win, courses, holes, eligibleOnly])

  const courseOptions = useMemo(() => {
    const m = new Map()
    ALL.forEach((r) => m.set(r.course, (m.get(r.course) || 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [])
  const homeCourse = courseOptions[0]?.[0]

  const selMeasures = MEASURES.filter((m) => measures.has(m.key) && m.key !== 'count')
  const seriesMeasures = selMeasures.length ? selMeasures : [M.gross]

  // —— 分组聚合 ——
  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((r) => {
      const g = groupOf(r, groupBy, lang, homeCourse)
      if (!map.has(g.key)) map.set(g.key, { ...g, rows: [] })
      map.get(g.key).rows.push(r)
    })
    let arr = [...map.values()].map((g) => {
      const vals = {}
      MEASURES.forEach((m) => { vals[m.key] = aggregate(g.rows, m.key) })
      return { ...g, vals, n: g.rows.length }
    })
    if (groupBy === 'course') arr = arr.filter((g) => g.n >= MIN_COURSE_ROUNDS)
    arr.sort((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0))
    return arr
  }, [filtered, groupBy, lang, homeCourse])

  // —— 难度分析（按 stroke index 难/中/易聚合相对标准杆/洞） ——
  const difficulty = useMemo(() => {
    const acc = { hard: { o: 0, n: 0 }, med: { o: 0, n: 0 }, easy: { o: 0, n: 0 } }
    filtered.forEach((r) => {
      if (r.hardN) { acc.hard.o += r.hardOver; acc.hard.n += r.hardN }
      if (r.medN) { acc.med.o += r.medOver; acc.med.n += r.medN }
      if (r.easyN) { acc.easy.o += r.easyOver; acc.easy.n += r.easyN }
    })
    const a = (x) => (x.n ? x.o / x.n : null)
    return { hard: a(acc.hard), med: a(acc.med), easy: a(acc.easy) }
  }, [filtered])

  // —— 记分卡热力图：含逐洞、按日期倒序 ——
  const heatRounds = useMemo(
    () => [...filtered].filter((r) => r.holeScores && r.parValues).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [filtered]
  )

  // —— 图表数据 ——
  const chartData = groups.map((g) => {
    const o = { x: g.label }
    seriesMeasures.forEach((m) => { o[m.key] = g.vals[m.key] })
    return o
  })
  // 动态分轴：按各指标数值量级聚成最多两组（左轴大量级 / 右轴小量级）；量级接近则单轴
  const axisMap = (() => {
    const maxes = seriesMeasures.map((m) => {
      let mx = 0
      for (const d of chartData) { const v = d[m.key]; if (v != null) mx = Math.max(mx, Math.abs(v)) }
      return { key: m.key, mx: mx || 1 }
    })
    const map = {}
    if (maxes.length <= 1) { maxes.forEach((x) => { map[x.key] = 'L' }); return { map, L: maxes.length > 0, R: false } }
    const sorted = [...maxes].sort((a, b) => a.mx - b.mx)
    let gapIdx = -1, gapRatio = 1
    for (let i = 1; i < sorted.length; i++) { const r = sorted[i].mx / sorted[i - 1].mx; if (r > gapRatio) { gapRatio = r; gapIdx = i } }
    if (gapRatio < 2.5) { maxes.forEach((x) => { map[x.key] = 'L' }); return { map, L: true, R: false } }
    const threshold = sorted[gapIdx].mx
    let anyL = false, anyR = false
    maxes.forEach((x) => { if (x.mx >= threshold) { map[x.key] = 'L'; anyL = true } else { map[x.key] = 'R'; anyR = true } })
    return { map, L: anyL, R: anyR }
  })()

  // —— 排序后的表格组 ——
  const sortedGroups = useMemo(() => {
    const arr = [...groups]
    const { key, dir } = sort
    arr.sort((a, b) => {
      let av, bv
      if (key === '__g') { av = a.sort; bv = b.sort }
      else if (key === 'count') { av = a.n; bv = b.n }
      else { av = a.vals[key]; bv = b.vals[key] }
      if (av == null) return 1
      if (bv == null) return -1
      return (av < bv ? -1 : av > bv ? 1 : 0) * (dir === 'asc' ? 1 : -1)
    })
    return arr
  }, [groups, sort])

  // —— 逐场明细排序 ——
  const sortedRounds = useMemo(() => {
    const arr = [...filtered]
    const { key, dir } = sort
    arr.sort((a, b) => {
      let av = a[key], bv = b[key]
      if (av == null) return 1
      if (bv == null) return -1
      return (av < bv ? -1 : av > bv ? 1 : 0) * (dir === 'asc' ? 1 : -1)
    })
    return arr
  }, [filtered, sort])

  const totals = useMemo(() => {
    const o = {}
    MEASURES.forEach((m) => { o[m.key] = aggregate(filtered, m.key) })
    return o
  }, [filtered])

  const sortBy = (key) => setSort((s) => s.key === key
    ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: (key === 'date' || key === 'count') ? 'desc' : 'asc' })

  const toggleSet = (fn, v) => fn((p) => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n })
  const resetAll = () => { setRange('all'); setCourses(new Set()); setHoles('18'); setEligibleOnly(false) }

  // —— 格式化 ——
  const fmt = (key, v) => {
    if (v == null) return '—'
    const m = M[key]; const r = rnd(v, m.dec)
    if (m.signed) return r > 0 ? `+${r}` : r === 0 ? 'E' : `${r}`
    return `${r}${m.unit}`
  }

  // —— CSV 导出 ——
  const exportCsv = () => {
    let header, rows
    if (groupBy === 'round') {
      header = ['date', 'course', 'holes', 'gross', 'toPar', 'diff', 'fairway', 'gir', 'putts', 'puttsPerHole', 'doublePlus', 'parBetter', 'birdie', 'par3', 'par4', 'par5', 'hcp']
      rows = sortedRounds.map((r) => header.map((k) => r[k] ?? ''))
    } else {
      const cols = ['count', ...selMeasures.map((m) => m.key)]
      header = [groupBy, ...cols]
      rows = sortedGroups.map((g) => [g.label, g.n, ...selMeasures.map((m) => (g.vals[m.key] ?? ''))])
    }
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `golf_${groupBy}_${win.from}_${win.to}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const tip = { background: c.tipBg, border: `1px solid ${c.tipBorder}`, borderRadius: 10, color: c.text, fontSize: 12 }
  const tick = { fill: c.axis, fontSize: 11 }

  return (
    <div className="cs-page">
      <div className="cs-topline no-print">
        <Link to="/" className="cs-back">{L.back}</Link>
        <div className="cs-langs">
          {LANGS.map((l) => (
            <button key={l.code} className={`cs-lang ${lang === l.code ? 'active' : ''}`} onClick={() => setLang(l.code)}>{l.label}</button>
          ))}
        </div>
      </div>

      <header className="cs-hero">
        <h1 className="cs-title">{L.title}</h1>
        <p className="cs-sub">{L.subtitle}</p>
      </header>

      {/* 1. KPI 概览（带环比） */}
      <section className="cs-kpis">
        {KPI_KEYS.map((k) => {
          const cur = totals[k]
          const prev = prevFiltered ? aggregate(prevFiltered, k) : null
          let delta = null, good = null
          if (cur != null && prev != null) {
            delta = rnd(cur - prev, M[k].dec)
            if (k !== 'count' && delta !== 0) good = M[k].lower ? delta < 0 : delta > 0
          }
          return (
            <div className="cs-kpi" key={k}>
              <div className="cs-kpi-label">{L.meas[k]}</div>
              <div className="cs-kpi-value">{fmt(k, cur)}</div>
              {delta != null && delta !== 0 && (
                <div className={`cs-kpi-delta ${good === true ? 'good' : good === false ? 'bad' : ''}`}>
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}{M[k].unit}
                </div>
              )}
            </div>
          )
        })}
      </section>

      {/* 2. 叠加图表 */}
      {filtered.length > 0 && (
          <section className="cs-card">
            <div className="cs-chart-head">
              <h2 className="cs-card-title">{L.chart}</h2>
              <div className="cs-seg">
                <button className={chartType === 'line' ? 'active' : ''} onClick={() => setChartType('line')}>{L.chartLine}</button>
                <button className={chartType === 'bar' ? 'active' : ''} onClick={() => setChartType('bar')}>{L.chartBar}</button>
              </div>
            </div>
            <div className="cs-metric-chips">
              {MEASURES.filter((m) => m.key !== 'count').map((m) => (
                <button key={m.key} className={`cs-chip sm ${measures.has(m.key) ? 'active' : ''}`} onClick={() => toggleSet(setMeasures, m.key)}>{L.meas[m.key]}</button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="x" tick={tick} interval="preserveStartEnd" minTickGap={36} axisLine={{ stroke: c.grid }} tickLine={false} />
                {axisMap.L && <YAxis yAxisId="L" tick={tick} axisLine={false} tickLine={false} width={38} />}
                {axisMap.R && <YAxis yAxisId="R" orientation="right" tick={tick} axisLine={false} tickLine={false} width={38} />}
                <Tooltip contentStyle={tip} labelStyle={{ color: c.text }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {seriesMeasures.map((m, i) => {
                  const axis = axisMap.map[m.key] || 'L'
                  const color = c.series[i % c.series.length]
                  const name = L.meas[m.key] + (m.unit || '')
                  return chartType === 'bar'
                    ? <Bar key={m.key} yAxisId={axis} dataKey={m.key} name={name} fill={color} radius={[3, 3, 0, 0]} maxBarSize={26} />
                    : <Line key={m.key} yAxisId={axis} type="monotone" dataKey={m.key} name={name} stroke={color} strokeWidth={2} dot={{ r: 1.6, fill: color }} connectNulls />
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </section>
      )}

      {/* 3. 时间范围 + 分组维度 + 筛选 */}
      <section className="cs-controls">
        <div className="cs-ctrl-row">
          <span className="cs-ctrl-label">{L.range}</span>
          <div className="cs-chips">
            {RANGES.map((r) => (
              <button key={r} className={`cs-chip ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>
                {{ all: L.rAll, ytd: L.rYTD, half: L.rHalf, '3m': L.r3m, '4w': L.r4w, custom: L.rCustom }[r]}
              </button>
            ))}
          </div>
          {range === 'custom' && (
            <div className="cs-dates">
              <input type="date" value={customFrom} min={minDate} max={maxDate} onChange={(e) => setCustomFrom(e.target.value)} />
              <span>→</span>
              <input type="date" value={customTo} min={minDate} max={maxDate} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          )}
        </div>
        <div className="cs-ctrl-row">
          <span className="cs-ctrl-label">{L.groupBy}</span>
          <div className="cs-chips">
            {DIMS.map((d) => (
              <button key={d} className={`cs-chip ${groupBy === d ? 'active' : ''}`} onClick={() => changeDim(d)}>{L.dim[d]}</button>
            ))}
          </div>
        </div>
        <div className="cs-ctrl-row">
          <span className="cs-ctrl-label">{L.fHoles}</span>
          <div className="cs-chips">
            {[['all', L.all], ['18', L.holes18], ['9', L.holes9]].map(([v, label]) => (
              <button key={v} className={`cs-chip ${holes === v ? 'active' : ''}`} onClick={() => setHoles(v)}>{label}</button>
            ))}
          </div>
          <span className="cs-ctrl-label" style={{ marginLeft: 8 }}>{L.fCourse}</span>
          <CourseSelect L={L} options={courseOptions} selected={courses} onToggle={(v) => toggleSet(setCourses, v)} onClear={() => setCourses(new Set())} />
          <label className="cs-switch" style={{ marginLeft: 8 }}>
            <input type="checkbox" checked={eligibleOnly} onChange={(e) => setEligibleOnly(e.target.checked)} />
            <span>{L.eligibleOnly}</span>
          </label>
          <button className="cs-reset" onClick={resetAll}>{L.reset}</button>
          <button className="cs-reset cs-export" onClick={exportCsv}>{L.exportCsv}</button>
        </div>
      </section>

      {/* 4. 难度分析 */}
      {filtered.length > 0 && (
        <section className="cs-card">
          <h2 className="cs-card-title">{L.secDiff}</h2>
          <p className="cs-card-hint">{L.diffHint}</p>
          <div className="cs-diff">
            {[['hard', L.tHard, difficulty.hard], ['med', L.tMed, difficulty.med], ['easy', L.tEasy, difficulty.easy]].map(([k, lab, v]) => (
              <div className={`cs-diff-tile ${k}`} key={k}>
                <div className="cs-diff-name">{lab}</div>
                <div className="cs-diff-val">{v == null ? '—' : `${v > 0 ? '+' : ''}${Math.round(v * 100) / 100}`}<span className="cs-diff-unit">{L.perHole}</span></div>
                <div className="cs-diff-bar"><div className="cs-diff-fill" style={{ width: `${Math.min(100, Math.max(0, (v || 0) / 2) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. 记分卡热力图 */}
      {heatRounds.length > 0 && (
        <section className="cs-card">
          <div className="cs-heat-head">
            <h2 className="cs-card-title">{L.secHeat}</h2>
            <div className="cs-heat-legend">
              {[['eagle', L.hEagle], ['birdie', L.hBirdie], ['par', L.hPar], ['bogey', L.hBogey], ['double', L.hDouble], ['triple', L.hTriple]].map(([k, lab]) => (
                <span className="cs-leg" key={k}><i className={`cs-hc ${k}`} />{lab}</span>
              ))}
            </div>
          </div>
          <p className="cs-card-hint">{L.heatHint}</p>
          <div className="cs-heat-wrap">
            {heatRounds.map((r) => (
              <div className="cs-heat-row" key={r.id || r.seq}>
                <span className="cs-heat-date">{r.date}</span>
                <span className="cs-heat-course" title={r.course}>{shortCourse(r.course)}</span>
                <div className="cs-heat-cells">
                  {r.holeScores.map((s, i) => {
                    const over = s - r.parValues[i]
                    return <span key={i} className={`cs-hc ${heatClass(over)}`} title={`#${i + 1}: ${s} (${over > 0 ? '+' + over : over === 0 ? 'E' : over})`}>{s}</span>
                  })}
                </div>
                <span className="cs-heat-total">{r.gross}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. 透视表（默认折叠，深入分析时展开） */}
      {filtered.length === 0 ? (
        <section className="cs-card cs-empty">{L.empty}</section>
      ) : (
        <section className="cs-card">
          <div className="cs-table-head">
            <button className="cs-table-toggle" onClick={() => setShowTable((s) => !s)}>
              <span className="cs-tri">{showTable ? '▾' : '▸'}</span>{L.table}
            </button>
            <span className="cs-rows-count">{fillTemplate(L.rowsShown, { n: groupBy === 'round' ? filtered.length : groups.length, r: filtered.length })}</span>
          </div>
          {showTable && (
            <div className="cs-table-wrap">
              {groupBy === 'round' ? (
                <table className="cs-table">
                  <thead><tr>
                    {[['date', L.col.date, 'l'], ['course', L.col.course, 'l'], ['holes', L.col.holes], ['gross', L.col.gross], ['toPar', L.col.toPar], ['diff', L.col.diff], ['fairway', L.col.fairway], ['gir', L.col.gir], ['putts', L.col.putts], ['doublePlus', L.col.doublePlus], ['parBetter', L.col.parBetter], ['hcp', L.col.hcp]].map(([k, lab, al]) => (
                      <Th key={k} k={k} sort={sort} onSort={sortBy} align={al}>{lab}</Th>
                    ))}
                    <th className="cs-th-link"></th>
                  </tr></thead>
                  <tbody>
                    {sortedRounds.map((r) => (
                      <tr key={r.id || r.seq}>
                        <td className="l">{r.date}</td>
                        <td className="l cs-td-course" title={r.course}>{shortCourse(r.course)}</td>
                        <td>{r.holes}</td>
                        <td className="num">{r.gross}</td>
                        <td className="num">{r.toPar > 0 ? `+${r.toPar}` : r.toPar === 0 ? 'E' : r.toPar}</td>
                        <td className="num">{r.diff ?? '—'}</td>
                        <td className="num">{r.fairway != null ? `${rnd(r.fairway, 0)}%` : '—'}</td>
                        <td className="num">{r.gir != null ? `${rnd(r.gir, 0)}%` : '—'}</td>
                        <td className="num">{r.putts ?? '—'}</td>
                        <td className="num">{r.doublePlus != null ? `${r.doublePlus}%` : '—'}</td>
                        <td className="num">{r.parBetter != null ? `${r.parBetter}%` : '—'}</td>
                        <td className="num">{r.hcp ?? '—'}</td>
                        <td className="cs-th-link">{r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="cs-link">{L.link}↗</a> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="cs-table">
                  <thead><tr>
                    <Th k="__g" sort={sort} onSort={sortBy} align="l">{L.dimCol[groupBy]}</Th>
                    <Th k="count" sort={sort} onSort={sortBy}>{L.meas.count}</Th>
                    {selMeasures.map((m) => <Th key={m.key} k={m.key} sort={sort} onSort={sortBy}>{L.meas[m.key]}{m.unit}</Th>)}
                  </tr></thead>
                  <tbody>
                    {sortedGroups.map((g) => (
                      <tr key={g.key}>
                        <td className="l">{g.label}</td>
                        <td className="num">{g.n}</td>
                        {selMeasures.map((m) => <td className="num" key={m.key}>{fmt(m.key, g.vals[m.key])}</td>)}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="cs-total">
                    <td className="l">{L.totalRow}</td>
                    <td className="num">{filtered.length}</td>
                    {selMeasures.map((m) => <td className="num" key={m.key}>{fmt(m.key, totals[m.key])}</td>)}
                  </tr></tfoot>
                </table>
              )}
            </div>
          )}
        </section>
      )}

      <footer className="cs-foot">
        <p className="cs-foot-src">{L.footer} · {win.from} → {win.to}</p>
      </footer>
    </div>
  )
}

function Th({ k, sort, onSort, children, align }) {
  const active = sort.key === k
  return (
    <th className={`cs-th ${active ? 'active' : ''} ${align === 'l' ? 'l' : ''}`} onClick={() => onSort(k)}>
      {children}<span className="cs-sort-ind">{active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
    </th>
  )
}

function CourseSelect({ L, options, selected, onToggle, onClear }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const list = options.filter(([name]) => name.toLowerCase().includes(q.toLowerCase()))
  const label = selected.size === 0 ? L.courseAll : fillTemplate(L.selected, { n: selected.size })
  return (
    <div className="cs-course-select" ref={ref}>
      <button className={`cs-course-btn ${selected.size ? 'active' : ''}`} onClick={() => setOpen((o) => !o)}>
        {label} <span className="cs-caret">▾</span>
      </button>
      {open && (
        <div className="cs-course-panel">
          <input className="cs-course-search" autoFocus placeholder={L.courseSearch} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="cs-course-list">
            {list.map(([name, n]) => (
              <label key={name} className="cs-course-opt">
                <input type="checkbox" checked={selected.has(name)} onChange={() => onToggle(name)} />
                <span className="cs-course-name" title={name}>{shortCourse(name)}</span>
                <span className="cs-course-n">{n}</span>
              </label>
            ))}
          </div>
          {selected.size > 0 && <button className="cs-course-clear" onClick={onClear}>{L.reset}</button>}
        </div>
      )}
    </div>
  )
}
