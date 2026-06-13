import { useState, useCallback } from 'react'

const STORAGE_KEY = 'kids_viewer_video_count'

function load() {
  try { return Number(localStorage.getItem(STORAGE_KEY)) || 0 }
  catch { return 0 }
}

function save(count) {
  try { localStorage.setItem(STORAGE_KEY, String(count)) } catch {}
}

export function useVideoCount() {
  const [count, setCount] = useState(load)

  const increment = useCallback(() => {
    setCount(prev => {
      const next = prev + 1
      save(next)
      return next
    })
  }, [])

  return { count, increment }
}
