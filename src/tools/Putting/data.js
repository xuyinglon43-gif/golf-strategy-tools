const PGA_MAKE_RATE = {
  2: 0.99, 3: 0.96, 4: 0.85, 5: 0.72, 6: 0.58,
  7: 0.50, 8: 0.43, 9: 0.37, 10: 0.33,
  12: 0.25, 15: 0.18, 20: 0.10, 25: 0.07,
  30: 0.04, 40: 0.02, 50: 0.01, 60: 0.005,
}

const PGA_THREE_PUTT = {
  3: 0.00, 5: 0.00, 10: 0.02, 15: 0.03,
  20: 0.05, 25: 0.07, 30: 0.10, 40: 0.15, 50: 0.20, 60: 0.25,
}

function interpolate(table, distance) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  if (distance <= keys[0]) return table[keys[0]]
  if (distance >= keys[keys.length - 1]) return table[keys[keys.length - 1]]
  for (let i = 0; i < keys.length - 1; i++) {
    if (distance >= keys[i] && distance <= keys[i + 1]) {
      const ratio = (distance - keys[i]) / (keys[i + 1] - keys[i])
      return table[keys[i]] + ratio * (table[keys[i + 1]] - table[keys[i]])
    }
  }
  return 0
}

export function getPgaMakeRate(distance) {
  return interpolate(PGA_MAKE_RATE, distance)
}

export function getAmateurMakeRate(distance, handicap) {
  const pgaRate = getPgaMakeRate(distance)
  const multiplier = 0.85 - handicap * 0.015
  return Math.max(0.005, pgaRate * Math.max(0.35, multiplier))
}

export function getThreePuttRate(distance, handicap) {
  const pgaRate = interpolate(PGA_THREE_PUTT, distance)
  const multiplier = 1.0 + handicap * 0.05
  return Math.min(0.6, pgaRate * multiplier)
}

export function getExpectedPutts(distance, handicap) {
  const makeRate = getAmateurMakeRate(distance, handicap)
  const threePuttRate = getThreePuttRate(distance, handicap)
  const twoPuttRate = 1 - makeRate - threePuttRate
  return 1 * makeRate + 2 * Math.max(0, twoPuttRate) + 3 * threePuttRate
}

// All public functions accept distance in yards, convert to feet internally
export function getPgaMakeRateYards(yards) {
  return getPgaMakeRate(yards * 3)
}

export function getAmateurMakeRateYards(yards, handicap) {
  return getAmateurMakeRate(yards * 3, handicap)
}

export function getThreePuttRateYards(yards, handicap) {
  return getThreePuttRate(yards * 3, handicap)
}

export function getExpectedPuttsYards(yards, handicap) {
  return getExpectedPutts(yards * 3, handicap)
}

export function getInsightYards(yards, handicap) {
  const feet = yards * 3
  const pgaRate = getPgaMakeRate(feet)
  if (feet <= 5) {
    return `这个距离PGA也miss ${((1 - pgaRate) * 100).toFixed(0)}%，不用给自己压力`
  }
  if (feet <= 15) {
    return '目标是两推保par，一推进了是bonus'
  }
  if (feet <= 30) {
    return '三推很正常，重点是第一推的距离控制'
  }
  return '目标是把球送到洞边1码以内，别想进'
}

export const DISTANCE_REFS = [
  { yards: 2, desc: '一个人平躺的长度' },
  { yards: 3, desc: '一辆小轿车的长度' },
  { yards: 10, desc: '一个客厅的长度' },
]
