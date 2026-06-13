import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUserDictionary } from './useUserDictionary'

beforeEach(() => localStorage.clear())

describe('useUserDictionary', () => {
  it('starts empty when localStorage has nothing', () => {
    const { result } = renderHook(() => useUserDictionary())
    expect(result.current.dictionary).toEqual({})
    expect(result.current.stats.total).toBe(0)
  })

  it('recordAttempt(word, true) increments timesCorrect', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => result.current.recordAttempt('cat', true))
    expect(result.current.dictionary.cat.timesCorrect).toBe(1)
    expect(result.current.dictionary.cat.timesWrong).toBe(0)
  })

  it('recordAttempt(word, false) increments timesWrong', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => result.current.recordAttempt('cat', false))
    expect(result.current.dictionary.cat.timesWrong).toBe(1)
    expect(result.current.dictionary.cat.timesCorrect).toBe(0)
  })

  it('accumulates multiple attempts for the same word', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => {
      result.current.recordAttempt('cat', true)
      result.current.recordAttempt('cat', true)
      result.current.recordAttempt('cat', false)
    })
    expect(result.current.dictionary.cat.timesCorrect).toBe(2)
    expect(result.current.dictionary.cat.timesWrong).toBe(1)
  })

  it('tracks multiple different words independently', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => {
      result.current.recordAttempt('cat', true)
      result.current.recordAttempt('dog', false)
    })
    expect(result.current.dictionary.cat.timesCorrect).toBe(1)
    expect(result.current.dictionary.dog.timesWrong).toBe(1)
  })

  it('stats.total counts unique words seen', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => {
      result.current.recordAttempt('cat', true)
      result.current.recordAttempt('cat', true)  // same word again
      result.current.recordAttempt('dog', false)
    })
    expect(result.current.stats.total).toBe(2)
  })

  it('stats.mastered counts words with 3+ correct answers', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => {
      result.current.recordAttempt('cat', true)
      result.current.recordAttempt('cat', true)
      result.current.recordAttempt('cat', true)  // mastered
      result.current.recordAttempt('dog', true)  // only 1 correct — not mastered
    })
    expect(result.current.stats.mastered).toBe(1)
  })

  it('stats.learning counts words with 1-2 correct answers', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => {
      result.current.recordAttempt('cat', true)               // learning (1)
      result.current.recordAttempt('dog', true)
      result.current.recordAttempt('dog', true)               // learning (2)
      result.current.recordAttempt('fish', true)
      result.current.recordAttempt('fish', true)
      result.current.recordAttempt('fish', true)              // mastered
    })
    expect(result.current.stats.learning).toBe(2)
    expect(result.current.stats.mastered).toBe(1)
  })

  it('persists to localStorage and reloads on next mount', () => {
    const { result: r1 } = renderHook(() => useUserDictionary())
    act(() => r1.current.recordAttempt('cat', true))

    const { result: r2 } = renderHook(() => useUserDictionary())
    expect(r2.current.dictionary.cat?.timesCorrect).toBe(1)
  })

  it('records firstSeen and lastSeen timestamps', () => {
    const before = Date.now()
    const { result } = renderHook(() => useUserDictionary())
    act(() => result.current.recordAttempt('cat', true))
    const after = Date.now()
    const { firstSeen, lastSeen } = result.current.dictionary.cat
    expect(firstSeen).toBeGreaterThanOrEqual(before)
    expect(lastSeen).toBeLessThanOrEqual(after)
  })

  it('does not overwrite firstSeen on subsequent attempts', () => {
    const { result } = renderHook(() => useUserDictionary())
    act(() => result.current.recordAttempt('cat', true))
    const { firstSeen } = result.current.dictionary.cat
    act(() => result.current.recordAttempt('cat', false))
    expect(result.current.dictionary.cat.firstSeen).toBe(firstSeen)
  })
})
