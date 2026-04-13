import { useState, useRef, useCallback } from 'react'

export function useSpeechRecognition() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState(null)
  const [supported] = useState(() =>
    !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recRef = useRef(null)

  const startListening = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setError('not-supported')
      return
    }
    setTranscript('')
    setError(null)

    const rec = new SR()
    rec.lang = 'en-US'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 3
    recRef.current = rec

    rec.onstart = () => setListening(true)

    rec.onresult = (e) => {
      // Collect all alternatives from all results
      const texts = []
      for (let i = 0; i < e.results.length; i++) {
        for (let j = 0; j < e.results[i].length; j++) {
          texts.push(e.results[i][j].transcript)
        }
      }
      const best = texts[0] || ''
      setTranscript(best)
      setListening(false)
      onResult?.(best, texts)
    }

    rec.onerror = (e) => {
      console.warn('[speech] error:', e.error)
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
  }, [])

  const stopListening = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  return { listening, transcript, error, supported, startListening, stopListening }
}
