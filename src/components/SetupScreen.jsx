import { useState } from 'react'
import { LANGUAGES } from '../data/vocabulary'
import { extractVideoId } from '../utils/helpers'
import { version } from '../../package.json'
import './SetupScreen.css'

const SUGGESTED = [
  { title: 'Baby Shark 🦈',        url: 'https://www.youtube.com/watch?v=XqZsoesa55w', id: 'XqZsoesa55w' },
  { title: 'Wheels on the Bus 🚌', url: 'https://www.youtube.com/watch?v=e_04ZrNroTo', id: 'e_04ZrNroTo' },
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

function SearchResult({ video, selected, onSelect }) {
  return (
    <button
      className={`search-result ${selected ? 'search-result--selected' : ''}`}
      onClick={onSelect}
      title={video.title}
    >
      <div className="search-result-thumb-wrap">
        <img
          className="search-result-thumb"
          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
          alt={video.title}
          loading="lazy"
        />
        {video.duration && (
          <span className="search-result-duration">{video.duration}</span>
        )}
        {selected && <div className="search-result-check">✓</div>}
      </div>
      <div className="search-result-info">
        <span className="search-result-title">{video.title}</span>
        <span className="search-result-channel">{video.channel}</span>
      </div>
    </button>
  )
}

export default function SetupScreen({ onStart, stats }) {
  const [url, setUrl]           = useState('')
  const [lang, setLang]         = useState('he')
  const [interval, setInterval] = useState(60)
  const [error, setError]       = useState('')

  const [searchQuery,   setSearchQuery]   = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchStatus,  setSearchStatus]  = useState('idle') // idle | loading | done | error

  const selectedId = extractVideoId(url)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearchStatus('loading')
    setSearchResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSearchResults(data)
      setSearchStatus(data.length ? 'done' : 'empty')
    } catch {
      setSearchStatus('error')
    }
  }

  const handleStart = () => {
    if (!extractVideoId(url)) {
      setError('Please enter a valid YouTube URL or video ID')
      return
    }
    setError('')
    onStart(url, lang, interval)
  }

  return (
    <div className="setup-screen">
      <div className="setup-hero">
        <div className="setup-hero-icons">🌟 📚 🎉</div>
        <h1 className="setup-title">English Adventure</h1>
        <p className="setup-subtitle">Watch videos and learn English words — it's a game!</p>
      </div>

      <div className="setup-card">

        {/* ── Search ── */}
        <div className="setup-section">
          <label className="setup-label">🔍 Search videos with captions</label>
          <form className="search-bar" onSubmit={handleSearch}>
            <input
              className="search-input"
              type="text"
              placeholder="e.g. animals for kids, colors song…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="search-btn"
              disabled={searchStatus === 'loading'}
            >
              {searchStatus === 'loading' ? '…' : '🔍'}
            </button>
          </form>

          {searchStatus === 'error' && (
            <p className="search-error">Search failed — check your connection and try again.</p>
          )}
          {searchStatus === 'empty' && (
            <p className="search-error">No results found. Try different keywords.</p>
          )}

          {searchResults.length > 0 && (
            <div className="search-results-grid">
              {searchResults.map(video => (
                <SearchResult
                  key={video.id}
                  video={video}
                  selected={selectedId === video.id}
                  onSelect={() => setUrl(`https://www.youtube.com/watch?v=${video.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Manual URL ── */}
        <div className="setup-section">
          <label className="setup-label">🎬 YouTube Video URL</label>
          <input
            className="setup-input"
            type="text"
            placeholder="Or paste a YouTube link here…"
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

        {/* ── Language ── */}
        <div className="setup-section">
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

        {/* ── Frequency ── */}
        <div className="setup-section">
          <label className="setup-label">⏱ Challenge every…</label>
          <div className="interval-grid">
            {[
              { label: '30 sec', val: 30  },
              { label: '1 min',  val: 60  },
              { label: '2 min',  val: 120 },
              { label: '5 min',  val: 300 },
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

        {stats?.total > 0 && (
          <div className="setup-dict-stats">
            📚 {stats.total} word{stats.total !== 1 ? 's' : ''} learned
            {stats.mastered > 0 && ` · ⭐ ${stats.mastered} mastered`}
          </div>
        )}

        <button className="start-btn" onClick={handleStart}>
          🚀 Start Learning!
        </button>

        <p className="app-version">v{version}</p>
      </div>
    </div>
  )
}
