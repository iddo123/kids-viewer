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
      setTimeout(() => { if (!stoppedRef.current) _createAndStart(SR) }, 50)
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
        // Keep retrying indefinitely — the challenge timer calls stopListening()
        // when time is up, which sets stoppedRef = true and ends the loop.
        setTimeout(() => { if (!stoppedRef.current) _start(SR) }, 100)
        return
      }

      setError(e.error)
      setListening(false)
    }

    rec.onend = () => setListening(false)

    try {
      rec.start()
    } catch (err) {
      console.warn('[speech] start() threw:', err.message)
      // InvalidStateError means the browser hasn't fully released the previous
      // session yet. Retry after a longer gap rather than giving up.
      if (!stoppedRef.current) {
        setTimeout(() => { if (!stoppedRef.current) _createAndStart(SR) }, 150)
      }
    }
  }

  const stopListening = useCallback(() => {
    stoppedRef.current = true
    recRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, transcript, error, supported, startListening, stopListening }
}
