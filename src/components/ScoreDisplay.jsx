import { useEffect, useRef, useState } from 'react'
import { scoreToLevel } from '../utils/helpers'
import './ScoreDisplay.css'

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)

  useEffect(() => {
    if (value === prevRef.current) return
    const start = prevRef.current
    const end = value
    const duration = 600
    const startTime = performance.now()
    const animate = (now) => {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + (end - start) * eased))
      if (t < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
    prevRef.current = value
  }, [value])

  return <span>{display}</span>
}

export default function ScoreDisplay({ score, streak, onBack, dictCount, onDictOpen, onHelpOpen }) {
  const { level, title, icon, next } = scoreToLevel(score)
  const progress = next ? (score / next) * 100 : 100

  return (
    <div className="score-bar">
      <button className="back-btn" onClick={onBack} title="Back to setup">
        ← Back
      </button>

      <div className="score-item">
        <span className="score-icon">⭐</span>
        <span className="score-label">Score</span>
        <span className="score-value"><AnimatedNumber value={score} /></span>
      </div>

      <div className="score-item level-item">
        <span className="score-icon">{icon}</span>
        <div className="level-info">
          <span className="score-label">Level {level} · {title}</span>
          <div className="level-bar-wrap">
            <div className="level-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="score-item streak-item">
        <span className="score-icon">🔥</span>
        <span className="score-label">Streak</span>
        <span className={`score-value streak-val ${streak >= 3 ? 'hot' : ''}`}>
          <AnimatedNumber value={streak} />
        </span>
      </div>

      <button className="dict-btn" onClick={onDictOpen}>
        📚 {dictCount} word{dictCount !== 1 ? 's' : ''}
      </button>

      <button className="help-icon-btn" onClick={onHelpOpen} title="How to play" aria-label="Help">
        ❓
      </button>
    </div>
  )
}
