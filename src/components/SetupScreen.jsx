import { useState } from 'react'
import { LANGUAGES } from '../data/vocabulary'
import { extractVideoId } from '../utils/helpers'
import './SetupScreen.css'

// Tip: to add more videos, paste any YouTube URL into this array.
// Find the video on YouTube, copy the URL, and add it here in the same format.
const SUGGESTED = [
  { title: 'Baby Shark 🦈',         url: 'https://www.youtube.com/watch?v=XqZsoesa55w', id: 'XqZsoesa55w' },
  { title: 'Wheels on the Bus 🚌',  url: 'https://www.youtube.com/watch?v=e_04ZrNroTo', id: 'e_04ZrNroTo' },
]

function VideoThumb({ id, title, selected, onClick }) {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <button
      className={`thumb-btn ${selected ? 'thumb-btn--selected' : ''}`}
      onClick={onClick}
      title={title}
    >
      <div className="thumb-img-wrap">
        {imgFailed ? (
          <div className="thumb-img thumb-img--fallback">🎬</div>
        ) : (
          <img
            className="thumb-img"
            src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        )}
        <div className="thumb-play">▶</div>
        {selected && <div className="thumb-check">✓</div>}
      </div>
      <span className="thumb-title">{title}</span>
    </button>
  )
}

export default function SetupScreen({ onStart }) {
  const [url, setUrl] = useState('')
  const [lang, setLang] = useState('he')
  const [interval, setInterval] = useState(300)
  const [error, setError] = useState('')

  const handleStart = () => {
    if (!extractVideoId(url)) {
      setError('Please enter a valid YouTube URL or video ID')
      return
    }
    setError('')
    onStart(url, lang)
  }

  return (
    <div className="setup-screen">
      <div className="setup-hero">
        <div className="setup-hero-icons">🌟 📚 🎉</div>
        <h1 className="setup-title">English Adventure</h1>
        <p className="setup-subtitle">Watch videos and learn English words — it's a game!</p>
      </div>

      <div className="setup-card">
        <div className="setup-section">
          <label className="setup-label">🎬 YouTube Video URL</label>
          <input
            className="setup-input"
            type="text"
            placeholder="Paste a YouTube link here…"
            value={url}
            onChange={e => { setUrl(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleStart()}
          />
          {error && <p className="setup-error">{error}</p>}

          <div className="suggested-label">Or pick one of these:</div>
          <div className="thumb-grid">
            {SUGGESTED.map(s => (
              <VideoThumb
                key={s.id}
                id={s.id}
                title={s.title}
                selected={url === s.url}
                onClick={() => setUrl(s.url)}
              />
            ))}
          </div>
        </div>

        <div className="setup-row">
          <div className="setup-section setup-section--half">
            <label className="setup-label">🌍 My Language</label>
            <div className="lang-grid">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`lang-btn ${lang === l.code ? 'lang-btn--active' : ''}`}
                  onClick={() => setLang(l.code)}
                >
                  <span className="lang-flag">{l.flag}</span>
                  <span className="lang-name">{l.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="setup-section setup-section--half">
            <label className="setup-label">⏱ Challenge every…</label>
            <div className="interval-grid">
              {[
                { label: '1 min',  val: 60  },
                { label: '2 min',  val: 120 },
                { label: '5 min',  val: 300 },
                { label: '10 min', val: 600 },
              ].map(opt => (
                <button
                  key={opt.val}
                  className={`interval-btn ${interval === opt.val ? 'interval-btn--active' : ''}`}
                  onClick={() => setInterval(opt.val)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button className="start-btn" onClick={handleStart}>
          🚀 Start Learning!
        </button>
      </div>
    </div>
  )
}
