import { useState, useEffect, useRef } from 'react'
import HandicapPrompt from '../../components/HandicapPrompt'
import { supabase } from '../../lib/supabase'
import './style.css'

function calcExpected(rating, slope, handicap) {
  return rating + handicap * (slope / 113)
}

function getDevComment(dev) {
  if (dev <= -5) return '超级发挥！远超期望'
  if (dev <= -1) return '不错！比期望更好'
  if (dev <= 2) return '正常发挥，稳定就是进步'
  if (dev <= 5) return '略高于期望，可能有几个失误'
  if (dev <= 10) return '高于期望，检查一下OB和双柏忌'
  return '今天不是你的日子，但数据不会骗你，下次会更好'
}

function validateSubmission(data) {
  const errors = []
  if (!data.name || data.name.trim().length < 2) errors.push('球场名称至少2个字符')
  if (!data.city || data.city.trim().length < 1) errors.push('请输入城市')
  if (data.par < 60 || data.par > 78) errors.push('标准杆一般在60-78之间')
  if (data.rating < 55 || data.rating > 78) errors.push('Rating一般在55-78之间，请核实记分卡')
  if (data.slope < 55 || data.slope > 155) errors.push('Slope一般在55-155之间，请核实记分卡')
  return errors
}

function normalizeName(s) {
  return s.replace(/[\s\u3000·・\-_()（）]/g, '').toLowerCase()
}

