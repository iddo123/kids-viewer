import './DictionaryView.css'

const LEVELS = [
  { label: 'New',      color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  { label: 'Seen',     color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  { label: 'Learning', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)'  },
  { label: 'Mastered', color: '#34d399', bg: 'rgba(52,211,153,0.15)'  },
]

function level(entry) {
  if (!entry) return 0
  if (entry.timesCorrect >= 3) return 3
  if (entry.timesCorrect >= 1) return 2
  if (entry.timesWrong   >  0) return 1
  return 0
}

export default function DictionaryView({ dictionary, onClose }) {
  const entries = Object.entries(dictionary)
    .sort((a, b) => (b[1].lastSeen || 0) - (a[1].lastSeen || 0))

  return (
    <div className="dict-overlay" onClick={onClose}>
      <div className="dict-modal" onClick={e => e.stopPropagation()}>
        <div className="dict-header">
          <span className="dict-title">📚 My Dictionary</span>
          <span className="dict-count">{entries.length} words</span>
          <button className="dict-close" onClick={onClose}>✕</button>
        </div>

        {entries.length === 0 ? (
          <div className="dict-empty">
            <div className="dict-empty-icon">🌱</div>
            <p>No words yet — watch a video to start learning!</p>
          </div>
        ) : (
          <div className="dict-list">
            {entries.map(([word, entry]) => {
              const lvl = LEVELS[level(entry)]
              return (
                <div className="dict-entry" key={word}>
                  <span className="dict-word">{word}</span>
                  <span className="dict-level-badge" style={{ color: lvl.color, background: lvl.bg }}>
                    {lvl.label}
                  </span>
                  <span className="dict-stats">
                    <span className="dict-correct">✓{entry.timesCorrect}</span>
                    <span className="dict-wrong">✗{entry.timesWrong}</span>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
