import { useState, useRef } from 'react'
import { LANGUAGES } from '../data/vocabulary'
import { extractVideoId } from '../utils/helpers'
import { version } from '../../package.json'
import AccountMenu from './AccountMenu'
import './SetupScreen.css'

const SEARCH_SUGGESTIONS = [
  'animals for kids', 'farm animals for children', 'ocean animals', 'jungle animals', 'dinosaurs for kids',
  'abc alphabet song', 'phonics song for kids', 'counting numbers', 'shapes for kids', 'colors song',
  'wheels on the bus', 'baby shark', 'nursery rhymes', 'finger family', 'old macdonald had a farm',
  'learn english for kids', 'english words for children', 'simple english stories',
  'fruits and vegetables', 'food in english', 'body parts for kids', 'clothes in english',
  'weather for kids', 'days of the week', 'months of the year', 'seasons for children',
  'emotions and feelings', 'opposites for kids', 'action words for children',
  'transport for kids', 'vehicles for children', 'space for kids', 'underwater world',
  'sports for kids', 'playground activities', 'classroom objects', 'school vocabulary',
]

const SUGGESTED = [
  { title: 'Peppa Pig 🐷',         url: 'https://www.youtube.com/watch?v=I9-FpvBSN-o', id: 'I9-FpvBSN-o' },
  { title: 'Bluey 🐶',             url: 'https://www.youtube.com/watch?v=61fSXCbzF1M', id: '61fSXCbzF1M' },
  { title: 'Paw Patrol 🐾',        url: 'https://www.youtube.com/watch?v=7FIDxRudCiA', id: '7FIDxRudCiA' },
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

export default function SetupScreen({ onStart, stats, onHelpOpen, onPrivacyOpen }) {
  const [url, setUrl]           = useState('')
  const [lang, setLang]         = useState('he')
  const [interval, setInterval] = useState(60)
  const [error, setError]       = useState('')
  const [skipSpeech, setSkipSpeech] = useState(() => {
    try { return localStorage.getItem('kids_viewer_skip_speech') === '1' } catch { return false }
  })

  const toggleSkipSpeech = (checked) => {
    setSkipSpeech(checked)
    try { localStorage.setItem('kids_viewer_skip_speech', checked ? '1' : '0') } catch {}
  }

  const [searchQuery,     setSearchQuery]     = useState('')
  const [searchResults,   setSearchResults]   = useState([])
  const [searchStatus,    setSearchStatus]    = useState('idle') // idle | loading | done | error
  const [suggestions,     setSuggestions]     = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestion, setActiveSuggestion] = useState(-1)

  const selectedId = extractVideoId(url)

  const runSearch = async (q) => {
    const query = q.trim()
    if (!query) return
    setShowSuggestions(false)
    setSearchStatus('loading')
    setSearchResults([])
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setSearchResults(data)
      setSearchStatus(data.length ? 'done' : 'empty')
    } catch {
      setSearchStatus('error')
    }
  }

  const handleSearch = (e) => { e.preventDefault(); runSearch(searchQuery) }

  const suggestTimer = useRef(null)

  const handleQueryChange = (e) => {
    const val = e.target.value
    setSearchQuery(val)
    setActiveSuggestion(-1)
    clearTimeout(suggestTimer.current)
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(val)}`)
        if (!res.ok) throw new Error()
        const items = (await res.json()).slice(0, 8)
        if (items.length) { setSuggestions(items); setShowSuggestions(true); return }
      } catch {}
      // fallback: filter curated list by word-start match
      const q = val.toLowerCase()
      const filtered = SEARCH_SUGGESTIONS
        .filter(s => s.startsWith(q) || s.split(' ').some(w => w.startsWith(q)))
        .slice(0, 8)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    }, 250)
  }

  const handleInputKeyDown = (e) => {
    if (!showSuggestions) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion(prev => Math.min(prev + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion(prev => Math.max(prev - 1, -1))
    } else if (e.key === 'Escape') {
      setShowSuggestions(false); setActiveSuggestion(-1)
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault()
      const chosen = suggestions[activeSuggestion]
      setSearchQuery(chosen); setSuggestions([]); setShowSuggestions(false)
      runSearch(chosen)
    }
  }

  const pickSuggestion = (s) => {
    setSearchQuery(s); setSuggestions([]); setShowSuggestions(false)
    runSearch(s)
  }

  const handleStart = () => {
    if (!extractVideoId(url)) {
      setError('Please enter a valid YouTube URL or video ID')
      return
    }
    setError('')
    onStart(url, lang, interval, skipSpeech)
  }

  return (
    <div className="setup-screen">
      <div className="setup-topbar">
        <button className="help-btn" onClick={onHelpOpen} title="How to play" aria-label="Help">
          ❓ Help
        </button>
        <AccountMenu />
      </div>
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
            <div className="search-input-wrap">
              <input
                className={`search-input${showSuggestions ? ' search-input--open' : ''}`}
                type="text"
                placeholder="e.g. animals for kids, colors song…"
                value={searchQuery}
                onChange={handleQueryChange}
                onKeyDown={handleInputKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                autoComplete="off"
              />
              {showSuggestions && (
                <ul className="search-suggestions">
                  {suggestions.map((s, i) => (
                    <li
                      key={s}
                      className={`search-suggestion${i === activeSuggestion ? ' search-suggestion--active' : ''}`}
                      onMouseDown={() => pickSuggestion(s)}
                    >
                      <span className="search-suggestion-icon">🔍</span>
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

        {/* ── Speaking toggle ── */}
        <div className="setup-section">
          <label className="skip-speech-toggle">
            <input
              type="checkbox"
              checked={skipSpeech}
              onChange={e => toggleSkipSpeech(e.target.checked)}
            />
            <span className="skip-speech-text">
              <span className="skip-speech-title">🖼️ Skip speaking — pictures only</span>
              <span className="skip-speech-hint">
                For kids without a microphone or who'd rather not talk. Challenges go
                straight to tapping the right picture.
              </span>
            </span>
          </label>
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

        <div className="setup-footer">
          <p className="app-version">v{version}</p>
          <button className="privacy-link" onClick={onPrivacyOpen}>🔒 Privacy</button>
        </div>
      </div>
    </div>
  )
}
