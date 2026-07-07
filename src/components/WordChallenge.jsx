import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { checkPronunciation } from '../utils/helpers'
import { LANGUAGES, getChallengeOptions } from '../data/vocabulary'
import { sleep, speakAndWait, speakTranslation, cancelSpeech, playBeep, LANG_TTS } from '../utils/tts'
import { splitSyllables } from '../utils/syllables'
import './WordChallenge.css'

// ── Word-art (English) ────────────────────────────────────────────────────────
const GRADIENTS = [
  ['#ff6b6b','#feca57'], ['#48dbfb','#ff9ff3'], ['#1dd1a1','#f9ca24'],
  ['#a29bfe','#fd79a8'], ['#fdcb6e','#e17055'], ['#55efc4','#74b9ff'],
]
function strHash(s) { return s.split('').reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0) }

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

// Each challenge starts in SPEECH mode — the child has to say the word out loud.
// If that first spoken attempt fails (wrong word, timeout, or no microphone) the
// challenge falls back to TAP mode, where the child clicks the right picture.

// ── Component ─────────────────────────────────────────────────────────────────
export default function WordChallenge({ wordEntry, language, skipSpeech = false, onSuccess, onSkip }) {
  const { error: micError, startListening, stopListening, supported } = useSpeechRecognition()

  // Always start at 'presenting' — card shows, then TTS plays
  const [phase, setPhase]           = useState('presenting')
  const [spokenText, setSpokenText] = useState('')
  const [timeLeft, setTimeLeft]     = useState(CHALLENGE_TIMEOUT)
  const [activeSyllable, setActiveSyllable] = useState(-1)
  const [wrongPicks, setWrongPicks] = useState([])   // option words already ruled out
  const attemptsRef   = useRef(0)       // wrong picture taps
  const spokeWrongRef = useRef(false)   // true once the spoken attempt has failed
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
  const syllables   = useMemo(() => splitSyllables(wordEntry.word), [wordEntry.word])

  // Tap-the-picture options: the target word plus same-category distractors.
  const options = useMemo(() => getChallengeOptions(wordEntry.word, 3), [wordEntry.word])

  // skipSpeech lets kids without a microphone (or who'd rather not talk) jump
  // straight to the tap-the-picture challenge — same path as having no mic.
  const canUseMic = supported && micError !== 'not-allowed' && !skipSpeech

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

      // Sound it out, syllable by syllable, for multi-syllable words, so the
      // child can hear how to pronounce it before saying it back.
      if (syllables.length > 1) {
        if (cancelled) return
        await sleep(200)
        for (let i = 0; i < syllables.length; i++) {
          if (cancelled) return
          setActiveSyllable(i)
          await speakAndWait(syllables[i], 'en-US', 0.7)
          if (cancelled) return
          await sleep(120)
        }
        if (cancelled) return
        setActiveSyllable(-1)
        await sleep(150)
      }

      if (cancelled) return
      await speakTranslation(wordEntry.word, language, translation, ttsLocale)

      // Repeat the word + translation a second time.
      if (cancelled) return
      await sleep(1000)
      if (cancelled) return
      await speakAndWait(wordEntry.word, 'en-US')
      if (cancelled) return
      await speakTranslation(wordEntry.word, language, translation, ttsLocale)

      // No microphone available — skip the spoken attempt and go straight to
      // tapping the picture.
      if (!canUseMic) {
        if (cancelled) return
        await sleep(150)
        if (cancelled) return
        setPhase('choosing')
        return
      }

      // Beep to cue the child, then listen for them to say the word.
      if (cancelled) return
      playBeep()
      await sleep(150)
      if (cancelled) return
      setPhase('listening')
    }

    present()
    return () => {
      cancelled = true
      cancelRef.current = true
      cancelSpeech()
      setActiveSyllable(-1)
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

  // ── Always release the mic when leaving the listening phase ─────────────────
  // The speech hook auto-restarts through silence, so it only ever stops when
  // stopListening() is called. This cleanup guarantees that happens on every
  // exit from listening — timeout, correct answer, skip, or unmount — otherwise
  // the restart loop would keep the microphone open indefinitely.
  useEffect(() => {
    if (phase !== 'listening') return
    return () => stopListening()
  }, [phase, stopListening])

  // ── Mic error → fall back to tapping the picture ─────────────────────────
  useEffect(() => {
    if (phase === 'listening' && micError && micError !== 'no-speech' && micError !== 'aborted') {
      handleSpeechFail()
    }
  }, [micError, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown timer ───────────────────────────────────────────────────────
  // The timeout action (moving on when time runs out) is fired from the interval
  // body — NOT from inside a setState updater. The mic hook re-renders often via
  // setListening, and a side effect buried in an impure updater can be dropped,
  // leaving us stuck in 'listening' with the microphone looping forever. Elapsed
  // time is measured against a start timestamp so dropped ticks can't stall it.
  useEffect(() => {
    if (phase !== 'listening' && phase !== 'choosing') return
    failHandledRef.current = false   // reset guard for each new response session
    setTimeLeft(CHALLENGE_TIMEOUT)
    const startedAt = Date.now()
    const id = setInterval(() => {
      const remaining = CHALLENGE_TIMEOUT - Math.floor((Date.now() - startedAt) / 1000)
      setTimeLeft(remaining > 0 ? remaining : 0)
      if (remaining <= 0 && !failHandledRef.current) {
        failHandledRef.current = true
        clearInterval(id)
        // Ran out of time: a missed spoken attempt drops to tapping the
        // picture; a missed tap reveals the answer.
        phase === 'listening' ? handleSpeechFail() : handlePickTimeout()
      }
    }, 250)
    return () => clearInterval(id)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spoken attempt failed — switch to tapping the right picture ─────────────
  function handleSpeechFail() {
    stopListening()
    if (spokeWrongRef.current) return   // already switched to tap mode
    spokeWrongRef.current = true
    setSpokenText('')
    setPhase('choosing')
  }

  // Points awarded on success — full marks for saying it, dropping a tier for a
  // missed spoken attempt and for each wrong picture tap.
  function successPoints() {
    const tier = (spokeWrongRef.current ? 1 : 0) + attemptsRef.current
    return tier === 0 ? 100 : tier === 1 ? 50 : 25
  }

  // ── Answer (spoken) ─────────────────────────────────────────────────────────
  function handleAnswer(text) {
    const correct = checkPronunciation(text, wordEntry.word)
    console.log(
      `[challenge] target="${wordEntry.word}" heard=${JSON.stringify(text)} → ${correct ? 'MATCH ✓' : 'NO MATCH ✗'}`
    )
    if (correct) {
      setPhase('success')
      schedule(() => onSuccess(successPoints()), 1100)
    } else {
      // First spoken try missed — move on to tapping the right picture.
      handleSpeechFail()
    }
  }

  // ── Tap-the-picture answer ──────────────────────────────────────────────────
  function handlePick(optionWord) {
    if (phaseRef.current !== 'choosing') return
    if (optionWord === wordEntry.word) {
      setPhase('success')
      schedule(() => onSuccess(successPoints()), 1100)
    } else {
      // Wrong picture: rule it out, count the attempt, reveal the answer once
      // both distractors are exhausted.
      setWrongPicks(prev => prev.includes(optionWord) ? prev : [...prev, optionWord])
      attemptsRef.current += 1
      setAttempts(attemptsRef.current)
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setPhase('answer')
        schedule(() => onSkip(), 3500)
      }
    }
  }

  // Timer ran out before any pick — reveal the answer, then move on.
  function handlePickTimeout() {
    attemptsRef.current = MAX_ATTEMPTS
    setAttempts(MAX_ATTEMPTS)
    setPhase('answer')
    schedule(() => onSkip(), 3500)
  }

  const handleSkip = () => {
    cancelRef.current = true
    cancelSpeech()
    stopListening()
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
          {activeSyllable >= 0 ? (
            syllables.map((syl, i) => (
              <span
                key={i}
                className={`challenge-syllable${i === activeSyllable ? ' challenge-syllable--active' : ''}`}
              >
                {syl}
              </span>
            ))
          ) : (
            <span>{wordEntry.word}</span>
          )}
        </div>

        {/* No word picture is shown during presentation — the child must learn
            the word from the audio, not by memorising an image. The only place
            a picture appears is the tappable choice grid below. */}

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
                +{successPoints()} pts
              </span>
            </div>
          </div>
        )}
        {phase === 'answer' && (
          <div className="feedback feedback--answer">
            <div className="feedback-text">The word is: <strong>{wordEntry.word}</strong></div>
            <div className="heard-text">Continuing in a moment…</div>
          </div>
        )}

        {/* Activity section */}
        {(phase === 'presenting' || phase === 'listening' || phase === 'choosing') && (
          <div className="activity-section">

            {/* Countdown ring (only during active response phases) */}
            {(phase === 'listening' || phase === 'choosing') && (
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

            {phase === 'choosing' ? (
              <>
                <p className="mic-prompt mic-prompt--go">
                  {spokeWrongRef.current ? 'Good try! Now tap the picture 👆' : 'Which one is it? 👆'}
                </p>
                <div className="choice-grid">
                  {options.map(opt => {
                    const ruledOut = wrongPicks.includes(opt.word)
                    return (
                      <button
                        key={opt.word}
                        className={`choice-card${ruledOut ? ' choice-card--wrong' : ''}`}
                        onClick={() => handlePick(opt.word)}
                        disabled={ruledOut}
                        aria-label={opt.word}
                      >
                        <span className="choice-emoji">{opt.emoji}</span>
                      </button>
                    )
                  })}
                </div>
                {wrongPicks.length > 0 && (
                  <div className="heard-text heard-text--retry">😅 Not quite — try again!</div>
                )}
              </>
            ) : phase === 'listening' ? (
              <>
                {/* The mic stays live for the full countdown and auto-restarts
                    through silence — so we always show it as actively listening
                    and never ask the child to press a button to retry. When the
                    timer runs out the challenge moves on to the picture cards. */}
                <p className="mic-prompt mic-prompt--go">🎤 Say the word!</p>
                <div className="mic-container">
                  <div className="mic-ripple mic-ripple--1" />
                  <div className="mic-ripple mic-ripple--2" />
                  <div className="mic-ripple mic-ripple--3" />
                  <div className="listening-ring listening-ring--active" aria-label="Listening" role="status">
                    🎙
                    <span className="rec-dot" />
                  </div>
                </div>
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
