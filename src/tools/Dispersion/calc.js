export function getSpread(handicap, distanceIndex) {
  const baseX = 12
  const baseY = 16
  const hMul = 1.0 + handicap * 0.067
  const distMultipliers = [0.65, 0.8, 1.0, 1.2, 1.45, 1.75]
  const dMul = distMultipliers[distanceIndex]
  return {
    x: baseX * hMul * dMul,
    y: baseY * hMul * dMul,
  }
}

// Normal distribution using Box-Muller
function randn() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

export function generateSamples(aimX, aimY, spread, count = 2000) {
  const samples = []
  const biasY = spread.y * 0.15
  for (let i = 0; i < count; i++) {
    samples.push({
      x: aimX + randn() * spread.x,
      y: aimY + randn() * spread.y + biasY,
    })
  }
  return samples
}

export function classifySample(x, y, scene) {
  const { green, hazards } = scene

  for (const h of hazards) {
    if (h.type === 'water' || h.type === 'cliff') {
      if (h.path) {
        if (pointInPolygon(x, y, h.path)) return h.type
      } else if (h.cx !== undefined) {
        if (pointInEllipse(x, y, h.cx, h.cy, h.rx, h.ry)) return h.type
      }
    } else if (h.type === 'bunker') {
      if (pointInEllipse(x, y, h.cx, h.cy, h.rx, h.ry)) return 'bunker'
    } else if (h.type === 'tree') {
      const r = h.r || 12
      if ((x - h.cx) ** 2 + (y - h.cy) ** 2 <= r * r) return 'rough'
    }
  }

  if (pointInEllipse(x, y, green.cx, green.cy, green.rx, green.ry)) return 'green'

  const dist = Math.sqrt(((x - green.cx) / green.rx) ** 2 + ((y - green.cy) / green.ry) ** 2)
  if (dist < 1.8) return 'fairway'
  return 'rough'
}

function pointInEllipse(x, y, cx, cy, rx, ry) {
  return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1
}

function pointInPolygon(x, y, polygon) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1]
    const xj = polygon[j][0], yj = polygon[j][1]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

const PX_TO_FEET = 0.6

const PGA_PUTTS_TABLE = [
  [3, 1.01], [5, 1.25], [8, 1.50], [10, 1.65],
  [15, 1.80], [20, 1.90], [25, 1.95], [30, 2.00],
  [40, 2.10], [50, 2.20], [60, 2.30],
]

function greenEV(distToPin_feet, handicap) {
  let basePutts = 2.3
  for (let i = 0; i < PGA_PUTTS_TABLE.length - 1; i++) {
    const [d1, p1] = PGA_PUTTS_TABLE[i]
    const [d2, p2] = PGA_PUTTS_TABLE[i + 1]
    if (distToPin_feet <= d1) { basePutts = p1; break }
    if (distToPin_feet <= d2) {
      basePutts = p1 + (p2 - p1) * (distToPin_feet - d1) / (d2 - d1)
      break
    }
  }
  const hdcpMultiplier = 1.05 + handicap * 0.0125
  return basePutts * hdcpMultiplier - 2
}

export function computeZones(samples, scene, flagPos, handicap) {
  const zones = { green: 0, bunker: 0, water: 0, cliff: 0, fairway: 0, rough: 0 }
  let greenEVSum = 0
  let greenCount = 0
  for (const s of samples) {
    const z = classifySample(s.x, s.y, scene)
    zones[z]++
    if (z === 'green' && flagPos) {
      const dx = s.x - flagPos.x
      const dy = s.y - flagPos.y
      const distFeet = Math.sqrt(dx * dx + dy * dy) * PX_TO_FEET
      greenEVSum += greenEV(distFeet, handicap)
      greenCount++
    }
  }
  const total = samples.length
  for (const k of Object.keys(zones)) {
    zones[k] = zones[k] / total
  }
  return { zones, greenEVSum, greenCount }
}

export function calcEV(result, handicap) {
  const { zones, greenEVSum, greenCount } = result
  const bunkerPenalty = handicap > 15 ? 1.2 : handicap > 8 ? 0.9 : 0.6
  const roughPenalty = handicap > 15 ? 1.3 : handicap > 8 ? 1.0 : 0.7
  const fairwayPenalty = handicap > 15 ? 0.8 : handicap > 8 ? 0.6 : 0.4

  const avgGreenEV = greenCount > 0 ? greenEVSum / greenCount : 0

  return (
    zones.green * avgGreenEV +
    zones.bunker * bunkerPenalty +
    zones.water * 2.2 +
    zones.cliff * 2.5 +
    zones.fairway * fairwayPenalty +
    zones.rough * roughPenalty
  )
}

// Simulate EV for a single aim point (fewer samples for speed)
function simulateEV(ax, ay, scene, flagPos, handicap, distIdx) {
  const spread = getSpread(handicap, distIdx)
  const samples = generateSamples(ax, ay, spread, 500)
  const result = computeZones(samples, scene, flagPos, handicap)
  return calcEV(result, handicap)
}

export function findBestAimPoint(scene, flagPos, handicap, distIdx) {
  const gridStep = 8
  const searchRadius = 80
  const cx = scene.green.cx, cy = scene.green.cy
  let bestEV = Infinity
  let bestPoint = { x: cx, y: cy }

  for (let x = cx - searchRadius; x <= cx + searchRadius; x += gridStep) {
    for (let y = cy - searchRadius; y <= cy + searchRadius; y += gridStep) {
      const ev = simulateEV(x, y, scene, flagPos, handicap, distIdx)
      if (ev < bestEV) {
        bestEV = ev
        bestPoint = { x, y }
      }
    }
  }

  return { point: bestPoint, ev: bestEV }
}
