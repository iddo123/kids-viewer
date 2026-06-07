import { useState, useEffect, useRef, useCallback } from 'react'
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

const MAX_ATTEMPTS      = 2
const CHALLENGE_TIMEOUT = 10   // seconds per attempt

// ── Component ─────────────────────────────────────────────────────────────────
export default function WordChallenge({ wordEntry, language, onSuccess, onSkip }) {
  const { listening, error: micError, startListening, stopListening, supported } = useSpeechRecognition()

  // Always start at 'presenting' — card shows, then TTS plays
  const [phase, setPhase]           = useState('presenting')
  const [spokenText, setSpokenText] = useState('')
  const [typedText, setTypedText]   = useState('')
  const [useTypeMode, setUseTypeMode] = useState(false)
  const [timeLeft, setTimeLeft]     = useState(CHALLENGE_TIMEOUT)
  const attemptsRef = useRef(0)
  const [attempts, setAttempts]     = useState(0)
  const cancelRef        = useRef(false)
  const timersRef        = useRef([])   // all pending setTimeout IDs
  const phaseRef         = useRef('presenting')
  const failHandledRef   = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])

  // Cancellable timer — cleared automatically on skip or unmount
  const schedule = useCallback((fn, ms) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter(t => t !== id)
      fn()
    }, ms)
    timersRef.current.push(id)
  }, [])

  // Cancel all pending timers on unmount
  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const langInfo    = LANGUAGES.find(l => l.code === language) || LANGUAGES[0]
  const translation = wordEntry.translations?.[language] || wordEntry.word
  const ttsLocale   = LANG_TTS[language] || language

  const canUseMic = supported && !useTypeMode && micError !== 'not-allowed'

  // ── Presentation: speak word → translation → beep → listen ───────────────
  useEffect(() => {
    if (phase !== 'presenting') return
    cancelRef.current = false

    // Use a local flag so StrictMode's double-invoke doesn't let two
    // concurrent present() calls both complete (the shared cancelRef gets
    // reset to false by the second setup before the first checks it).
    let cancelled = false

    async function present() {
      cancelSpeech()
      await sleep(100)

      // First pass
      if (cancelled) return
      await speakAndWait(wordEntry.word, 'en-US')
      if (cancelled) return
      await speakAndWait(translation, ttsLocale)

      // 1-second gap then repeat
      if (cancelled) return
      await sleep(1000)
      if (cancelled) return
      await speakAndWait(wordEntry.word, 'en-US')
      if (cancelled) return
      await speakAndWait(translation, ttsLocale)

      if (cancelled) return
      playBeep()
      await sleep(150)

      if (cancelled) return
      setPhase(canUseMic ? 'listening' : 'typing')
    }

    present()
    return () => {
      cancelled = true
      cancelRef.current = true
      cancelSpeech()
    }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stable ref so the mic button and the effect share the same callback
  const speechCallbackRef = useRef(null)
  speechCallbackRef.current = (best, allAlts) => {
    setSpokenText(best)
    handleAnswer(allAlts && allAlts.length ? allAlts : best)
  }

  const triggerMic = useCallback(() => {
    setSpokenText('')
    startListening((best, allAlts) => speechCallbackRef.current(best, allAlts))
  }, [startListening])

  // ── Auto-start mic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'listening') return
    triggerMic()
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mic error → fall back to typing ──────────────────────────────────────
  useEffect(() => {
    if (phase === 'listening' && micError && micError !== 'no-speech' && micError !== 'aborted') {
      setUseTypeMode(true)
      setPhase('typing')
    }
  }, [micError, phase])

  // ── Countdown timer ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'listening' && phase !== 'typing') return
    failHandledRef.current = false   // reset guard for each new listening session
    setTimeLeft(CHALLENGE_TIMEOUT)
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          // Guard prevents double-fire from React StrictMode's double-invocation of state updaters
          if (!failHandledRef.current) {
            failHandledRef.current = true
            handleFail()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fail: timer expired — one retry with re-presentation, then skip ─────────
  function handleFail() {
    stopListening()
    attemptsRef.current += 1
    setAttempts(attemptsRef.current)
    if (attemptsRef.current >= MAX_ATTEMPTS) {
      setPhase('answer')
      schedule(() => onSkip(), 3500)
    } else {
      setPhase('fail')
      schedule(() => { setTypedText(''); setSpokenText(''); setPhase('presenting') }, 800)
    }
  }

  // ── Answer ────────────────────────────────────────────────────────────────
  function handleAnswer(text) {
    const correct = checkPronunciation(text, wordEntry.word)
    if (correct) {
      setPhase('success')
      const pts = attemptsRef.current === 0 ? 100 : 50
      schedule(() => onSuccess(pts), 2200)
    } else {
      // Wrong guess within the 10s window — show feedback and reopen mic.
      // Do NOT call handleFail; that only fires when the timer expires.
      schedule(() => {
        if (phaseRef.current === 'listening') {
          setSpokenText('')
          triggerMic()
        }
      }, 300)
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
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
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
                <p className={`mic-prompt${listening ? ' mic-prompt--go' : ''}`}>
                  {listening ? '🎤 SAY IT NOW!' : 'Tap the mic to speak! 👇'}
                </p>
                <div className="mic-container">
                  {listening && <>
                    <div className="mic-ripple mic-ripple--1" />
                    <div className="mic-ripple mic-ripple--2" />
                    <div className="mic-ripple mic-ripple--3" />
                  </>}
                  <button
                    className={`listening-ring${listening ? ' listening-ring--active' : ' listening-ring--idle'}`}
                    onClick={triggerMic}
                    aria-label={listening ? 'Listening' : 'Tap to speak'}
                  >
                    🎙
                    {listening && <span className="rec-dot" />}
                  </button>
                </div>
                {spokenText && (
                  <div className="heard-text heard-text--retry">
                    😅 I heard: <em>"{spokenText}"</em> — try again!
                  </div>
                )}
                <button className="switch-mode-btn" onClick={() => { setUseTypeMode(true); setPhase('typing') }}>
                  ⌨️ Type instead
                </button>
              </>
            ) : (
              /* presenting */
              <>
                <p className={`mic-prompt${attemptsRef.current > 0 ? ' mic-prompt--retry' : ''}`}>
                  {attemptsRef.current === 0 ? 'Listen carefully… 👂' : '👂 Listen again!'}
                </p>
                <div className="speaking-indicator" aria-label="Speaking">
                  {[0,1,2,3,4].map(i => <span key={i} className="speaking-bar" style={{ '--bi': i }} />)}
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
