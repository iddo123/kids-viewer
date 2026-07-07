import { useState, useCallback, useRef, useEffect } from 'react'
import SetupScreen          from './components/SetupScreen'
import AuthScreen           from './components/AuthScreen'
import VideoPlayer          from './components/VideoPlayer'
import WordChallenge        from './components/WordChallenge'
import ScoreDisplay         from './components/ScoreDisplay'
import DictionaryView       from './components/DictionaryView'
import LevelUpCelebration   from './components/LevelUpCelebration'
import UpgradePrompt        from './components/UpgradePrompt'
import HelpModal            from './components/HelpModal'
import PrivacyModal          from './components/PrivacyModal'
import { extractVideoId }        from './utils/helpers'
import { useTranscriptWords }    from './hooks/useTranscriptWords'
import { STOP_WORDS }            from './utils/transcript'
import { useUserDictionary }     from './hooks/useUserDictionary'
import { useAuth }               from './hooks/useAuth'
import { useSubscription }       from './hooks/useSubscription'
import { useVideoCount }         from './hooks/useVideoCount'
import { shouldShowUpgrade }     from './config/limits'
import { vocabulary }            from './data/vocabulary'
import { cancelSpeech } from './utils/tts'
import './App.css'

// STOP_WORDS imported from src/utils/transcript.js (single source of truth)

// ── Visual-word scoring (prefer concrete words that are easy to illustrate) ───
const VOCAB_SET = new Set(vocabulary.map(v => v.word))
const ABSTRACT_SUFFIXES = ['ness','tion','ment','ity','ism','ship','hood','ance','ence']
const ABSTRACT_WORDS = new Set([
  'feel','felt','seem','seemed','become','became','wonder','wish','hope',
  'believe','understand','remember','forget','enjoy','care','mean','meant',
])
function visualScore(word) {
  if (VOCAB_SET.has(word)) return 10       // curated vocab → always show
  if (ABSTRACT_WORDS.has(word)) return -5  // known-abstract verbs → skip
  for (const s of ABSTRACT_SUFFIXES) {
    if (word.endsWith(s)) return -3        // abstract-noun suffixes → deprioritise
  }
  return 0
}

function fmtSec(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.round(s) % 60
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
}

// ── Quiet-slot fire timing ────────────────────────────────────────────────────
// We never pause mid-sentence. After a challenge word is spoken, look ahead up to
// one minute for the first ≥1 s silence between caption lines and fire the
// challenge there. If speech is continuous, wait for the caption line ("sentence")
// playing at the one-minute mark to finish. This needs caption durations
// (json3 dDurationMs); without them we fall back to "2 s after the word".
const QUIET_SLOT_MS      = 1000   // a usable silent slot = ≥1 s gap between lines
const QUIET_LOOKAHEAD_MS = 60000  // search up to 1 minute past the spoken word
const QUIET_CUSHION_MS   = 200    // fire just inside the silence, after speech stops
const DEFAULT_DELAY_MS   = 2000   // legacy fallback: 2 s after the word starts

// Build a sorted, de-duplicated caption-line timeline from word tokens.
// Each line is { start, end }; end is clamped to the next line's start so an
// over-long duration never swallows the following line.
function buildCueTimeline(transcriptWords) {
  const byStart = new Map()
  for (const t of transcriptWords) {
    if (!byStart.has(t.startMs) || (t.durMs != null && byStart.get(t.startMs) == null)) {
      byStart.set(t.startMs, t.durMs ?? null)
    }
  }
  const starts = [...byStart.keys()].sort((a, b) => a - b)
  const hasDurations = [...byStart.values()].some(d => d != null)
  const cues = starts.map((start, i) => {
    const dur       = byStart.get(start)
    const nextStart = i + 1 < starts.length ? starts[i + 1] : Infinity
    const end       = dur != null ? Math.min(start + dur, nextStart) : start
    return { start, end }
  })
  return { cues, hasDurations }
}

