import { useState, useCallback, useRef, useEffect } from 'react'
import SetupScreen       from './components/SetupScreen'
import VideoPlayer       from './components/VideoPlayer'
import WordChallenge     from './components/WordChallenge'
import ScoreDisplay      from './components/ScoreDisplay'
import DictionaryView    from './components/DictionaryView'
import { extractVideoId }        from './utils/helpers'
import { fetchDynamicWordEntry } from './utils/transcript'
import { useTranscriptWords }    from './hooks/useTranscriptWords'
import { useUserDictionary }     from './hooks/useUserDictionary'
import { vocabulary }            from './data/vocabulary'
import './App.css'

// ── Stop words (words not worth teaching) ────────────────────────────────────
const STOP_WORDS = new Set([
  'the','a','an','and','or','but','if','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','shall','should','may','might','must','can',
  'could','not','no','nor','yet','both','either','neither','so','as','than',
  'then','there','here','just','also','well','now','still','even','back',
  'about','after','before','between','during','into','onto','over','under',
  'through','up','out','off','down','away','again','already','when','where',
  'why','how','what','which','who','whom','whose','that','this','these','those',
  'each','every','all','any','few','more','most','other','some','such',
  'own','same','too','very','only','its','his','her','our','your',
  'their','my','we','us','they','them','he','she','it','you',
  'get','got','say','said','see','saw','know','knew','think','thought',
  'come','came','go','went','make','made','take','took','give','gave',
  'look','looked','want','wanted','let','put','seem','seemed','tell','told',
  'ask','asked','keep','kept','call','called','feel','felt','become','became',
  'something','anything','everything','nothing','someone','anyone','everyone',
  'yeah','yes','okay','right','like','really','actually','little','much',
  'many','bit','lot','thing','things','way','good','new','first','last',
  'long','big','high','old','great','one','two','three','four','five',
  'because','while','although','since','unless','until','though','whether',
  'gonna','wanna','gotta','kinda','sorta','alright','um','uh','ah','oh',
  'hey','hi','bye','hmm',
])

const MAX_CHALLENGES = 8   // per video

function fmtSec(s) {
  return `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`
}

function buildChallengeSchedule(transcriptWords, getLevelFn, startAfterSec = 0, minGapSec = 60) {
  if (!transcriptWords.length) return []

  // Count frequency of each content word
  const freq = {}
  for (const { word } of transcriptWords) {
    if (STOP_WORDS.has(word) || word.length < 3) continue
    freq[word] = (freq[word] || 0) + 1
  }

  const totalDuration = transcriptWords[transcriptWords.length - 1].startMs / 1000

  // Sliding-window approach: for each time slot pick the best word occurring in that window.
  // This fills the schedule evenly rather than exhausting high-frequency words early and leaving
  // the rest of the video empty.
  const schedule = []
  const usedWords = new Set()
  let searchFrom = startAfterSec - minGapSec   // first challenge can start at time 0

  while (schedule.length < MAX_CHALLENGES) {
    const earliest  = searchFrom + minGapSec
    const windowEnd = earliest   + minGapSec
    if (earliest >= totalDuration - 5) break

    const isSuitable = (t) => {
      const tSec = t.startMs / 1000
      return tSec >= earliest && tSec < windowEnd &&
             !STOP_WORDS.has(t.word) &&
             t.word.length >= 3 &&
             getLevelFn(t.word) < 3
    }

    // Prefer words not yet used; fall back to any suitable word (allows repeats in tight vocab)
    let candidates = transcriptWords.filter(t => isSuitable(t) && !usedWords.has(t.word))
    if (!candidates.length) candidates = transcriptWords.filter(isSuitable)

    if (!candidates.length) {
      // No word found in this window — slide forward and try the next slot
      searchFrom += minGapSec
      continue
    }

    // Pick the highest-frequency word in this window
    const best    = candidates.reduce((a, b) => (freq[b.word] || 0) > (freq[a.word] || 0) ? b : a)
    const timeSec = Math.floor(best.startMs / 1000)

    schedule.push({ word: best.word, timeSec, fired: false })
    usedWords.add(best.word)
    searchFrom = timeSec   // next challenge must be ≥ timeSec + minGapSec
  }

  return schedule.sort((a, b) => a.timeSec - b.timeSec)
}

