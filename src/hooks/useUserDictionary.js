import { useState, useCallback } from 'react'

const STORAGE_KEY = 'kids_viewer_dictionary'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} }
  catch { return {} }
}

function save(dict) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dict)) } catch {}
}

// Level: 0=never seen  1=seen but no correct yet  2=learning (1-2 correct)  3=mastered (3+ correct)
export function useUserDictionary() {
  const [dictionary, setDictionary] = useState(load)

  const recordAttempt = useCallback((word, correct) => {
    setDictionary(prev => {
      const e = prev[word] || { timesCorrect: 0, timesWrong: 0, firstSeen: Date.now() }
      const updated = {
        ...prev,
        [word]: {
          ...e,
          timesCorrect: correct ? e.timesCorrect + 1 : e.timesCorrect,
          timesWrong:   correct ? e.timesWrong       : e.timesWrong + 1,
          lastSeen: Date.now(),
        },
      }
      save(updated)
      return updated
    })
  }, [])

  const stats = {
    total:    Object.keys(dictionary).length,
    mastered: Object.values(dictionary).filter(e => e.timesCorrect >= 3).length,
    learning: Object.values(dictionary).filter(e => e.timesCorrect >= 1 && e.timesCorrect < 3).length,
  }

  return { dictionary, recordAttempt, stats }
}
