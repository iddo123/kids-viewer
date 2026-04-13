import { useState, useCallback, useRef, useEffect } from 'react'
import SetupScreen        from './components/SetupScreen'
import ScreenSharePrompt  from './components/ScreenSharePrompt'
import VideoPlayer        from './components/VideoPlayer'
import WordChallenge      from './components/WordChallenge'
import ScoreDisplay       from './components/ScoreDisplay'
import { extractVideoId }        from './utils/helpers'
import { fetchDynamicWordEntry } from './utils/transcript'
import { useObjectDetection }    from './hooks/useObjectDetection'
import { useScreenDetection }    from './hooks/useScreenDetection'
import './App.css'

export default function App() {
  // screen: 'setup' | 'permission' | 'playing'
  const [screen, setScreen]           = useState('setup')
  const [videoId, setVideoId]         = useState(null)
  const [language, setLanguage]       = useState('he')
  const [paused, setPaused]           = useState(false)
  const [activeWord, setActiveWord]   = useState(null)
  const [score, setScore]             = useState(0)
  const [streak, setStreak]           = useState(0)
  const [celebration, setCelebration] = useState(null)
  const [videoError, setVideoError]   = useState(null)
  const [videoDuration, setVideoDuration] = useState(null)
  const [debugSchedule, setDebugSchedule] = useState([])  // for debug panel
  const [seekTo, setSeekTo]           = useState(null)

  // Refs used inside callbacks
  const languageRef    = useRef(language)
  const inChallengeRef = useRef(false)
  const isPausedRef    = useRef(false)     // for screen detection — don't scan while paused
  const currentTimeRef = useRef(0)
  const playerContainerRef = useRef(null)
  const ytPlayerRef        = useRef(null)  // direct YT player handle for instant pause

  useEffect(() => { languageRef.current = language  }, [language])
  useEffect(() => { isPausedRef.current = paused     }, [paused])

  // ── Thumbnail detection (always runs, fallback) ───────────────────────────
  const { objects: thumbObjects, status: thumbStatus } = useObjectDetection(videoId)

  // ── Schedule for thumbnail-based challenges ───────────────────────────────
  const scheduleRef = useRef([])

  const buildSchedule = useCallback((objects, duration) => {
    if (!objects.length) return
    const dur = duration ?? 300
    const prev = scheduleRef.current  // keep fired state across incremental rebuilds
    const schedule = objects
      .filter(obj => obj.timestampPct != null)
      .map(obj => {
        const timeSec = Math.round(obj.timestampPct * dur)
        const existing = prev.find(s => s.obj.label === obj.label && s.timeSec === timeSec)
        return { timeSec, obj, fired: existing ? existing.fired : false }
      })
      .sort((a, b) => a.timeSec - b.timeSec)
    if (!schedule.length) return
    scheduleRef.current = schedule
    setDebugSchedule(schedule.map(s => ({ label: s.obj.label, timeSec: s.timeSec })))
    console.log('[schedule] built:', schedule.map(s => `${s.obj.label}@${s.timeSec}s${s.fired ? '✓' : ''}`).join(' → '), `(duration=${dur}s)`)
  }, [])

  useEffect(() => {
    if (!thumbObjects.length) return
    buildSchedule(thumbObjects, videoDuration)
  }, [thumbObjects, videoDuration, buildSchedule])

  // ── Core challenge trigger ────────────────────────────────────────────────
  const triggerChallenge = useCallback(async (obj, atSec) => {
    try { ytPlayerRef.current?.pauseVideo() } catch (_) {}
    setPaused(true)
    isPausedRef.current = true

    try {
      // Grab the actual paused frame if screen capture is active
      const screenSnap = captureFrame()

      const base = await fetchDynamicWordEntry(obj.label, languageRef.current)
      setActiveWord({
        ...base,
        frameUrl:    screenSnap ? screenSnap.dataUrl : obj.frameUrl,
        bbox:        screenSnap ? null               : obj.bbox,
        frameWidth:  screenSnap ? screenSnap.width   : obj.frameWidth,
        frameHeight: screenSnap ? screenSnap.height  : obj.frameHeight,
        foundAtSec:  Math.round(atSec),
      })
    } catch (err) {
      console.warn('[challenge] error, resuming:', err)
      try { ytPlayerRef.current?.playVideo() } catch (_) {}
      setPaused(false)
      isPausedRef.current = false
      inChallengeRef.current = false
    }
  }, [])

  // ── Screen detection (live — fires challenge immediately on new object) ───
  const handleObjectFound = useCallback((obj) => {
    if (inChallengeRef.current) return
    inChallengeRef.current = true
    triggerChallenge(obj, currentTimeRef.current)
  }, [triggerChallenge])

  const { status: screenStatus, startCapture, stopCapture, captureVideoRef } = useScreenDetection({
    playerContainerRef,
    onObjectFound: handleObjectFound,
    isPausedRef,
  })

  // Plain function — no hook, no count change.
  // Grabs the actual paused video frame when screen capture is active.
  function captureFrame() {
    const vid       = captureVideoRef.current
    const container = playerContainerRef.current
    if (!vid || !container || vid.readyState < 2) return null
    const rect = container.getBoundingClientRect()
    const dpr  = window.devicePixelRatio || 1
    const w    = Math.round(rect.width  * dpr)
    const h    = Math.round(rect.height * dpr)
    if (w <= 0 || h <= 0) return null
    const canvas = document.createElement('canvas')
    canvas.width  = w
    canvas.height = h
    canvas.getContext('2d').drawImage(
      vid,
      Math.round(rect.left * dpr), Math.round(rect.top * dpr), w, h,
      0, 0, w, h
    )
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), width: w, height: h }
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = useCallback((url, lang) => {
    const id = extractVideoId(url)
    if (!id) return
    scheduleRef.current    = []
    inChallengeRef.current = false
    setVideoId(id)
    setLanguage(lang)
    setVideoDuration(null)
    setScore(0)
    setStreak(0)
    setActiveWord(null)
    setPaused(false)
    setVideoError(null)
    setScreen('permission')   // show explanation before asking for permission
  }, [])

  // Called when user clicks "Share this tab" — THIS click is the user gesture
  const handleShareClick = useCallback(async () => {
    setScreen('playing')       // show video immediately
    await startCapture()       // request permission (gesture is still active)
  }, [startCapture])

  const handleSkipShare = useCallback(() => {
    setScreen('playing')       // skip to playing with thumbnail-only detection
  }, [])

  const handleBack = useCallback(() => {
    stopCapture()
    inChallengeRef.current = false
    setPaused(false)
    setActiveWord(null)
    setVideoError(null)
    setScreen('setup')
    setVideoId(null)
    setVideoDuration(null)
  }, [stopCapture])

  const handleVideoError    = useCallback((msg) => setVideoError(msg), [])
  const handleDurationReady = useCallback((dur) => {
    console.log('[duration] video duration received:', dur, 's')
    setVideoDuration(dur)
  }, [])

  const handleTimeUpdate = useCallback((currentTime) => {
    currentTimeRef.current = currentTime

    // Log every ~5s: confirms the tick is running and shows schedule state
    if (Math.round(currentTime) % 5 === 0 && Math.round(currentTime) !== 0) {
      const sched = scheduleRef.current
      console.log(
        `[tick] t=${Math.round(currentTime)}s  inChallenge=${inChallengeRef.current}  ` +
        (sched.length
          ? sched.map(s => `${s.obj.label}@${s.timeSec}s${s.fired ? '✓' : ''}`).join(' ')
          : 'schedule empty')
      )
    }

    if (inChallengeRef.current) return

    const sched = scheduleRef.current
    const next = sched.find(s => !s.fired && currentTime >= s.timeSec)
    if (next) {
      console.log(`[challenge] firing for ${next.obj.label} at t=${currentTime.toFixed(1)}s`)
      next.fired = true
      inChallengeRef.current = true
      triggerChallenge(next.obj, currentTime)
    }
  }, [triggerChallenge])

  const dismissChallenge = useCallback((earnedPoints = 0) => {
    if (earnedPoints > 0) {
      setScore(prev => prev + earnedPoints)
      setStreak(prev => prev + 1)
      setCelebration({ points: earnedPoints })
      setTimeout(() => setCelebration(null), 2000)
    } else {
      setStreak(0)
    }
    inChallengeRef.current = false
    isPausedRef.current    = false
    setActiveWord(null)
    setPaused(false)
    ytPlayerRef.current?.playVideo?.()
  }, [])

  const handleSuccess = useCallback((pts) => dismissChallenge(pts), [dismissChallenge])
  const handleSkip    = useCallback(()    => dismissChallenge(0),   [dismissChallenge])

  // ── Debug: jump to a scheduled object's timestamp ────────────────────────
  const handleDebugJump = useCallback((timeSec) => {
    const entry = scheduleRef.current.find(s => s.timeSec === timeSec)
    if (entry) entry.fired = false
    inChallengeRef.current = false
    isPausedRef.current    = false
    setActiveWord(null)
    setPaused(false)
    // Drive seek through VideoPlayer's internal ref (same path as pause/play)
    const target = Math.max(0, timeSec - 2)
    setSeekTo(target)
    setTimeout(() => setSeekTo(null), 300)
  }, [])

  // ── Detection status label ────────────────────────────────────────────────
  const detectionBadge = (() => {
    if (screenStatus === 'active')    return '📸 Live scanning'
    if (screenStatus === 'requesting') return '⏳ Waiting for permission…'
    if (thumbStatus   === 'loading')  return '🔍 Scanning thumbnails…'
    if (thumbStatus   === 'ready')    return `🎯 ${thumbObjects.length} object${thumbObjects.length !== 1 ? 's' : ''} found`
    if (thumbStatus   === 'unavailable') return '🤷 No objects found'
    return ''
  })()

  // ── Render ────────────────────────────────────────────────────────────────

  if (screen === 'setup') {
    return <SetupScreen onStart={handleStart} />
  }

  if (screen === 'permission') {
    return <ScreenSharePrompt onShare={handleShareClick} onSkip={handleSkipShare} />
  }

  return (
    <div className="app-playing">
      <ScoreDisplay score={score} streak={streak} onBack={handleBack} />

      <div className={`transcript-badge transcript-badge--${screenStatus === 'active' ? 'ready' : thumbStatus}`}>
        {detectionBadge}
      </div>

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
          seekTo={seekTo}
          onTimeUpdate={handleTimeUpdate}
          onVideoError={handleVideoError}
          onDurationReady={handleDurationReady}
          onContainerReady={el => { playerContainerRef.current = el }}
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

      {debugSchedule.length > 0 && (
        <div className="debug-bar">
          <span className="debug-bar__label">🔍 Jump to:</span>
          {debugSchedule.map(({ label, timeSec }) => {
            const m = Math.floor(timeSec / 60)
            const s = String(timeSec % 60).padStart(2, '0')
            return (
              <button
                key={`${label}-${timeSec}`}
                className="debug-bar__btn"
                onClick={() => handleDebugJump(timeSec)}
              >
                {label} {m}:{s}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
