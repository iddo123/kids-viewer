import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useVideoCount } from './useVideoCount'

const STORAGE_KEY = 'kids_viewer_video_count'

beforeEach(() => {
  localStorage.clear()
})

describe('useVideoCount', () => {
  it('starts at 0 when nothing is stored', () => {
    const { result } = renderHook(() => useVideoCount())
    expect(result.current.count).toBe(0)
  })

  it('loads a previously stored count', () => {
    localStorage.setItem(STORAGE_KEY, '5')
    const { result } = renderHook(() => useVideoCount())
    expect(result.current.count).toBe(5)
  })

  it('increments and persists to localStorage', () => {
    const { result } = renderHook(() => useVideoCount())
    act(() => result.current.increment())
    expect(result.current.count).toBe(1)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')

    act(() => result.current.increment())
    expect(result.current.count).toBe(2)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('2')
  })
})
