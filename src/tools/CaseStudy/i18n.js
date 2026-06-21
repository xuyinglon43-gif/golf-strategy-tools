// 高尔夫数据透视查询站 —— 中 / 한국어 / English 三语字典

export const LANGS = [
  { code: 'zh', label: '中' },
  { code: 'ko', label: '한' },
  { code: 'en', label: 'EN' },
]

export const t = {
  zh: {
    title: '许多帕数据查询站',
    subtitle: '许多帕的全高尔夫生命周期数据 · 任意维度 × 多指标叠加 · 逐洞级细颗粒',
    back: '← 返回',

    range: '时间范围',
    rAll: '全部', rYTD: '今年', rHalf: '近半年', r3m: '近三个月', r4w: '近四周', rCustom: '自定义',
    fCourse: '球场', fHoles: '洞数',
    all: '全部', holes18: '18 洞', holes9: '9 洞',
    eligibleOnly: '仅计差点回合',
    courseSearch: '搜索球场…', courseAll: '全部球场', selected: '已选 {n}',
    reset: '重置', exportCsv: '导出 CSV',

    groupBy: '分组维度',
    metrics: '指标（可多选，叠加显示）',
    chart: '图表', chartLine: '折线', chartBar: '柱状',
    table: '透视表', totalRow: '合计 / 平均', rowsShown: '{n} 组 · {r} 场',
    vsPrev: 'vs 上一等长周期',
    empty: '没有符合条件的回合，放宽筛选试试。',
    link: '原始',

    dim: {
      round: '按场', day: '按日', week: '按周', month: '按月',
      quarter: '按季度', year: '按年', course: '按球场', venue: '主/客场',
      holes: '按洞数', par: '按标准杆',
    },
    dimCol: {
      round: '日期', day: '日期', week: '周', month: '月份',
      quarter: '季度', year: '年份', course: '球场', venue: '场地',
      holes: '洞数', par: '标准杆',
    },
    homeLabel: '主场', awayLabel: '客场',
    secDiff: '难度分析', diffHint: '难洞 = stroke index 1-6 · 中等 = 7-12 · 易洞 = 13-18；数值为每洞相对标准杆，越低越好',
    tHard: '难洞', tMed: '中等洞', tEasy: '易洞', perHole: '/洞',
    secHeat: '记分卡热力图', heatHint: '每行一场、每格一洞相对标准杆；右半边越红说明后九越容易崩',
    hEagle: '鹰−', hBirdie: '小鸟', hPar: '标准杆', hBogey: '柏忌', hDouble: '双柏忌', hTriple: '+3 以上',
    meas: {
      count: '场次', gross: '平均总杆', toPar: '平均 +/-', diff: '平均差点值',
      fairway: '上球道率', gir: 'GIR', puttsPerHole: '推杆/洞', puttsTotal: '总推杆',
      doublePlus: '双柏忌+率', parBetter: '标准杆或更好', birdie: '抓鸟率',
      par3: 'Par3 均杆', par4: 'Par4 均杆', par5: 'Par5 均杆',
      best: '最好成绩', worst: '最差成绩', hcp: '复算差点',
    },
    col: { date: '日期', course: '球场', holes: '洞', gross: '总杆', toPar: '+/-', diff: '差点值', fairway: '球道', gir: 'GIR', putts: '推杆', doublePlus: '双柏忌+', parBetter: 'Par+', hcp: '差点' },

    footer: '数据来源：Golfshot · 为未来 Garmin 数据预留接口',
  },

  ko: {
    title: '许多帕 데이터 조회 스테이션',
    subtitle: '许多帕의 골프 라이프사이클 데이터 · 임의 차원 × 다중 지표 · 홀 단위 정밀',
    back: '← 뒤로',

    range: '기간',
    rAll: '전체', rYTD: '올해', rHalf: '최근 6개월', r3m: '최근 3개월', r4w: '최근 4주', rCustom: '직접 설정',
    fCourse: '코스', fHoles: '홀 수',
    all: '전체', holes18: '18홀', holes9: '9홀',
    eligibleOnly: '핸디캡 적용만',
    courseSearch: '코스 검색…', courseAll: '전체 코스', selected: '{n}개 선택',
    reset: '초기화', exportCsv: 'CSV 내보내기',

    groupBy: '그룹화',
    metrics: '지표 (다중 선택, 겹쳐 표시)',
    chart: '차트', chartLine: '선', chartBar: '막대',
    table: '피벗 테이블', totalRow: '합계 / 평균', rowsShown: '{n}그룹 · {r}라운드',
    vsPrev: 'vs 직전 동일 기간',
    empty: '조건에 맞는 라운드가 없습니다. 필터를 완화해 보세요.',
    link: '원본',

    dim: {
      round: '라운드별', day: '일별', week: '주별', month: '월별',
      quarter: '분기별', year: '연도별', course: '코스별', venue: '홈/원정',
      holes: '홀수별', par: '파별',
    },
    dimCol: {
      round: '날짜', day: '날짜', week: '주', month: '월',
      quarter: '분기', year: '연도', course: '코스', venue: '장소',
      holes: '홀', par: '파',
    },
    homeLabel: '홈코스', awayLabel: '원정',
    secDiff: '난이도 분석', diffHint: '어려운 홀 = stroke index 1-6 · 중간 = 7-12 · 쉬운 홀 = 13-18; 값은 홀당 파 대비, 낮을수록 좋음',
    tHard: '어려운 홀', tMed: '중간 홀', tEasy: '쉬운 홀', perHole: '/홀',
    secHeat: '스코어카드 히트맵', heatHint: '각 행은 한 라운드, 각 칸은 홀별 파 대비; 오른쪽이 붉을수록 후반 9홀 붕괴',
    hEagle: '이글−', hBirdie: '버디', hPar: '파', hBogey: '보기', hDouble: '더블', hTriple: '+3 이상',
    meas: {
      count: '라운드', gross: '평균 타수', toPar: '평균 +/-', diff: '평균 디퍼런셜',
      fairway: '페어웨이', gir: 'GIR', puttsPerHole: '퍼팅/홀', puttsTotal: '총 퍼팅',
      doublePlus: '더블+ 비율', parBetter: '파 이상', birdie: '버디율',
      par3: 'Par3 평균', par4: 'Par4 평균', par5: 'Par5 평균',
      best: '베스트', worst: '워스트', hcp: '핸디캡',
    },
    col: { date: '날짜', course: '코스', holes: '홀', gross: '타수', toPar: '+/-', diff: '디퍼런셜', fairway: '페어웨이', gir: 'GIR', putts: '퍼팅', doublePlus: '더블+', parBetter: 'Par+', hcp: '핸디캡' },

    footer: '데이터 출처: Golfshot · 향후 Garmin 데이터 연동 대비',
  },

  en: {
    title: 'Xu Duopa’s Data Explorer',
    subtitle: 'Xu Duopa’s full-lifecycle golf data · any dimension × stacked metrics · hole-level',
    back: '← Back',

    range: 'Period',
    rAll: 'All', rYTD: 'YTD', rHalf: '6 mo', r3m: '3 mo', r4w: '4 wk', rCustom: 'Custom',
    fCourse: 'Course', fHoles: 'Holes',
    all: 'All', holes18: '18', holes9: '9',
    eligibleOnly: 'Handicap-eligible only',
    courseSearch: 'Search course…', courseAll: 'All courses', selected: '{n} selected',
    reset: 'Reset', exportCsv: 'Export CSV',

    groupBy: 'Group by',
    metrics: 'Metrics (multi-select, overlaid)',
    chart: 'Chart', chartLine: 'Line', chartBar: 'Bar',
    table: 'Pivot table', totalRow: 'Total / Avg', rowsShown: '{n} groups · {r} rounds',
    vsPrev: 'vs previous equal period',
    empty: 'No rounds match. Try loosening the filters.',
    link: 'Source',

    dim: {
      round: 'Per round', day: 'By day', week: 'By week', month: 'By month',
      quarter: 'By quarter', year: 'By year', course: 'By course', venue: 'Home/Away',
      holes: 'By holes', par: 'By par',
    },
    dimCol: {
      round: 'Date', day: 'Date', week: 'Week', month: 'Month',
      quarter: 'Quarter', year: 'Year', course: 'Course', venue: 'Venue',
      holes: 'Holes', par: 'Par',
    },
    homeLabel: 'Home', awayLabel: 'Away',
    secDiff: 'Difficulty Analysis', diffHint: 'Hard = stroke index 1-6 · Medium = 7-12 · Easy = 13-18; value is strokes over par per hole, lower is better',
    tHard: 'Hard holes', tMed: 'Medium', tEasy: 'Easy holes', perHole: '/hole',
    secHeat: 'Scorecard Heatmap', heatHint: 'Each row is a round, each cell a hole vs par; redder on the right = back-nine fade',
    hEagle: 'Eagle−', hBirdie: 'Birdie', hPar: 'Par', hBogey: 'Bogey', hDouble: 'Double', hTriple: '+3 or more',
    meas: {
      count: 'Rounds', gross: 'Avg Gross', toPar: 'Avg +/-', diff: 'Avg Diff',
      fairway: 'Fairways', gir: 'GIR', puttsPerHole: 'Putts/Hole', puttsTotal: 'Total Putts',
      doublePlus: 'Double+ %', parBetter: 'Par-or-better', birdie: 'Birdie %',
      par3: 'Par3 Avg', par4: 'Par4 Avg', par5: 'Par5 Avg',
      best: 'Best', worst: 'Worst', hcp: 'Handicap',
    },
    col: { date: 'Date', course: 'Course', holes: 'H', gross: 'Gross', toPar: '+/-', diff: 'Diff', fairway: 'FW', gir: 'GIR', putts: 'Putts', doublePlus: 'Dbl+', parBetter: 'Par+', hcp: 'HCP' },

    footer: 'Source: Golfshot · ready for future Garmin data',
  },
}

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function formatMonth(ym, lang) {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  const mi = parseInt(m, 10)
  if (lang === 'zh') return `${y}年${mi}月`
  if (lang === 'en') return `${EN_MONTHS[mi - 1]} ${y}`
  return `${y}.${m}`
}

export function fillTemplate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`))
}
