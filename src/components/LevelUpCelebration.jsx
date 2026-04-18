import { useEffect } from 'react'
import './LevelUpCelebration.css'

function Confetti() {
  const items = Array.from({ length: 28 })
  const shapes  = ['⭐','🌟','✨','💫','🎉','🎊','🏅']
  return (
    <div className="confetti-wrap" aria-hidden>
      {items.map((_, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            '--x':     `${Math.random() * 100}%`,
            '--dy':    `${-(100 + Math.random() * 140)}px`,
            '--delay': `${Math.random() * 0.5}s`,
            '--size':  `${1.2 + Math.random() * 1.6}rem`,
            '--rot':   `${Math.random() * 720}deg`,
          }}
        >
          {shapes[Math.floor(Math.random() * shapes.length)]}
        </span>
      ))}
    </div>
  )
}

const LEVEL_CONFIG = {
  2: {
    icon:     '⭐',
    title:    'Level Up!',
    subtitle: 'Great job — keep practising!',
    stars:    2,
    color:    '#4ECDC4',
  },
  3: {
    icon:     '🏆',
    title:    'Word Mastered!',
    subtitle: 'Amazing — you know this word!',
    stars:    3,
    color:    '#F9CA24',
  },
}

export default function LevelUpCelebration({ word, level, onDone }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG[2]

  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className="levelup-overlay" onClick={onDone}>
      <Confetti />
      <div className="levelup-card" style={{ '--accent': cfg.color }}>
        <div className="levelup-icon">{cfg.icon}</div>
        <div className="levelup-title">{cfg.title}</div>
        <div className="levelup-word">"{word}"</div>
        <div className="levelup-stars-row">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`levelup-star ${i < cfg.stars ? 'filled' : 'empty'}`}
              style={{ '--si': i }}
            >⭐</span>
          ))}
        </div>
        <div className="levelup-subtitle">{cfg.subtitle}</div>
        <div className="levelup-tap">tap to continue</div>
      </div>
    </div>
  )
}
