import { useState, useEffect, useRef } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { checkPronunciation } from '../utils/helpers'
import { LANGUAGES } from '../data/vocabulary'
import { sleep, speakAndWait, cancelSpeech, playBeep, LANG_TTS } from '../utils/tts'
import './WordChallenge.css'

// ── Word-art (English) ────────────────────────────────────────────────────────
const GRADIENTS = [
  ['#ff6b6b','#feca57'], ['#48dbfb','#ff9ff3'], ['#1dd1a1','#f9ca24'],
  ['#a29bfe','#fd79a8'], ['#fdcb6e','#e17055'], ['#55efc4','#74b9ff'],
]
function strHash(s) { return s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) }

function WordArt({ word }) {
  const [g1, g2] = GRADIENTS[Math.abs(strHash(word)) % GRADIENTS.length]
  const letters = word.split('')
  return (
    <div className="word-art" style={{ '--c1': g1, '--c2': g2 }}>
      {letters.map((ch, i) => (
        <span key={i} className="word-art-letter" style={{ '--i': i, '--n': letters.length }}>
          {ch}
        </span>
      ))}
    </div>
  )
}

// ── Translation art ───────────────────────────────────────────────────────────
function TranslationArt({ word, language }) {
  const [g1, g2] = GRADIENTS[(Math.abs(strHash(word)) + 2) % GRADIENTS.length]
  const isRTL = ['he', 'ar'].includes(language)
  return (
    <div className="translation-art" style={{ '--c1': g1, '--c2': g2 }} dir={isRTL ? 'rtl' : 'ltr'}>
      <span className="translation-art-text">{word}</span>
    </div>
  )
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars() {
  return (
    <div className="stars-wrap" aria-hidden>
      {Array.from({ length: 16 }).map((_, i) => (
        <span key={i} className="star-particle" style={{
          '--x':     `${Math.random() * 100}%`,
          '--dy':    `${-(80 + Math.random() * 120)}px`,
          '--delay': `${Math.random() * 0.4}s`,
          '--size':  `${1 + Math.random() * 1.4}rem`,
        }}>{['⭐','🌟','✨','💫'][Math.floor(Math.random() * 4)]}</span>
      ))}
    </div>
  )
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
}

const MAX_ATTEMPTS      = 3
const CHALLENGE_TIMEOUT = 15   // seconds before auto-skip

// ── Component ─────────────────────────────────────────────────────────────────
export default function WordChallenge({ wordEntry, language, onSuccess, onSkip }) {
  const { error: micError, startListening, supported } = useSpeechRecognition()

  // Always start at 'presenting' — card shows, then TTS plays
  const [phase, setPhase]           = useState('presenting')
  const [spokenText, setSpokenText] = useState('')
  const [typedText, setTypedText]   = useState('')
  const [useTypeMode, setUseTypeMode] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(CHALLENGE_TIMEOUT)
  const attemptsRef = useRef(0)
  const [attempts, setAttempts]     = useState(0)
  const cancelRef   = useRef(false)

  const langInfo    = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  const translation = wordEntry.translations?.[language] || wordEntry.word
  const ttsLocale   = LANG_TTS[language] || language

  const canUseMic = supported && !useTypeMode && micError !== 'not-allowed'

  // ── Presentation: speak word → translation → beep → listen ───────────────
  useEffect(() => {
    if (phase !== 'presenting') return
    cancelRef.current = false

    async function present() {
      // Cancel any lingering speech first, then give engine a moment to settle
      cancelSpeech()
      await sleep(100)

      if (cancelRef.current) return
      console.log(`[tts] speaking word: "${wordEntry.word}" (en-US)`)
      await speakAndWait(wordEntry.word, 'en-US')

      if (cancelRef.current) return
      console.log(`[tts] speaking translation: "${translation}" (${ttsLocale})`)
      await speakAndWait(translation, ttsLocale)

      if (cancelRef.current) return
      playBeep()
      await sleep(150)

      if (cancelRef.current) return
      setPhase(canUseMic ? 'listening' : 'typing')
    }

    present()
    return () => {
      cancelRef.current = true
      cancelSpeech()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-start mic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'listening') return
    startListening((spoken) => {
      setSpokenText(spoken)
      handleAnswer(spoken)
    })
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mic error → fall back to typing ──────────────────────────────────────
  useEffect(() => {
    if (phase === 'listening' && micError && micError !== 'no-speech') {
      setUseTypeMode(true)
      setPhase('typing')
    }
  }, [micError, phase])

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'listening' && phase !== 'typing') return
    setTimeLeft(CHALLENGE_TIMEOUT)
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(id); handleSkip(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Answer ────────────────────────────────────────────────────────────────
  function handleAnswer(text) {
    const correct = checkPronunciation(text, wordEntry.word)
    if (correct) {
      setPhase('success')
      const pts = attemptsRef.current === 0 ? 100 : attemptsRef.current === 1 ? 50 : 25
      setTimeout(() => onSuccess(pts), 2200)
    } else {
      attemptsRef.current += 1
      setAttempts(attemptsRef.current)
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setPhase('answer')
        setTimeout(() => onSkip(), 3500)
      } else {
        setPhase('fail')
        setTimeout(() => { setTypedText(''); setPhase('presenting') }, 1600)
      }
    }
  }

  const handleTypeSubmit = (e) => {
    e.preventDefault()
    if (!typedText.trim()) return
    setSpokenText(typedText)
    handleAnswer(typedText)
  }

  const handleSkip = () => {
    cancelRef.current = true
    cancelSpeech()
    onSkip()
  }

  // ── Countdown ring colour ─────────────────────────────────────────────────
  const timerFraction = timeLeft / CHALLENGE_TIMEOUT
  const timerColor = timerFraction > 0.5 ? '#4ECDC4'
                   : timerFraction > 0.25 ? '#fdcb6e'
                   : '#FCA5A5'

  // ── Render ────────────────────────────────────────────────────────────────
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

        {/* English word */}
        <div className="challenge-word">
          <span>{wordEntry.word}</span>
        </div>

        {/* English visual */}
        <div className="challenge-image-wrap">
          {!wordEntry.isDynamic
            ? <div className="challenge-emoji-large">{wordEntry.emoji}</div>
            : <WordArt word={wordEntry.word} />
          }
        </div>

        {/* Translation art + flag */}
        <div className="challenge-translation-wrap">
          <span className="lang-flag-lg">{langInfo.flag}</span>
          <TranslationArt word={translation} language={language} />
        </div>

        {/* Feedback */}
        {phase === 'success' && (
          <div className="feedback feedback--success">
            <Stars />
            <div className="feedback-text">
              🎉 Amazing!
              <span className="points-badge">
                +{attemptsRef.current === 0 ? 100 : attemptsRef.current === 1 ? 50 : 25} pts
              </span>
            </div>
          </div>
        )}
        {phase === 'fail' && (
          <div className="feedback feedback--fail">
            <div className="feedback-text">
              😅 Try again! {attemptsRef.current < MAX_ATTEMPTS && `(${MAX_ATTEMPTS - attemptsRef.current} left)`}
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

        {/* Activity section */}
        {(phase === 'presenting' || phase === 'listening' || phase === 'typing') && (
          <div className="activity-section">

            {/* Countdown ring (only during active response phases) */}
            {(phase === 'listening' || phase === 'typing') && (
              <div className="countdown-wrap">
                <svg className="countdown-ring" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke={timerColor} strokeWidth="3"
                    strokeDasharray={`${timerFraction * 100} 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                    style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.3s' }}
                  />
                </svg>
                <span className="countdown-number" style={{ color: timerColor }}>{timeLeft}</span>
              </div>
            )}

            {phase === 'typing' ? (
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
                {canUseMic && (
                  <button className="switch-mode-btn" onClick={() => { setUseTypeMode(false); setPhase('presenting') }}>
                    🎤 Switch to voice
                  </button>
                )}
              </>
            ) : phase === 'listening' ? (
              <>
                <p className="mic-prompt">Your turn! 🎤</p>
                <div className="listening-ring">🎙</div>
                <button className="switch-mode-btn" onClick={() => { setUseTypeMode(true); setPhase('typing') }}>
                  ⌨️ Type instead
                </button>
              </>
            ) : (
              /* presenting */
              <>
                <p className="mic-prompt">
                  {attemptsRef.current === 0 ? 'Listen carefully…' : 'Listen again…'}
                </p>
                <div className="speaking-indicator" aria-label="Speaking">
                  {[0,1,2].map(i => <span key={i} className="speaking-bar" style={{ '--bi': i }} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Skip */}
        {phase !== 'success' && phase !== 'answer' && (
          <button className="skip-btn" onClick={handleSkip}>
            Skip for now →
          </button>
        )}

      </div>
    </div>
  )
}
