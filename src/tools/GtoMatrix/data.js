export const DISTANCES = [50, 70, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 200]

export const DEFAULT_ROWS = [
  { zh: '四周开阔，全是短草', en: 'Wide open', feeling: '闭眼打都行' },
  { zh: '果岭大，容错充足', en: 'Big target', feeling: '瞄中间就好' },
  { zh: '一侧有浅长草', en: 'Light rough', feeling: '偏了也能救' },
  { zh: '果岭有坡度，不极端', en: 'Sloped green', feeling: '上去就行' },
  { zh: '一侧有普通沙坑', en: 'Bunker', feeling: '别往那边打' },
  { zh: '周围深长草', en: 'Thick rough', feeling: '偏了不好找球位' },
  { zh: '旗贴边，一侧空间窄', en: 'Tucked pin', feeling: '打那边找死' },
  { zh: '果岭分层/强烈坡度', en: 'Tiered green', feeling: '上错层就三推' },
  { zh: '后方大下坡/断崖', en: 'Dropoff behind', feeling: '宁短别长' },
  { zh: '旁边树林/灌木', en: 'Trees', feeling: '偏了横着挖' },
  { zh: '前方有水必须carry', en: 'Water in front', feeling: '打薄了喂鱼' },
  { zh: '一侧紧贴水/OB', en: 'Penalty one side', feeling: '那边过去罚杆' },
  { zh: '两侧水/OB极窄落点', en: 'Penalty both sides', feeling: '就那么窄一条命' },
]

export function getThresholds(handicap) {
  const h = Math.max(0, Math.min(36, handicap))
  const greenMax = Math.round(14 - h * 0.306)
  const redMin = Math.round(22 - h * 0.389)
  return {
    greenMax: Math.max(3, greenMax),
    redMin: Math.max(Math.max(3, greenMax) + 2, Math.min(26, redMin)),
  }
}

export function getColor(row, col, handicap) {
  const sum = row + col
  const t = getThresholds(handicap)
  if (sum <= t.greenMax) return 'g'
  if (sum >= t.redMin) return 'r'
  return 'y'
}

export function generateDefaultGrid(handicap) {
  const grid = []
  for (let r = 0; r < 13; r++) {
    const row = []
    for (let c = 0; c < 13; c++) {
      row.push(getColor(r + 1, c + 1, handicap))
    }
    grid.push(row)
  }
  return grid
}

export function loadGtoData(handicap) {
  const key = `ggto_${handicap}`
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      // ignore
    }
  }
  return null
}

export function saveGtoData(handicap, data) {
  const key = `ggto_${handicap}`
  localStorage.setItem(key, JSON.stringify(data))
}
