import { useState, useRef, useCallback } from 'react'

const MAX_NO_SPEECH_RETRIES = 4   // auto-restart mic this many times on silence

export function useSpeechRecognition() {
  const [listening, setListening]   = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError]           = useState(null)
  const [supported] = useState(() =>
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recRef          = useRef(null)
  const onResultRef     = useRef(null)
  const retriesRef      = useRef(0)
  const stoppedRef      = useRef(false)   // true when we intentionally stopped

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('not-supported'); return }

    onResultRef.current = onResult
    retriesRef.current  = 0
    stoppedRef.current  = false
    setTranscript('')
    setError(null)

    _start(SR)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function _start(SR) {
    const prev = recRef.current
    recRef.current = null
    if (prev) {
      prev.onend = null   // prevent stale onend from firing after we move on
      try { prev.abort() } catch (_) {}
    }

    // Small gap so the browser fully releases the previous session before we open a new one.
    // Without this, some browsers refuse start() on the new instance.
    setTimeout(() => {
      if (stoppedRef.current) return
      _createAndStart(SR)
    }, 50)
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
        // Auto-restart on silence — kid may just be slow to respond
        if (retriesRef.current < MAX_NO_SPEECH_RETRIES) {
          retriesRef.current++
          console.log(`[speech] no-speech — retrying (${retriesRef.current}/${MAX_NO_SPEECH_RETRIES})`)
          setTimeout(() => {
            if (!stoppedRef.current) _start(SR)
          }, 100)
          return
        }
      }

      setError(e.error)
      setListening(false)
    }

    rec.onend = () => setListening(false)

    try {
      rec.start()
    } catch (err) {
      console.warn('[speech] start() threw:', err.message)
      setError('not-supported')
      setListening(false)
    }
  }

  const stopListening = useCallback(() => {
    stoppedRef.current = true
    recRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, transcript, error, supported, startListening, stopListening }
}