// ── Fallback: vocab-based schedule when no transcript is available ────────────
function buildFallbackSchedule(duration, videoTitle, getLevelFn, minGapSec = 60) {
  if (!duration || duration < 30) return []

  // Words that appear in the video title get priority (more relevant to the video)
  const titleWords = new Set(
    (videoTitle || '')
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 3)
  )

  const candidates = vocabulary
    .filter(v => getLevelFn(v.word) < 3)
    .sort((a, b) => {
      const aTitle = titleWords.has(a.word) ? 0 : 1
      const bTitle = titleWords.has(b.word) ? 0 : 1
      if (aTitle !== bTitle) return aTitle - bTitle          // title words first
      return getLevelFn(a.word) - getLevelFn(b.word)        // then new words first
    })
    .slice(0, MAX_CHALLENGES)

  if (!candidates.length) return []

  // Space evenly but respect the minimum gap
  const maxCount = Math.min(candidates.length, Math.floor((duration - 20) / minGapSec))
  const gap      = duration / (maxCount + 1)
  return candidates.slice(0, maxCount).map((v, i) => ({
    word:    v.word,
    timeSec: Math.max(20, Math.round(gap * (i + 1))),
    fired:   false,
  })).filter(s => s.timeSec < duration - 10)
}

export default function App() {
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
  const [scheduleCount, setScheduleCount]       = useState(0)
  const [videoDuration, setVideoDuration]       = useState(null)
  const [scheduleSource, setScheduleSource]     = useState('none')
  const [challengeInterval, setChallengeInterval] = useState(60) // seconds between challenges

  const languageRef    = useRef(language)
  const inChallengeRef = useRef(false)
  const currentTimeRef = useRef(0)
  const activeWordRef  = useRef(null)
  const scheduleRef    = useRef([])
  const ytPlayerRef         = useRef(null)
  const dictionaryRef       = useRef({})
  const videoTitleRef       = useRef('')
  const challengeIntervalRef = useRef(60)

  useEffect(() => { languageRef.current = language }, [language])

  // ── User dictionary ───────────────────────────────────────────────────────
  const { dictionary, recordAttempt, stats } = useUserDictionary()
  useEffect(() => { dictionaryRef.current = dictionary }, [dictionary])

  // ── Transcript ────────────────────────────────────────────────────────────
  const { transcriptWords, status: transcriptStatus } = useTranscriptWords(videoId)

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
    setScheduleSource('transcript')
    console.log('[schedule] transcript:', schedule.map(s => `${s.word}@${fmtSec(s.timeSec)}`).join(', '))
  }, [transcriptWords])

  // Fetch video title for better fallback word selection (oEmbed — no API key needed)
  useEffect(() => {
    if (!videoId) return
    videoTitleRef.current = ''
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then(r => r.json())
      .then(d => { videoTitleRef.current = d.title || '' })
      .catch(() => {})
  }, [videoId])

  // Fallback schedule: fires when transcript is unavailable AND duration is known
  useEffect(() => {
    if (transcriptStatus !== 'unavailable') return
    if (!videoDuration) return

    const getLevelFn = (word) => {
      const e = dictionaryRef.current[word]
      if (!e) return 0
      if (e.timesCorrect >= 3) return 3
      if (e.timesCorrect >= 1) return 2
      return 1
    }
    const schedule = buildFallbackSchedule(videoDuration, videoTitleRef.current, getLevelFn, challengeIntervalRef.current)
    scheduleRef.current = schedule
    setScheduleCount(schedule.length)
    setScheduleSource('vocab')
    console.log('[schedule] fallback vocab:', schedule.map(s => `${s.word}@${fmtSec(s.timeSec)}`).join(', '))
  }, [transcriptStatus, videoDuration])

  // ── Challenge trigger ─────────────────────────────────────────────────────
  const triggerChallenge = useCallback(async (word, atSec) => {
    try { ytPlayerRef.current?.pauseVideo() } catch (_) {}
    setPaused(true)

    try {
      const vocabEntry = vocabulary.find(v => v.word === word)
      const dynamic    = await fetchDynamicWordEntry(word, languageRef.current)
      // Vocab entries have curated emoji + translations; use them when available
      const wordEntry = {
        word,
        emoji:        vocabEntry?.emoji                                ?? '🔤',
        imageQuery:   vocabEntry?.imageQuery                           ?? word,
        translations: vocabEntry
          ? { ...dynamic.translations, ...vocabEntry.translations }   // vocab wins
          : dynamic.translations,
        isDynamic:  !vocabEntry,
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
    const word = activeWordRef.current?.word
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

    if (inChallengeRef.current) return

    const next = scheduleRef.current.find(s => !s.fired && currentTime >= s.timeSec)
    if (next) {
      next.fired = true
      inChallengeRef.current = true
      triggerChallenge(next.word, currentTime)
    }
  }, [triggerChallenge])

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleStart = useCallback((url, lang, interval = 60) => {
    const id = extractVideoId(url)
    if (!id) return
    scheduleRef.current        = []
    inChallengeRef.current     = false
    activeWordRef.current      = null
    videoTitleRef.current      = ''
    challengeIntervalRef.current = interval
    setVideoId(id)
    setLanguage(lang)
    setChallengeInterval(interval)
    setScore(0)
    setStreak(0)
    setScheduleCount(0)
    setScheduleSource('none')
    setVideoDuration(null)
    setActiveWord(null)
    setPaused(false)
    setVideoError(null)
    setScreen('playing')
  }, [])

  const handleBack = useCallback(() => {
    inChallengeRef.current = false
    activeWordRef.current  = null
    setPaused(false)
    setActiveWord(null)
    setVideoError(null)
    setScreen('setup')
    setVideoId(null)
  }, [])

  const handleVideoError    = useCallback((msg) => setVideoError(msg), [])
  const handleDurationReady = useCallback((dur) => {
    console.log('[duration]', dur, 's')
    setVideoDuration(dur)
  }, [])

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = (() => {
    if (transcriptStatus === 'loading') return '📄 Loading captions…'
    if (scheduleSource === 'transcript') return `📄 ${scheduleCount} word${scheduleCount !== 1 ? 's' : ''} from video`
    if (scheduleSource === 'vocab')      return `📚 ${scheduleCount} vocabulary word${scheduleCount !== 1 ? 's' : ''} queued`
    if (transcriptStatus === 'unavailable' && !videoDuration) return '📄 No captions — loading video…'
    return ''
  })()

  // ── Render ────────────────────────────────────────────────────────────────
  if (screen === 'setup') {
    return <SetupScreen onStart={handleStart} stats={stats} />
  }

  return (
    <div className="app-playing">
      <ScoreDisplay score={score} streak={streak} onBack={handleBack} />

      <button className="dict-btn" onClick={() => setShowDict(true)}>
        📚 {stats.total} word{stats.total !== 1 ? 's' : ''}
      </button>

      {statusBadge && (
        <div className={`transcript-badge transcript-badge--${transcriptStatus}`}>
          {statusBadge}
        </div>
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
          onTimeUpdate={handleTimeUpdate}
          onVideoError={handleVideoError}
          onDurationReady={handleDurationReady}
          playerRef={ytPlayerRef}
        />
      )}

      {activeWord && !videoError && (
        <WordChallenge
          wordEntry={activeWord}
          language={language}
          onSuccess={handleSuccess}
          onSkip={handleSkip}
        />
      )}

      {celebration && (
        <div className="celebration-toast">
          ⭐ +{celebration.points} points!
        </div>
      )}

      {showDict && (
        <DictionaryView
          dictionary={dictionary}
          onClose={() => setShowDict(false)}
        />
      )}
    </div>
  )
}
