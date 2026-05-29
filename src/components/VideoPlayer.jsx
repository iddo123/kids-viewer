import { useEffect, useRef } from 'react'
import './VideoPlayer.css'

let apiReady = false
const readyCallbacks = []

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) { apiReady = true; return }
  if (document.getElementById('yt-api-script')) return
  const tag = document.createElement('script')
  tag.id = 'yt-api-script'
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)
  const prev = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true
    prev?.()
    readyCallbacks.forEach(cb => cb())
    readyCallbacks.length = 0
  }
}

function whenReady(cb) {
  if (apiReady) { cb(); return }
  readyCallbacks.push(cb)
}

// YouTube player error codes → human-readable
const YT_ERRORS = {
  2:   'Invalid video ID.',
  5:   'This video cannot play in this browser.',
  100: 'Video not found — it may have been removed.',
  101: 'This video cannot be embedded. Try a different one.',
  150: 'This video cannot be embedded. Try a different one.',
}

export default function VideoPlayer({ videoId, paused, seekTo, onTimeUpdate, onVideoError, onVideoEnd, onContainerReady, onDurationReady, playerRef: externalPlayerRef }) {
  const containerRef = useRef(null)
  const playerRef    = useRef(null)
  const intervalRef     = useRef(null)
  const onTimeUpdateRef = useRef(onTimeUpdate)
  const onVideoErrorRef = useRef(onVideoError)
  const onVideoEndRef   = useRef(onVideoEnd)

  useEffect(() => { onTimeUpdateRef.current = onTimeUpdate }, [onTimeUpdate])
  useEffect(() => { onVideoErrorRef.current = onVideoError }, [onVideoError])
  useEffect(() => { onVideoEndRef.current   = onVideoEnd   }, [onVideoEnd])

  useEffect(() => { loadYouTubeAPI() }, [])

  useEffect(() => {
    if (!videoId) return

    const mountId = `yt-player-${Date.now()}`
    const div = document.createElement('div')
    div.id = mountId
    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(div)

    clearInterval(intervalRef.current)
    playerRef.current?.destroy()
    playerRef.current = null

    const durationSentRef = { current: false }

    whenReady(() => {
      if (!containerRef.current) return

      // Poll every second; only emit time when the player is in PLAYING state (1).
      // Starting in onReady (not just onStateChange) fixes mobile browsers where
      // autoplay is blocked and the user's tap to play doesn't reliably fire onStateChange.
      function startPolling() {
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(() => {
          const p = playerRef.current
          if (!p || typeof p.getCurrentTime !== 'function') return
          if (p.getPlayerState?.() === 1) {
            onTimeUpdateRef.current?.(p.getCurrentTime())
          }
        }, 1000)
      }

      const player = new window.YT.Player(mountId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady(e) {
            e.target.playVideo()
            const dur = e.target.getDuration()
            if (dur > 0 && !durationSentRef.current) {
              durationSentRef.current = true
              onDurationReady?.(dur)
            }
            startPolling()
          },
          onStateChange(e) {
            if (e.data === 0) {          // ended
              onVideoEndRef.current?.()
            }
            if (e.data === 1) {
              // Grab duration once playing — always available here
              if (!durationSentRef.current) {
                const p = playerRef.current
                const dur = p?.getDuration?.()
                if (dur > 0) {
                  durationSentRef.current = true
                  onDurationReady?.(dur)
                }
              }
            }
          },
          onError(e) {
            clearInterval(intervalRef.current)
            const msg = YT_ERRORS[e.data] ?? 'Could not play this video. Try a different one.'
            onVideoErrorRef.current?.(msg)
          },
        },
      })
      playerRef.current = player
      if (externalPlayerRef) externalPlayerRef.current = player
    })

    return () => {
      clearInterval(intervalRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
      if (externalPlayerRef) externalPlayerRef.current = null
    }
  }, [videoId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = playerRef.current
    if (!p || typeof p.pauseVideo !== 'function') return
    paused ? p.pauseVideo() : p.playVideo()
  }, [paused])

  useEffect(() => {
    if (seekTo == null) return
    const p = playerRef.current
    if (!p || typeof p.seekTo !== 'function') return
    p.seekTo(seekTo, true)
    p.playVideo()
  }, [seekTo])

  return (
    <div className="video-wrapper">
      <div ref={el => { containerRef.current = el; onContainerReady?.(el) }} className="video-container" />
    </div>
  )
}
