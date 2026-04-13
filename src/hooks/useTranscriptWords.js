import { useState, useEffect, useRef } from 'react'
import { fetchTranscript, parseJson3Transcript } from '../utils/transcript'

/**
 * Fetches and parses the YouTube transcript for a given videoId.
 * Returns { transcriptWords, status }
 *   status: 'idle' | 'loading' | 'ready' | 'unavailable'
 */
export function useTranscriptWords(videoId) {
  const [transcriptWords, setTranscriptWords] = useState([])
  const [status, setStatus] = useState('idle')
  const fetchedForRef = useRef(null)

  useEffect(() => {
    if (!videoId) return
    // Don't re-fetch the same video (e.g. StrictMode double-run)
    if (fetchedForRef.current === videoId) return
    fetchedForRef.current = videoId

    setTranscriptWords([])
    setStatus('loading')

    fetchTranscript(videoId)
      .then(raw => {
        if (!raw) { setStatus('unavailable'); return }
        const words = parseJson3Transcript(raw)
        setTranscriptWords(words)
        setStatus(words.length > 0 ? 'ready' : 'unavailable')
      })
      .catch(() => setStatus('unavailable'))
  }, [videoId])

  // Reset when videoId is cleared (user goes back to setup)
  useEffect(() => {
    if (!videoId) {
      setTranscriptWords([])
      setStatus('idle')
      fetchedForRef.current = null
    }
  }, [videoId])

  return { transcriptWords, status }
}