export default function Expected({ handicap, setHandicap }) {
  // Course search
  const [courseName, setCourseName] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [searching, setSearching] = useState(false)
  const searchTimeout = useRef(null)

  // Inputs
  const [par, setPar] = useState(72)
  const [rating, setRating] = useState('')
  const [slope, setSlope] = useState('')

  // Post-round
  const [actualScore, setActualScore] = useState('')

  // Submit form
  const [showSubmit, setShowSubmit] = useState(false)
  const [submitCity, setSubmitCity] = useState('')
  const [submitName, setSubmitName] = useState('')
  const [submitPar, setSubmitPar] = useState(72)
  const [submitRating, setSubmitRating] = useState('')
  const [submitSlope, setSubmitSlope] = useState('')
  const [submitTee, setSubmitTee] = useState('')
  const [submitYardage, setSubmitYardage] = useState('')
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Education
  const [showEdu, setShowEdu] = useState(false)

  // Course count
  const [courseCount, setCourseCount] = useState(0)

  // Load course count on mount
  useEffect(() => {
    if (!supabase) return
    supabase.from('courses').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count != null) setCourseCount(count) })
  }, [])

  // Search courses
  useEffect(() => {
    if (!supabase || !courseName.trim()) {
      setSearchResults([])
      return
    }
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('courses')
        .select('*')
        .or(`name.ilike.%${courseName.trim()}%`)
        .in('status', ['verified', 'pending'])
        .limit(8)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(searchTimeout.current)
  }, [courseName])

  const selectCourse = (course) => {
    setSelectedCourse(course)
    setCourseName(course.name)
    setPar(course.par)
    setRating(String(course.rating))
    setSlope(String(course.slope))
    setSearchResults([])
  }

  const clearCourse = () => {
    setSelectedCourse(null)
    setCourseName('')
    setRating('')
    setSlope('')
    setPar(72)
  }

  // Calculate
  const ratingNum = parseFloat(rating)
  const slopeNum = parseInt(slope, 10)
  const hasResult = !isNaN(ratingNum) && !isNaN(slopeNum) && handicap !== null
  const expected = hasResult ? calcExpected(ratingNum, slopeNum, handicap) : null
  const expectedRounded = expected !== null ? Math.round(expected) : null
  const overPar = expectedRounded !== null ? expectedRounded - par : null

  // Post-round
  const actualNum = parseInt(actualScore, 10)
  const hasActual = hasResult && !isNaN(actualNum)
  const deviation = hasActual ? actualNum - expectedRounded : null

  // Submit handler
  const handleSubmit = async () => {
    const data = {
      name: submitName.trim(),
      city: submitCity.trim(),
      par: parseInt(submitPar, 10),
      rating: parseFloat(submitRating),
      slope: parseInt(submitSlope, 10),
    }
    const errors = validateSubmission(data)
    if (errors.length > 0) {
      setSubmitStatus('error')
      setSubmitMsg(errors.join('；'))
      return
    }
    if (!supabase) {
      setSubmitStatus('error')
      setSubmitMsg('数据库未连接，暂时无法提交')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('course_submissions').insert({
        course_name: data.name,
        city: data.city,
        par: data.par,
        rating: data.rating,
        slope: data.slope,
        tee: submitTee.trim() || null,
        yardage: parseInt(submitYardage, 10) || null,
      })
      if (error) throw error
      setSubmitStatus('success')
      setSubmitMsg('提交成功！感谢你帮助其他球友')
      setSubmitName('')
      setSubmitCity('')
      setSubmitPar(72)
      setSubmitRating('')
      setSubmitSlope('')
      setSubmitTee('')
      setSubmitYardage('')
    } catch (err) {
      setSubmitStatus('error')
      setSubmitMsg('提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (handicap === null) {
    return <HandicapPrompt onSet={setHandicap} />
  }

  return (
    <div className="exp-page">
      <h1 className="exp-title no-print">期望成绩计算器</h1>
      <p className="exp-sub no-print">差点 {handicap} · 在这个球场应该打多少杆</p>
      <p className="exp-desktop-hint no-print">推荐电脑端学习，建立策略直觉后带上球场</p>

      <div className="exp-layout">
        {/* 赛前计算 */}
        <section className="exp-section">
          <h2 className="exp-section-title">赛前：期望成绩</h2>

          <div className="exp-form">
            <div className="exp-field">
              <label className="exp-label">球场</label>
              <div className="exp-search-wrap">
                <input
                  type="text"
                  className="exp-input"
                  placeholder="输入球场名搜索，或手动填写下方数据"
                  value={courseName}
                  onChange={(e) => {
                    setCourseName(e.target.value)
                    if (selectedCourse) setSelectedCourse(null)
                  }}
                />
                {selectedCourse && (
                  <span className={`exp-badge ${selectedCourse.status === 'verified' ? 'verified' : 'pending'}`}>
                    {selectedCourse.status === 'verified' ? '已验证' : '待验证'}
                  </span>
                )}
                {selectedCourse && (
                  <button className="exp-clear-btn" onClick={clearCourse}>×</button>
                )}
              </div>
              {searchResults.length > 0 && !selectedCourse && (
                <div className="exp-dropdown">
                  {searchResults.map((c) => (
                    <div key={c.id} className="exp-dropdown-item" onClick={() => selectCourse(c)}>
                      <span className="exp-dropdown-name">{c.name}</span>
                      <span className="exp-dropdown-city">{c.city}{c.tee ? ` · ${c.tee}Tee` : ''}{c.yardage ? ` · ${c.yardage}码` : ''}</span>
                      <span className={`exp-dropdown-badge ${c.status}`}>
                        {c.status === 'verified' ? '已验证' : '待验证'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {searching && <div className="exp-searching">搜索中...</div>}
            </div>

            <div className="exp-row3">
              <div className="exp-field">
                <label className="exp-label">标准杆</label>
                <input
                  type="number"
                  className="exp-input"
                  value={par}
                  onChange={(e) => setPar(parseInt(e.target.value, 10) || 72)}
                />
              </div>
              <div className="exp-field">
                <label className="exp-label">Rating</label>
                <input
                  type="number"
                  className="exp-input"
                  step="0.1"
                  placeholder="如 66.5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                />
              </div>
              <div className="exp-field">
                <label className="exp-label">Slope</label>
                <input
                  type="number"
                  className="exp-input"
                  placeholder="如 118"
                  value={slope}
                  onChange={(e) => setSlope(e.target.value)}
                />
              </div>
            </div>
          </div>

          {hasResult && (
            <div className="exp-result-card">
              <div className="exp-result-label">你的期望成绩</div>
              <div className="exp-result-big">{expectedRounded}</div>
              <div className="exp-result-detail">
                标准杆{overPar >= 0 ? '+' : ''}{overPar} · 差点 {handicap}
              </div>
              <div className="exp-result-hint">
                打到{expectedRounded}杆就是正常发挥，低于{expectedRounded}就是超常发挥
              </div>
            </div>
          )}
        </section>

        {/* 赛后评估 */}
        {hasResult && (
          <section className="exp-section">
            <h2 className="exp-section-title">赛后：实际表现</h2>
            <div className="exp-form">
              <div className="exp-field">
                <label className="exp-label">实际打了</label>
                <div className="exp-actual-row">
                  <input
                    type="number"
                    className="exp-input exp-input-actual"
                    placeholder="输入总杆"
                    value={actualScore}
                    onChange={(e) => setActualScore(e.target.value)}
                  />
                  <span className="exp-actual-unit">杆</span>
                </div>
              </div>
            </div>

            {hasActual && (
              <div className={`exp-dev-card ${deviation <= 0 ? 'positive' : deviation <= 5 ? 'neutral' : 'negative'}`}>
                <div className="exp-dev-label">偏差</div>
                <div className="exp-dev-big">{deviation >= 0 ? '+' : ''}{deviation}</div>
                <div className="exp-dev-comment">{getDevComment(deviation)}</div>
              </div>
            )}
          </section>
        )}

        {/* 众包提交 */}
        <section className="exp-section">
          <button
            className="exp-submit-toggle"
            onClick={() => setShowSubmit(!showSubmit)}
          >
            {showSubmit ? '收起' : '提交球场数据，帮助其他球友'}
            <span className="exp-toggle-arrow">{showSubmit ? '▲' : '▼'}</span>
          </button>

          {showSubmit && (
            <div className="exp-submit-form">
              <div className="exp-row2">
                <div className="exp-field">
                  <label className="exp-label">球场名称</label>
                  <input
                    type="text"
                    className="exp-input"
                    placeholder="如：观澜湖世界杯球场"
                    value={submitName}
                    onChange={(e) => setSubmitName(e.target.value)}
                  />
                </div>
                <div className="exp-field">
                  <label className="exp-label">城市</label>
                  <input
                    type="text"
                    className="exp-input"
                    placeholder="如：深圳"
                    value={submitCity}
                    onChange={(e) => setSubmitCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="exp-row2">
                <div className="exp-field">
                  <label className="exp-label">Tee 台</label>
                  <select
                    className="exp-input"
                    value={submitTee}
                    onChange={(e) => setSubmitTee(e.target.value)}
                  >
                    <option value="">选择 Tee 台</option>
                    <option value="黑">黑 Tee</option>
                    <option value="蓝">蓝 Tee</option>
                    <option value="白">白 Tee</option>
                    <option value="金">金 Tee</option>
                    <option value="红">红 Tee</option>
                  </select>
                </div>
                <div className="exp-field">
                  <label className="exp-label">总码数</label>
                  <input
                    type="number"
                    className="exp-input"
                    placeholder="如 6800"
                    value={submitYardage}
                    onChange={(e) => setSubmitYardage(e.target.value)}
                  />
                </div>
              </div>
              <div className="exp-row3">
                <div className="exp-field">
                  <label className="exp-label">标准杆</label>
                  <input
                    type="number"
                    className="exp-input"
                    value={submitPar}
                    onChange={(e) => setSubmitPar(e.target.value)}
                  />
                </div>
                <div className="exp-field">
                  <label className="exp-label">Rating</label>
                  <input
                    type="number"
                    className="exp-input"
                    step="0.1"
                    placeholder="如 66.5"
                    value={submitRating}
                    onChange={(e) => setSubmitRating(e.target.value)}
                  />
                </div>
                <div className="exp-field">
                  <label className="exp-label">Slope</label>
                  <input
                    type="number"
                    className="exp-input"
                    placeholder="如 118"
                    value={submitSlope}
                    onChange={(e) => setSubmitSlope(e.target.value)}
                  />
                </div>
              </div>
              <button
                className="exp-submit-btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? '提交中...' : '提交'}
              </button>
              {submitStatus && (
                <div className={`exp-submit-msg ${submitStatus}`}>
                  {submitMsg}
                </div>
              )}
            </div>
          )}
        </section>

        {/* 教育内容 */}
        <section className="exp-section">
          <button
            className="exp-edu-toggle"
            onClick={() => setShowEdu(!showEdu)}
          >
            什么是 Rating 和 Slope？
            <span className="exp-toggle-arrow">{showEdu ? '▲' : '▼'}</span>
          </button>

          {showEdu && (
            <div className="exp-edu">
              <div className="exp-edu-block">
                <h3>Rating（球场难度评分）</h3>
                <p>
                  Rating代表差点0的球手在这个球场正常发挥的期望成绩，不是标准杆。
                  比如某球场标准杆72，Rating只有66.5——说明对零差点选手来说比72杆更容易。
                </p>
              </div>
              <div className="exp-edu-block">
                <h3>Slope（坡度值）</h3>
                <p>
                  Slope衡量球场对高差点球手的额外惩罚有多大。标准值是113，越高说明高差点球手越相对吃亏。
                </p>
                <p>
                  直觉理解：一个有很多树障、草深、水障碍的球场，对差点12的人影响不大，
                  对差点25的人可能直接多OB三次。这种难度放大效应就是Slope在衡量的。
                </p>
              </div>
              <div className="exp-edu-block">
                <h3>期望成绩公式</h3>
                <p className="exp-formula">期望成绩 = Rating + 差点 × (Slope ÷ 113)</p>
              </div>
              <div className="exp-edu-block">
                <h3>为什么不能跨球场比总杆</h3>
                <p>
                  同样差点19，在Slope 118的球场期望86杆，在Slope 144的球场期望98杆，差12杆。
                  朋友在简单球场打90，你在难球场打95，实际上你发挥更好。
                </p>
              </div>
              <div className="exp-edu-block">
                <h3>Rating和Slope在哪里找？</h3>
                <p>
                  记分卡上通常会印，或者问球场前台。不同Tee的Rating和Slope不同，用你打的那个Tee的数据。
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {supabase && courseCount > 0 && (
        <div className="exp-footer-stat">
          已收录 {courseCount} 个球场 · 数据由球友众包
        </div>
      )}
    </div>
  )
}
