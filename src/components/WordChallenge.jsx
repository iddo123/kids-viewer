import { useState, useEffect } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { checkPronunciation } from '../utils/helpers'
import { LANGUAGES } from '../data/vocabulary'
import './WordChallenge.css'

// Palette of bright kid-friendly gradients
const GRADIENTS = [
  ['#ff6b6b','#feca57'], ['#48dbfb','#ff9ff3'], ['#1dd1a1','#f9ca24'],
  ['#a29bfe','#fd79a8'], ['#fdcb6e','#e17055'], ['#55efc4','#74b9ff'],
]
function strHash(s) { return s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) }

// Animated word illustration for transcript words not in the vocab database
function WordArt({ word }) {
  const [g1, g2] = GRADIENTS[Math.abs(strHash(word)) % GRADIENTS.length]
  const letters = word.split('')
  return (
    <div className="word-art" style={{ '--c1': g1, '--c2': g2 }}>
      {letters.map((ch, i) => (
        <span
          key={i}
          className="word-art-letter"
          style={{ '--i': i, '--n': letters.length }}
        >
          {ch}
        </span>
      ))}
    </div>
  )
}

const MAX_ATTEMPTS = 3

// Floating star particles for celebration
function Stars() {
  return (
    <div className="stars-wrap" aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="star-particle"
          style={{
            '--x': `${Math.random() * 100}%`,
            '--dy': `${-(80 + Math.random() * 120)}px`,
            '--delay': `${Math.random() * 0.4}s`,
            '--size': `${1 + Math.random() * 1.4}rem`,
          }}
        >
          {['⭐','🌟','✨','💫'][Math.floor(Math.random() * 4)]}
        </span>
      ))}
    </div>
  )
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function WordChallenge({ wordEntry, language, onSuccess, onSkip }) {
  const [phase, setPhase] = useState('show')   // show | listen | success | fail | answer
  const [attempts, setAttempts] = useState(0)
  const [spokenText, setSpokenText] = useState('')
  const [typedText, setTypedText] = useState('')
  const [useTypeMode, setUseTypeMode] = useState(false)
  const { listening, error: micError, startListening, stopListening, supported } = useSpeechRecognition()

  const langInfo = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  const translation = wordEntry.translations[language] || wordEntry.word
  const pointsForAttempt = [100, 50, 25]
  const points = pointsForAttempt[Math.min(attempts, 2)]

  // Speak the word aloud using TTS
  const speakWord = () => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(wordEntry.word)
    utt.lang = 'en-US'
    utt.rate = 0.85
    window.speechSynthesis.speak(utt)
  }

  useEffect(() => { speakWord() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Shared result handler — used by both speech and type paths
  function handleAnswer(text) {
    const correct = checkPronunciation(text, wordEntry.word)
    if (correct) {
      setPhase('success')
      setTimeout(() => onSuccess(attempts === 0 ? 100 : attempts === 1 ? 50 : 25, attempts), 2200)
    } else {
      const nextAttempts = attempts + 1
      setAttempts(nextAttempts)
      if (nextAttempts >= MAX_ATTEMPTS) {
        setPhase('answer')
        setTimeout(() => onSkip(), 3500)
      } else {
        setPhase('fail')
        setTimeout(() => { setPhase('show'); setTypedText('') }, 1800)
      }
    }
  }

  const handleListen = () => {
    if (listening) { stopListening(); return }
    setPhase('listen')
    startListening((spoken) => {
      setSpokenText(spoken)
      handleAnswer(spoken)
    })
  }

  const handleTypeSubmit = (e) => {
    e.preventDefault()
    if (!typedText.trim()) return
    setSpokenText(typedText)
    handleAnswer(typedText)
  }

  return (
    <div className="challenge-overlay">
      <div className={`challenge-card ${phase}`}>

        {/* Header */}
        <div className="challenge-header">
          <span className="challenge-badge">🎓 New Word!</span>
          <span className="attempt-dots">
            {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
              <span key={i} className={`attempt-dot ${i < attempts ? 'used' : ''}`} />
            ))}
          </span>
        </div>
        {wordEntry.foundAtSec != null && (
          <div className="found-at-badge">⏱ Spotted at {formatTime(wordEntry.foundAtSec)}</div>
        )}

        {/* Word */}
        <div className="challenge-word">
          <span>{wordEntry.word}</span>
          <button className="speak-btn" onClick={speakWord} title="Hear it again">
            🔊
          </button>
        </div>

        {/* Visual: large emoji for vocab words, animated word-art for dynamic */}
        <div className="challenge-image-wrap">
          {!wordEntry.isDynamic ? (
            <div className="challenge-emoji-large">{wordEntry.emoji}</div>
          ) : (
            <WordArt word={wordEntry.word} />
          )}
        </div>

        {/* Translation */}
        <div className="challenge-translation">
          <span className="lang-flag-lg">{langInfo.flag}</span>
          <span className="translation-text" dir="auto">{translation}</span>
        </div>

        {/* Feedback area */}
        {phase === 'success' && (
          <div className="feedback feedback--success">
            <Stars />
            <div className="feedback-text">
              🎉 Amazing! <span className="points-badge">+{points} pts</span>
            </div>
          </div>
        )}
        {phase === 'fail' && (
          <div className="feedback feedback--fail">
            <div className="feedback-text">
              😅 Try again! {attempts < MAX_ATTEMPTS && `(${MAX_ATTEMPTS - attempts} left)`}
            </div>
            {spokenText && <div className="heard-text">I heard: <em>"{spokenText}"</em></div>}
          </div>
        )}
        {phase === 'answer' && (
          <div className="feedback feedback--answer">
            <div className="feedback-text">The word is: <strong>{wordEntry.word}</strong></div>
            <div className="heard-text">Continuing in a moment…</div>
          </div>
        )}

        {/* Mic / type section */}
        {(phase === 'show' || phase === 'listen') && (
          <div className="mic-section">
            {/* Type-it mode — shown when mic denied OR user switches manually */}
            {(useTypeMode || micError === 'not-allowed' || !supported) ? (
              <>
                <p className="mic-prompt">Type the word! ⌨️</p>
                <form className="type-form" onSubmit={handleTypeSubmit}>
                  <input
                    className="type-input"
                    type="text"
                    value={typedText}
                    onChange={e => setTypedText(e.target.value)}
                    placeholder={wordEntry.word.replace(/./g, '_ ')}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button type="submit" className="type-submit-btn">✓ Check</button>
                </form>
                {supported && micError !== 'not-allowed' && (
                  <button className="switch-mode-btn" onClick={() => { setUseTypeMode(false); setTypedText('') }}>
                    🎤 Switch to voice
                  </button>
                )}
              </>
            ) : (
              <>
                <p className="mic-prompt">Now you say it! 🎤</p>
                {micError && micError !== 'no-speech' ? (
                  <p className="mic-unsupported">⚠️ Mic error: {micError}
                    <button className="switch-mode-btn" onClick={() => setUseTypeMode(true)}>Type instead</button>
                  </p>
                ) : (
                  <>
                    <button
                      className={`mic-btn ${listening ? 'mic-btn--listening' : ''}`}
                      onClick={handleListen}
                    >
                      {listening
                        ? <><span className="mic-pulse" />🎙 Listening…</>
                        : '🎤 Tap & Speak'}
                    </button>
                    <button className="switch-mode-btn" onClick={() => setUseTypeMode(true)}>
                      ⌨️ Type instead
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Skip */}
        {phase !== 'success' && phase !== 'answer' && (
          <button className="skip-btn" onClick={onSkip}>
            Skip for now →
          </button>
        )}
      </div>
    </div>
  )
}
