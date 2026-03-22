import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import GtoMatrix from './tools/GtoMatrix'
import Dispersion from './tools/Dispersion'
import Putting from './tools/Putting'

function App() {
  const [handicap, setHandicap] = useState(() => {
    const saved = localStorage.getItem('golf_handicap')
    return saved !== null ? parseInt(saved, 10) : null
  })

  useEffect(() => {
    if (handicap !== null) {
      localStorage.setItem('golf_handicap', handicap)
    }
  }, [handicap])

  return (
    <Layout handicap={handicap} setHandicap={setHandicap}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gto" element={<GtoMatrix handicap={handicap} setHandicap={setHandicap} />} />
        <Route path="/dispersion" element={<Dispersion handicap={handicap} setHandicap={setHandicap} />} />
        <Route path="/putting" element={<Putting handicap={handicap} setHandicap={setHandicap} />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Layout>
  )
}

export default App
