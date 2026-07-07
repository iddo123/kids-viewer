import { useState, useRef, useCallback } from 'react'

export function useSpeechRecognition() {
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError]           = useState(null)
  const [supported] = useState(() =>
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recRef          = useRef(null)
  const onResultRef     = useRef(null)
  const stoppedRef      = useRef(false)   // true when we intentionally stopped
  const restartTimerRef = useRef(null)    // pending silence-restart timeout id

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('not-supported'); return }

    onResultRef.current = onResult
    stoppedRef.current  = false
    setTranscript('')
    setError(null)

    _start(SR)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function _start(SR) {
    const prev = recRef.current
    recRef.current = null
    if (prev) {
      // Null all handlers before abort — some browsers fire onerror('aborted')
      // on an already-completed session, which would incorrectly switch to typing mode.
      prev.onend    = null
      prev.onerror  = null
      prev.onresult = null
      try { prev.abort() } catch (_) {}
      // Small gap so the browser fully releases the previous session.
      // Without this, some browsers refuse start() on the new instance.
      restartTimerRef.current = setTimeout(() => { if (!stoppedRef.current) _createAndStart(SR) }, 50)
    } else {
      _createAndStart(SR)
    }
  }

  function _createAndStart(SR) {
    const rec = new SR()
    rec.lang            = 'en-US'
    rec.continuous      = false
    rec.interimResults  = false
    rec.maxAlternatives = 5   // grab as many alternatives as possible

    recRef.current = rec

    rec.onstart = () => setListening(true)

    rec.onresult = (e) => {
      // Collect every alternative from every result segment
      const alts = []
      for (let i = 0; i < e.results.length; i++) {
        for (let j = 0; j < e.results[i].length; j++) {
          const t = e.results[i][j].transcript?.trim()
          if (t) alts.push(t)
        }
      }
      const best = alts[0] || ''
      setTranscript(best)
      setListening(false)
      stoppedRef.current = true
      console.log('[speech] heard:', alts)
      onResultRef.current?.(best, alts)   // pass ALL alternatives
    }

    rec.onerror = (e) => {
      console.warn('[speech] error:', e.error)

      if (e.error === 'no-speech' && !stoppedRef.current) {
        // Null onend so it doesn't also schedule a restart — both onerror and onend
        // fire for no-speech, and two concurrent _start() calls race each other.
        // Nulling onend also keeps listening=true so the UI doesn't flicker.
        rec.onend = null
        restartTimerRef.current = setTimeout(() => { if (!stoppedRef.current) _start(SR) }, 100)
        return
      }

      setError(e.error)
      setListening(false)
    }

    rec.onend = () => {
      setListening(false)
      // Browsers can terminate a session silently (no onerror) via auto-timeout
      // or a network hiccup. Restart whenever onend fires without an intentional
      // stop — the no-speech onerror path handles the common silence case but
      // does not cover all browser-side terminations.
      if (!stoppedRef.current) {
        restartTimerRef.current = setTimeout(() => { if (!stoppedRef.current) _start(SR) }, 100)
      }
    }

    try {
      rec.start()
    } catch (err) {
      console.warn('[speech] start() threw:', err.message)
      // Null handlers so the failed rec can't fire stale events after we retry.
      rec.onstart = null; rec.onresult = null; rec.onerror = null; rec.onend = null
      // InvalidStateError: browser hasn't released the previous session yet.
      // Retry after a longer gap rather than giving up.
      if (!stoppedRef.current) {
        restartTimerRef.current = setTimeout(() => { if (!stoppedRef.current) _createAndStart(SR) }, 150)
      }
    }
  }

  const stopListening = useCallback(() => {
    stoppedRef.current = true
    // Cancel any pending silence-restart so the loop can't respawn the mic.
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null }
    const rec = recRef.current
    recRef.current = null
    if (rec) {
      // Null every handler first so the forced stop can't fire onend/onerror
      // and schedule another restart, then hard-abort to release the mic now.
      rec.onstart = null; rec.onresult = null; rec.onerror = null; rec.onend = null
      try { rec.abort() } catch (_) {}
      try { rec.stop() } catch (_) {}
    }
    setListening(false)
  }, [])

  return { listening, transcript, error, supported, startListening, stopListening }
}
