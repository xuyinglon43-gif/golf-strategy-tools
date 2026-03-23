// All coordinates in canvas space (500x640)
// Green is roughly centered, golfer at bottom

export const SCENES = [
  {
    id: 'water-right',
    name: '右侧水',
    desc: '左右不对称风险，往安全侧偏移',
    green: { cx: 250, cy: 240, rx: 80, ry: 60 },
    hazards: [
      { type: 'water', path: [[340, 170], [500, 170], [500, 350], [340, 350], [330, 300], [320, 250], [330, 200]] },
      { type: 'bunker', cx: 190, cy: 195, rx: 22, ry: 16 },
      { type: 'bunker', cx: 250, cy: 310, rx: 25, ry: 14 },
    ],
    pins: [
      { id: 'A', label: 'A 安全', x: 230, y: 240, desc: '果岭中间偏左' },
      { id: 'B', label: 'B 刁钻', x: 290, y: 235, desc: '果岭右侧靠水' },
      { id: 'C', label: 'C 极端', x: 310, y: 210, desc: '果岭右后角紧贴水' },
    ],
  },
  {
    id: 'narrow-dropoff',
    name: '狭长果岭+后方断崖',
    desc: '前后容错小，距离控制比方向更重要',
    green: { cx: 250, cy: 240, rx: 55, ry: 85 },
    hazards: [
      { type: 'bunker', cx: 185, cy: 230, rx: 20, ry: 18 },
      { type: 'bunker', cx: 315, cy: 250, rx: 20, ry: 18 },
      { type: 'cliff', path: [[170, 140], [330, 140], [330, 160], [170, 160]] },
    ],
    pins: [
      { id: 'A', label: 'A 安全', x: 250, y: 250, desc: '果岭中段' },
      { id: 'B', label: 'B 刁钻', x: 250, y: 185, desc: '果岭后部靠断崖' },
      { id: 'C', label: 'C 极端', x: 250, y: 310, desc: '果岭最前端' },
    ],
  },
  {
    id: 'water-front',
    name: '前方carry水',
    desc: '够不够得到才是核心问题',
    green: { cx: 250, cy: 220, rx: 85, ry: 65 },
    hazards: [
      { type: 'water', path: [[100, 290], [400, 290], [400, 380], [100, 380]] },
      { type: 'bunker', cx: 170, cy: 200, rx: 20, ry: 16 },
      { type: 'bunker', cx: 330, cy: 210, rx: 20, ry: 16 },
    ],
    pins: [
      { id: 'A', label: 'A 安全', x: 250, y: 210, desc: '果岭中后部' },
      { id: 'B', label: 'B 刁钻', x: 250, y: 265, desc: '果岭前沿靠水' },
      { id: 'C', label: 'C 极端', x: 310, y: 260, desc: '果岭右前角水边' },
    ],
  },
]

export const DISTANCE_OPTIONS = [
  { label: '100码', value: 100, index: 0 },
  { label: '120码', value: 120, index: 1 },
  { label: '140码', value: 140, index: 2 },
  { label: '160码', value: 160, index: 3 },
  { label: '180码', value: 180, index: 4 },
  { label: '200码', value: 200, index: 5 },
]

const STORAGE_KEY = 'custom_greens'
const MAX_LAYOUTS = 10

export function loadCustomLayouts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveCustomLayout(layout) {
  const layouts = loadCustomLayouts()
  const existing = layouts.findIndex(l => l.id === layout.id)
  if (existing >= 0) {
    layouts[existing] = layout
  } else {
    if (layouts.length >= MAX_LAYOUTS) layouts.shift()
    layouts.push(layout)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
}

export function deleteCustomLayout(id) {
  const layouts = loadCustomLayouts().filter(l => l.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layouts))
}

export function makeDefaultCustomScene() {
  return {
    id: 'custom_' + Date.now(),
    name: '自定义果岭',
    desc: '你自己的果岭，你自己的策略',
    green: { cx: 250, cy: 230, rx: 80, ry: 60 },
    hazards: [],
    pins: [{ id: 'custom', label: '旗位', x: 250, y: 230 }],
  }
}