// Find the time (ms) to fire a word's challenge: the first ≥1 s silence within a
// minute of the word, else the end of the caption line playing at the 1-minute
// mark ("sentence ends"). Falls back to "2 s after the word" without durations.
function findQuietFireMs(wordStartMs, cues, hasDurations) {
  const legacy = wordStartMs + DEFAULT_DELAY_MS
  if (!hasDurations || cues.length === 0) return legacy

  const limit = wordStartMs + QUIET_LOOKAHEAD_MS

  // Start scanning from the caption line the word is in (first line whose speech
  // hasn't already finished before the word starts).
  let i = 0
  while (i < cues.length && cues[i].end <= wordStartMs) i++

  for (; i < cues.length; i++) {
    const silenceStart = cues[i].end
    if (silenceStart > limit) break
    const nextStart = i + 1 < cues.length ? cues[i + 1].start : Infinity
    if (nextStart - silenceStart >= QUIET_SLOT_MS) {
      return Math.max(silenceStart + QUIET_CUSHION_MS, legacy)
    }
  }

  // No silence within the minute → wait until the caption line playing at the
  // one-minute mark finishes (the next clean sentence break).
  for (let j = 0; j < cues.length; j++) {
    if (cues[j].end >= limit) return Math.max(cues[j].end, legacy)
  }
  return Math.max(limit, legacy)
}

export function buildChallengeSchedule(transcriptWords, getLevelFn, startAfterSec = 0, minGapSec = 60) {
  if (!transcriptWords.length) return []

  const { cues, hasDurations } = buildCueTimeline(transcriptWords)

  // Count frequency of each content word
  const freq = {}
  for (const { word } of transcriptWords) {
    if (STOP_WORDS.has(word) || word.length < 3) continue
    freq[word] = (freq[word] || 0) + 1
  }

  const totalDuration = transcriptWords[transcriptWords.length - 1].startMs / 1000

  // Sliding-window approach: for each time slot pick the best word occurring in that window.
  // No hard cap — the natural limit is video_duration / minGapSec.
  const schedule = []
  const usedWords = new Set()
  let searchFrom = startAfterSec - minGapSec   // first challenge can start at time 0

  // Combined score: frequency + visual concreteness bonus
  const wordScore = (w) => (freq[w] || 0) + visualScore(w) * 3

  while (true) {
    const earliest  = searchFrom + minGapSec
    const windowEnd = earliest   + minGapSec
    if (earliest >= totalDuration - 5) break

    const isSuitable = (t) => {
      const tSec = t.startMs / 1000
      return tSec >= earliest && tSec < windowEnd &&
             !STOP_WORDS.has(t.word) &&
             t.word.length >= 3 &&
             getLevelFn(t.word) < 3 &&
             VOCAB_SET.has(t.word)   // only words with a curated visual
    }

    // Prefer words not yet used; fall back to any suitable word (allows repeats in tight vocab)
    let candidates = transcriptWords.filter(t => isSuitable(t) && !usedWords.has(t.word))
    if (!candidates.length) candidates = transcriptWords.filter(isSuitable)

    if (!candidates.length) {
      // No word found in this window — slide forward and try the next slot
      searchFrom += minGapSec
      continue
    }

    // Pick the highest-scoring word (frequency + visual concreteness)
    const best    = candidates.reduce((a, b) => wordScore(b.word) > wordScore(a.word) ? b : a)
    // Fire during the next quiet moment (≥1 s silence within a minute) instead of
    // interrupting mid-sentence; falls back to 2 s after the word without durations.
    const fireMs  = findQuietFireMs(best.startMs, cues, hasDurations)
    const timeSec = Math.floor(fireMs / 1000)

    schedule.push({ word: best.word, timeSec, fired: false })
    usedWords.add(best.word)
    searchFrom = timeSec   // next challenge must be ≥ timeSec + minGapSec (keeps fires spaced)
  }

  const sorted = schedule.sort((a, b) => a.timeSec - b.timeSec)

  // Cap any single word to ≤15% of total challenges (only when total > 5)
  if (sorted.length > 5) {
    const maxPerWord = Math.max(1, Math.round(sorted.length * 0.15))
    const seen = {}
    return sorted.filter(s => {
      seen[s.word] = (seen[s.word] || 0) + 1
      return seen[s.word] <= maxPerWord
    })
  }

  return sorted
}


