#!/usr/bin/env node
/**
 * 数据查询站「单一数据源」生成器 —— 全高尔夫生命周期看板
 *
 * 读取逐场原始数据（含逐洞 holeScores/parValues），逐场算出洞级派生指标，
 * 生成 src/tools/CaseStudy/data.json（{ meta, rounds }）。
 * 页面所有筛选 / 分组 / 指标 / 图表都在浏览器端基于 rounds 实时计算，
 * 加新场次只需重新跑本脚本，无需改页面代码。
 *
 * 用法：
 *   npm run case-data            # 默认读取 DEFAULT_SRC
 *   npm run case-data -- /路径   # 指定其它原始数据目录
 *
 * 数据源优先级：golfshot_rounds_raw.json（含逐洞）> 退化无法运行。
 * 未来接 Garmin：产出同样字段（尤其 holeScores/parValues）即可，页面零改动。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_SRC = '/Users/yinglong/Documents/Codex/突破差点15训练小组/golfshot-data'
const SRC = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_SRC
const OUT = join(__dirname, '..', 'src', 'tools', 'CaseStudy', 'data.json')

const num = (v) => (v == null || v === '' ? null : Number(v))
const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10)
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)

const src = JSON.parse(readFileSync(join(SRC, 'golfshot_rounds_raw.json'), 'utf8'))
const rawRounds = src.rounds || []

const rounds = rawRounds.map((r) => {
  const hs = Array.isArray(r.holeScores) ? r.holeScores : null
  const pv = Array.isArray(r.parValues) ? r.parValues : null
  const holes = num(r.holesPlayed ?? r.holes)
  const gross = num(r.grossScore ?? r.score)
  const par = num(r.parPlayed ?? r.par)

  // —— 逐洞派生指标 ——
  const si = Array.isArray(r.strokeIndex) ? r.strokeIndex : null
  let doublePlus = null, parBetter = null, birdie = null
  let par3 = null, par4 = null, par5 = null
  let front9 = null, back9 = null
  let hardOver = null, hardN = null, medOver = null, medN = null, easyOver = null, easyN = null
  if (hs && pv && hs.length === pv.length && hs.length > 0) {
    const diffs = hs.map((s, i) => s - pv[i])
    const n = diffs.length
    doublePlus = round1((diffs.filter((d) => d >= 2).length / n) * 100)
    parBetter = round1((diffs.filter((d) => d <= 0).length / n) * 100)
    birdie = round1((diffs.filter((d) => d <= -1).length / n) * 100)
    const p3 = hs.filter((_, i) => pv[i] === 3)
    const p4 = hs.filter((_, i) => pv[i] === 4)
    const p5 = hs.filter((_, i) => pv[i] === 5)
    par3 = round1(avg(p3)); par4 = round1(avg(p4)); par5 = round1(avg(p5))
    if (hs.length === 18) {
      front9 = hs.slice(0, 9).reduce((a, b) => a + b, 0)
      back9 = hs.slice(9).reduce((a, b) => a + b, 0)
    }
    // 按 strokeIndex 难度分层（1-6 难 / 7-12 中 / 13-18 易），累计相对标准杆与洞数
    if (si && si.length === hs.length) {
      hardOver = 0; hardN = 0; medOver = 0; medN = 0; easyOver = 0; easyN = 0
      for (let i = 0; i < hs.length; i++) {
        const over = diffs[i], idx = si[i]
        if (idx >= 1 && idx <= 6) { hardOver += over; hardN++ }
        else if (idx >= 7 && idx <= 12) { medOver += over; medN++ }
        else if (idx >= 13) { easyOver += over; easyN++ }
      }
    }
  }

  return {
    seq: num(r.sequence),
    date: r.date,
    year: r.date ? r.date.slice(0, 4) : null,
    course: r.facilityName || r.course,
    city: r.city || null,
    tee: r.tee || null,
    par,
    rating: num(r.rating),
    slope: num(r.slope),
    holes,
    gross,
    net: num(r.netScore),
    toPar: gross != null && par != null ? gross - par : null,
    diff: num(r.scoreDifferential),
    hcp: num(r.calculatedHandicapIndex),
    eligible: r.handicapEligible === true || String(r.handicapEligible).toLowerCase() === 'true',
    fairway: num(r.fairwayPctDetail ?? r.fairwayPct),
    gir: num(r.girPctDetail ?? r.girPct),
    putts: num(r.putts),
    puttsPerHole: r.putts != null && holes ? round1(num(r.putts) / holes) : num(r.puttsPerHole),
    doublePlus, parBetter, birdie, par3, par4, par5, front9, back9,
    hardOver, hardN, medOver, medN, easyOver, easyN,
    holeScores: hs, parValues: pv,
    id: r.roundId || (r.detailUrl ? r.detailUrl.split('/').pop() : null),
    url: r.detailUrl || null,
  }
}).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

// —— 差点头部信息 ——
let meta = { source: 'Golfshot', player: '许多帕' }
try {
  const s = JSON.parse(readFileSync(join(SRC, 'golfshot_handicap_history.json'), 'utf8')).summary
  meta = {
    source: 'Golfshot', player: '许多帕',
    rangeFrom: s.range?.from ?? rounds[0]?.date ?? null,
    rangeTo: s.range?.to ?? rounds[rounds.length - 1]?.date ?? null,
    startHandicap: s.firstCalculatedHandicapIndex ?? null,
    currentHandicap: s.calculatedLatestHandicapIndex ?? null,
    bestHandicap: s.bestCalculatedHandicapIndex ?? null,
    excludedRounds: s.excludedManualRounds ?? 0,
  }
} catch {
  meta.rangeFrom = rounds[0]?.date ?? null
  meta.rangeTo = rounds[rounds.length - 1]?.date ?? null
}

writeFileSync(OUT, JSON.stringify({ meta, rounds }, null, 2) + '\n', 'utf8')
const withHoles = rounds.filter((r) => r.holeScores).length
console.log(
  `✓ 生成 ${OUT}\n  逐场 ${rounds.length} 条（含逐洞 ${withHoles}）· ${meta.rangeFrom} → ${meta.rangeTo} · 差点 ${meta.startHandicap} → ${meta.currentHandicap}`
)
