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
  const biasY = spread.y * 0.15 // shift short
  for (let i = 0; i < count; i++) {
    samples.push({
      x: aimX + randn() * spread.x,
      y: aimY + randn() * spread.y + biasY, // positive = toward golfer = short
    })
  }
  return samples
}

export function classifySample(x, y, scene) {
  const { green, hazards } = scene

  // Check hazards first
  for (const h of hazards) {
    if (h.type === 'water' || h.type === 'cliff') {
      if (pointInPolygon(x, y, h.path)) return h.type
    } else if (h.type === 'bunker') {
      if (pointInEllipse(x, y, h.cx, h.cy, h.rx, h.ry)) return 'bunker'
    }
  }

  // Check green
  if (pointInEllipse(x, y, green.cx, green.cy, green.rx, green.ry)) return 'green'

  // Check rough (far from green) vs fairway (near green)
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

export function computeZones(samples, scene) {
  const zones = { green: 0, bunker: 0, water: 0, cliff: 0, fairway: 0, rough: 0 }
  for (const s of samples) {
    const z = classifySample(s.x, s.y, scene)
    zones[z]++
  }
  const total = samples.length
  for (const k of Object.keys(zones)) {
    zones[k] = zones[k] / total
  }
  return zones
}

export function calcEV(zones, handicap) {
  const bunkerPenalty = handicap > 15 ? 1.2 : handicap > 8 ? 0.9 : 0.6
  const roughPenalty = handicap > 15 ? 1.3 : handicap > 8 ? 1.0 : 0.7
  const fairwayPenalty = handicap > 15 ? 0.8 : handicap > 8 ? 0.6 : 0.4

  return (
    zones.green * 0.05 +
    zones.bunker * bunkerPenalty +
    zones.water * 2.2 +
    zones.cliff * 2.5 +
    zones.fairway * fairwayPenalty +
    zones.rough * roughPenalty
  )
}
