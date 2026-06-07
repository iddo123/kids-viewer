import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSpeechRecognition } from './useSpeechRecognition'

// ── Controllable SpeechRecognition stub ────────────────────────────────────────
class MockSR {
  constructor() { MockSR.latest = this }
  start    = vi.fn()
  stop     = vi.fn()
  abort    = vi.fn()
  onstart  = null
  onresult = null
  onerror  = null
  onend    = null

  fireStart()      { this.onstart?.() }
  fireResult(text) { this.onresult?.({ results: [[{ transcript: text }]] }) }
  fireError(code)  { this.onerror?.({ error: code }) }
  fireEnd()        { this.onend?.() }
}
MockSR.latest = null

beforeEach(() => {
  MockSR.latest = null
  window.SpeechRecognition = MockSR
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  delete window.SpeechRecognition
})

describe('useSpeechRecognition', () => {
  it('sets listening=true when the browser fires onstart', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    act(() => MockSR.latest.fireStart())
    expect(result.current.listening).toBe(true)
  })

  it('delivers result to callback and sets listening=false', () => {
    const cb = vi.fn()
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(cb))
    act(() => MockSR.latest.fireStart())
    act(() => MockSR.latest.fireResult('cat'))
    expect(result.current.listening).toBe(false)
    expect(cb).toHaveBeenCalledWith('cat', expect.any(Array))
  })

  it('retries on no-speech without setting an error', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    const first = MockSR.latest
    act(() => first.fireError('no-speech'))
    act(() => vi.advanceTimersByTime(200))
    expect(MockSR.latest).not.toBe(first)   // new session created
    expect(result.current.error).toBeNull()
  })

  it('restarts when onend fires without a prior result (browser auto-timeout)', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    const first = MockSR.latest
    act(() => first.fireStart())
    act(() => first.fireEnd())              // no result — silent termination
    act(() => vi.advanceTimersByTime(200))
    expect(MockSR.latest).not.toBe(first)  // restarted
  })

  it('does NOT restart when onend follows a successful result', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    const first = MockSR.latest
    act(() => first.fireStart())
    act(() => first.fireResult('dog'))
    act(() => first.fireEnd())
    act(() => vi.advanceTimersByTime(200))
    expect(MockSR.latest).toBe(first)      // no new session
  })

  it('stopListening prevents restart after no-speech', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    const first = MockSR.latest
    act(() => result.current.stopListening())
    act(() => first.fireError('no-speech'))
    act(() => vi.advanceTimersByTime(200))
    expect(MockSR.latest).toBe(first)      // no restart
  })

  it('stopListening prevents restart after silent onend', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    const first = MockSR.latest
    act(() => first.fireStart())
    act(() => result.current.stopListening())
    act(() => first.fireEnd())
    act(() => vi.advanceTimersByTime(200))
    expect(MockSR.latest).toBe(first)
  })

  it('does not set error when rec.start() throws — schedules a retry instead', () => {
    class ThrowingSR {
      start    = vi.fn(() => { throw new Error('InvalidStateError') })
      stop     = vi.fn(); abort = vi.fn()
      onstart  = null; onresult = null; onerror = null; onend = null
    }
    window.SpeechRecognition = ThrowingSR
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    expect(result.current.error).toBeNull()
  })

  it('nulls handlers on aborted previous session to prevent stale events', () => {
    const { result } = renderHook(() => useSpeechRecognition())
    act(() => result.current.startListening(vi.fn()))
    const first = MockSR.latest
    act(() => first.fireStart())
    // Start a second session — should null first's handlers before aborting
    act(() => result.current.startListening(vi.fn()))
    expect(first.onend).toBeNull()
    expect(first.onerror).toBeNull()
    expect(first.onresult).toBeNull()
  })
})