export default function App() {
  const { user, loading: authLoading } = useAuth()
  const [screen, setScreen]           = useState('setup')
  const [videoId, setVideoId]         = useState(null)
  const [language, setLanguage]       = useState('he')
  const [paused, setPaused]           = useState(false)
  const [activeWord, setActiveWord]   = useState(null)
  const [score, setScore]             = useState(0)
  const [streak, setStreak]           = useState(0)
  const [celebration, setCelebration] = useState(null)
  const [videoError, setVideoError]   = useState(null)
  const [showDict, setShowDict]           = useState(false)
  const [showSchedule, setShowSchedule]   = useState(false)
  const [showUpgrade, setShowUpgrade]     = useState(false)
  const [showHelp, setShowHelp]           = useState(false)
  const [showPrivacy, setShowPrivacy]     = useState(false)
  const [videoEnded, setVideoEnded]       = useState(false)
  const [levelUpInfo, setLevelUpInfo]     = useState(null)  // { word, level }
  const [scheduleCount, setScheduleCount]         = useState(0)
  const [scheduleReady, setScheduleReady]         = useState(false)
  const [challengeInterval, setChallengeInterval] = useState(60)
  const [skipSpeech, setSkipSpeech]               = useState(false)

  const languageRef    = useRef(language)
  const inChallengeRef = useRef(false)
  const currentTimeRef = useRef(0)
  const activeWordRef  = useRef(null)
  const scheduleRef    = useRef([])
  const ttsAbortRef    = useRef(false)   // cancels pre-card TTS when needed
  const ytPlayerRef          = useRef(null)
  const dictionaryRef        = useRef({})
  const challengeIntervalRef = useRef(60)
  const countedVideoRef      = useRef(null)   // videoId already counted toward the free limit

  useEffect(() => { languageRef.current = language }, [language])

  // ── User dictionary ───────────────────────────────────────────────────────
  const { dictionary, recordAttempt, stats } = useUserDictionary()
  useEffect(() => { dictionaryRef.current = dictionary }, [dictionary])

  // ── Subscription / gating ────────────────────────────────────────────────
  const subscription = useSubscription()
  const videoCount    = useVideoCount()

  // After returning from Stripe Checkout, refresh subscription status
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('checkout') === 'success') {
      subscription.refresh()
      const url = new URL(window.location.href)
      url.searchParams.delete('checkout')
      window.history.replaceState({}, '', url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Transcript ────────────────────────────────────────────────────────────
  const { transcriptWords, status: transcriptStatus } = useTranscriptWords(videoId)

  // Count a video toward the free limit only once its captions load successfully.
  // A video with no captions never becomes a real lesson, so it shouldn't burn a
  // credit — otherwise failed loads silently eat the free quota.
  useEffect(() => {
    if (transcriptStatus === 'ready' && videoId && countedVideoRef.current !== videoId) {
      countedVideoRef.current = videoId
      videoCount.increment()
    }
  }, [transcriptStatus, videoId, videoCount.increment])

  // Build challenge schedule once per video when transcript arrives
  useEffect(() => {
    if (!transcriptWords.length) return

    const getLevelFn = (word) => {
      const e = dictionaryRef.current[word]
      if (!e) return 0
      if (e.timesCorrect >= 3) return 3
      if (e.timesCorrect >= 1) return 2
      return 1
    }

    const schedule = buildChallengeSchedule(
      transcriptWords,
      getLevelFn,
      currentTimeRef.current,
      challengeIntervalRef.current,
    )
    scheduleRef.current = schedule
    setScheduleCount(schedule.length)
    setScheduleReady(true)
    if (schedule.length === 0) {
      console.warn('[schedule] No challenges scheduled — none of the transcript words matched the vocabulary list')
    } else {
      console.log('[schedule]', schedule.map(s => `${s.word}@${fmtSec(s.timeSec)}`).join(', '))
    }
  }, [transcriptWords])


  // ── Challenge trigger ─────────────────────────────────────────────────────
  const triggerChallenge = useCallback((word, atSec) => {
    ttsAbortRef.current = false

    // Check guards before pausing — avoids a micro-stutter where the video
    // briefly pauses then immediately resumes on a skip path.
    const vocabEntry = vocabulary.find(v => v.word === word)
    if (!vocabEntry) {
      console.log(`[challenge] skip "${word}" — no curated visual`)
      inChallengeRef.current = false
      return
    }

    const lang        = languageRef.current
    const translation = vocabEntry.translations?.[lang]
    // Only skip if the translation is genuinely absent — loanwords (pizza, banana)
    // have translations equal to the English word and are still valid challenges.
    if (!translation) {
      console.log(`[challenge] skip "${word}" — no translation for ${lang}`)
      inChallengeRef.current = false
      return
    }

    // Guards passed — safe to pause the video now
    try { ytPlayerRef.current?.pauseVideo() } catch (_) {}
    setPaused(true)

    try {
      const wordEntry = {
        word,
        emoji:      vocabEntry.emoji,
        imageQuery: vocabEntry.imageQuery ?? word,
        translations: vocabEntry.translations,
        isDynamic:  false,
        foundAtSec: Math.round(atSec),
      }
      activeWordRef.current = wordEntry
      setActiveWord(wordEntry)
    } catch (err) {
      console.warn('[challenge] error:', err)
      try { ytPlayerRef.current?.playVideo() } catch (_) {}
      setPaused(false)
      inChallengeRef.current = false
    }
  }, [])

  // ── Dismiss (success or skip) ─────────────────────────────────────────────
  const dismissChallenge = useCallback((earnedPoints, correct) => {
    if (!activeWordRef.current) return  // already dismissed — guard against double-calls
    const word = activeWordRef.current.word

    // Detect level-up before recording (dictionary not yet updated)
    if (word && correct) {
      const e = dictionaryRef.current[word]
      const prevCorrect = e?.timesCorrect ?? 0
      const newCorrect  = prevCorrect + 1
      const prevLevel = !e ? 0 : prevCorrect >= 3 ? 3 : prevCorrect >= 1 ? 2 : 1
      const newLevel  = newCorrect >= 3 ? 3 : 2
      // Only celebrate a level-up if the word was already known (prevLevel ≥ 1),
      // i.e. don't show it on a brand-new word's very first correct answer.
      if (newLevel > prevLevel && prevLevel >= 1) {
        setLevelUpInfo({ word, level: newLevel })
      }
    }

    if (word) recordAttempt(word, correct)

    if (earnedPoints > 0) {
      setScore(prev => prev + earnedPoints)
      setStreak(prev => prev + 1)
      setCelebration({ points: earnedPoints })
      setTimeout(() => setCelebration(null), 2000)
    } else {
      setStreak(0)
    }

    activeWordRef.current  = null
    inChallengeRef.current = false
    setActiveWord(null)
    setPaused(false)
    try { ytPlayerRef.current?.playVideo() } catch (_) {}
  }, [recordAttempt])

  const handleSuccess = useCallback((pts) => dismissChallenge(pts, true),  [dismissChallenge])
  const handleSkip    = useCallback(()    => dismissChallenge(0,   false), [dismissChallenge])

  // ── Time update ───────────────────────────────────────────────────────────
  const lastTimeRef = useRef(0)

  const handleTimeUpdate = useCallback((currentTime) => {
    const lastTime = lastTimeRef.current
    lastTimeRef.current  = currentTime
    currentTimeRef.current = currentTime

    // Forward seek (> 4 s jump) → silently skip any entries we jumped over
    if (currentTime - lastTime > 4) {
      scheduleRef.current.forEach(s => {
        if (!s.fired && s.timeSec < currentTime) s.fired = true
      })
    }
    // Backward seek → re-arm entries that are now in the future again
    if (currentTime < lastTime - 2) {
      scheduleRef.current.forEach(s => {
        if (s.timeSec > currentTime) s.fired = false
      })
    }

    if (inChallengeRef.current) {
      // eslint-disable-next-line no-console
      console.log(`[fire-check] blocked: inChallenge=true at time=${currentTime.toFixed(1)}`)
      return
    }

    // TEMP DIAGNOSTIC: report when a due entry exists but isn't firing, and why.
    const due = scheduleRef.current.find(s => currentTime >= s.timeSec && !s._logged && (currentTime - s.timeSec) < 2)
    if (due) {
      due._logged = true
      // eslint-disable-next-line no-console
      console.log(`[fire-check] due "${due.word}"@${due.timeSec}s time=${currentTime.toFixed(1)} fired=${due.fired} scheduleLen=${scheduleRef.current.length}`)
    }

    const next = scheduleRef.current.find(s => !s.fired && currentTime >= s.timeSec)
    if (next) {
      // eslint-disable-next-line no-console
      console.log(`[fire-check] FIRING "${next.word}" at time=${currentTime.toFixed(1)}`)
      next.fired = true
      inChallengeRef.current = true
      triggerChallenge(next.word, currentTime)
    }
  }, [triggerChallenge])

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleStart = useCallback((url, lang, interval = 60, skip = false) => {
    const id = extractVideoId(url)
    if (!id) return
    if (shouldShowUpgrade(subscription.isActive, videoCount.count, subscription.loading)) {
      setShowUpgrade(true)
      return
    }
    // Note: the free-video credit is consumed only after captions load
    // successfully (see the transcript effect above), not on this click.
    scheduleRef.current          = []
    inChallengeRef.current       = false
    activeWordRef.current        = null
    challengeIntervalRef.current = interval
    setVideoId(id)
    setLanguage(lang)
    setChallengeInterval(interval)
    setSkipSpeech(skip)
    setScore(0)
    setStreak(0)
    setScheduleCount(0)
    setScheduleReady(false)
    setVideoEnded(false)
    setActiveWord(null)
    setPaused(false)
    setVideoError(null)
    setScreen('playing')
  }, [subscription.isActive, subscription.loading, videoCount])

  const handleBack = useCallback(() => {
    ttsAbortRef.current    = true
    cancelSpeech()
    inChallengeRef.current = false
    activeWordRef.current  = null
    setPaused(false)
    setActiveWord(null)
    setVideoError(null)
    setScreen('setup')
    setVideoId(null)
  }, [])

  const handleVideoError = useCallback((msg) => setVideoError(msg), [])
  const handleVideoEnd   = useCallback(() => {
    inChallengeRef.current = false
    setVideoEnded(true)
  }, [])

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = (() => {
    if (transcriptStatus === 'loading')     return '📄 Loading captions…'
    if (scheduleReady && scheduleCount > 0) return `📄 ${scheduleCount} word${scheduleCount !== 1 ? 's' : ''} from video`
    if (scheduleReady && scheduleCount === 0) return '📄 No matching words found'
    if (transcriptStatus === 'unavailable') return '📄 No captions — no challenges for this video'
    return ''
  })()

  // ── Render ────────────────────────────────────────────────────────────────
  if (authLoading) return null
  if (!user) return <AuthScreen />

  if (screen === 'setup') {
    return (
      <>
        <SetupScreen onStart={handleStart} stats={stats} onHelpOpen={() => setShowHelp(true)} onPrivacyOpen={() => setShowPrivacy(true)} />
        {showUpgrade && <UpgradePrompt onClose={() => setShowUpgrade(false)} />}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
        {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      </>
    )
  }

  return (
    <div className="app-playing">
      <ScoreDisplay
        score={score}
        streak={streak}
        onBack={handleBack}
        dictCount={stats.total}
        onDictOpen={() => setShowDict(true)}
        onHelpOpen={() => setShowHelp(true)}
      />

      {statusBadge && (
        <button
          className={`transcript-badge transcript-badge--${transcriptStatus}`}
          onClick={() => scheduleRef.current.length && setShowSchedule(true)}
          title={scheduleRef.current.length ? 'See word schedule' : undefined}
        >
          {statusBadge}
        </button>
      )}

      {videoError ? (
        <div className="video-error-box">
          <div className="video-error-icon">⚠️</div>
          <p className="video-error-msg">{videoError}</p>
          <button className="video-error-btn" onClick={handleBack}>
            ← Pick a different video
          </button>
        </div>
      ) : (
        <VideoPlayer
          videoId={videoId}
          paused={paused}
          inChallenge={!!activeWord}
          onTimeUpdate={handleTimeUpdate}
          onVideoError={handleVideoError}
          onVideoEnd={handleVideoEnd}
          playerRef={ytPlayerRef}
        />
      )}

      {/* ── No captions warning ── */}
      {transcriptStatus === 'unavailable' && !videoError && (
        <div className="no-captions-banner">
          <div className="no-captions-icon">📄</div>
          <div className="no-captions-text">
            <strong>No captions found for this video</strong>
            <span>Word challenges won't be available. Try a video with closed captions for the full experience.</span>
          </div>
          <button className="no-captions-back-btn" onClick={handleBack}>
            ← Try a different video
          </button>
        </div>
      )}

      {/* ── End of video screen ── */}
      {videoEnded && !videoError && (
        <div className="video-end-overlay">
          <div className="video-end-card">
            <div className="video-end-icon">🎉</div>
            <h2 className="video-end-title">Great watching!</h2>
            <p className="video-end-sub">Ready for another video?</p>
            <button className="video-end-btn video-end-btn--primary" onClick={handleBack}>
              🔍 Find another video
            </button>
            <button className="video-end-btn video-end-btn--secondary" onClick={() => setVideoEnded(false)}>
              🔁 Watch again
            </button>
          </div>
        </div>
      )}

      {activeWord && !videoError && (
        <WordChallenge
          wordEntry={activeWord}
          language={language}
          skipSpeech={skipSpeech}
          onSuccess={handleSuccess}
          onSkip={handleSkip}
        />
      )}

      {celebration && (
        <div className="celebration-toast">
          ⭐ +{celebration.points} points!
        </div>
      )}

      {levelUpInfo && (
        <LevelUpCelebration
          word={levelUpInfo.word}
          level={levelUpInfo.level}
          onDone={() => setLevelUpInfo(null)}
        />
      )}

      {showDict && (
        <DictionaryView
          dictionary={dictionary}
          onClose={() => setShowDict(false)}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showSchedule && (
        <div className="schedule-overlay" onClick={() => setShowSchedule(false)}>
          <div className="schedule-panel" onClick={e => e.stopPropagation()}>
            <div className="schedule-panel-header">
              <span>🗓 Word Schedule</span>
              <button className="schedule-close-btn" onClick={() => setShowSchedule(false)}>✕</button>
            </div>
            <div className="schedule-list">
              {scheduleRef.current.map((s, i) => {
                const vocab = vocabulary.find(v => v.word === s.word)
                const mm = String(Math.floor(s.timeSec / 60)).padStart(2, '0')
                const ss = String(s.timeSec % 60).padStart(2, '0')
                return (
                  <div key={i} className={`schedule-item ${s.fired ? 'schedule-item--done' : ''}`}>
                    <span className="schedule-item-emoji">{vocab?.emoji ?? '🔤'}</span>
                    <span className="schedule-item-word">{s.word}</span>
                    <span className="schedule-item-time">{mm}:{ss}</span>
                    <span className="schedule-item-status">{s.fired ? '✓' : '⏳'}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
