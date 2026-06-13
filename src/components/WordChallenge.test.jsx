import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import WordChallenge from './WordChallenge'

// ── Mocks ──────────────────────────────────────────────────────────────────────

// TTS: all async calls resolve immediately so present() completes in one flush
vi.mock('../utils/tts', () => ({
  sleep:            () => Promise.resolve(),
  speakAndWait:     () => Promise.resolve(),
  speakTranslation: () => Promise.resolve(),
  cancelSpeech:     vi.fn(),
  playBeep:         vi.fn(),
  LANG_TTS:         {},
}))

// Speech recognition hook: controlled via module-level vars
let capturedCb = null
const mockStart = vi.fn((cb) => { capturedCb = cb })
const mockStop  = vi.fn()

vi.mock('../hooks/useSpeechRecognition', () => ({
  useSpeechRecognition: () => ({
    listening:      false,
    error:          null,
    supported:      true,
    startListening: mockStart,
    stopListening:  mockStop,
  }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

const WORD_ENTRY = {
  word: 'cat', emoji: '🐱', imageQuery: 'cat',
  translations: { he: 'חתול' },
}

// Flush all the promise chains inside present() (7 awaits × some overhead)
async function flushPresent() {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('WordChallenge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
    mockStop.mockClear()
    capturedCb = null
  })
  afterEach(() => vi.useRealTimers())

  it('starts in presenting phase', () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByText(/Listen carefully/i)).toBeInTheDocument()
  })

  it('displays the English word and its translation', () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('חתול')).toBeInTheDocument()
  })

  it('calls startListening after TTS completes', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).toHaveBeenCalledOnce()
  })

  it('does NOT call stopListening on a wrong answer — mic restarts via startListening', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      capturedCb('dog', ['dog'])       // wrong word
      vi.advanceTimersByTime(200)      // let the 100ms restart schedule fire
    })
    expect(mockStop).not.toHaveBeenCalled()   // no stop on wrong answer
    expect(mockStart).toHaveBeenCalledTimes(2) // mic restarted
  })

  it('calls onSuccess when the correct word is spoken', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      capturedCb('cat', ['cat'])
      vi.advanceTimersByTime(2500)     // 2200ms success schedule
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('accepts a near-match for the correct word', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      capturedCb('kat', ['kat'])       // 1-char edit distance
      vi.advanceTimersByTime(2500)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('calls stopListening and re-presents after the 10s timer expires', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => { vi.advanceTimersByTime(10_000) })  // first timer expires
    expect(mockStop).toHaveBeenCalled()
    // After 800ms fail phase, presenting restarts
    await act(async () => { vi.advanceTimersByTime(1000) })
    await flushPresent()
    expect(mockStart).toHaveBeenCalledTimes(2)  // second listening session
  })

  it('calls onSkip after two timer expiries (no correct answer on either attempt)', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    // First expiry → re-present
    await act(async () => { vi.advanceTimersByTime(10_000) })
    await act(async () => { vi.advanceTimersByTime(1000) })
    await flushPresent()
    // Second expiry → skip
    await act(async () => { vi.advanceTimersByTime(10_000) })
    await act(async () => { vi.advanceTimersByTime(4000) })    // 3500ms skip timer
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('handleFail fires only once even under double-invocation (StrictMode guard)', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    await act(async () => { vi.advanceTimersByTime(10_000) })
    expect(onSkip).not.toHaveBeenCalled()   // still in retry, not skipped yet
  })

  it('skip button calls onSkip immediately without waiting for timers', async () => {
    const onSkip = vi.fn()
    const { getByText } = render(
      <WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />
    )
    await flushPresent()
    await act(async () => { getByText(/Skip for now/i).click() })
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('each wrong answer restarts the mic (mic stays alive across multiple wrong guesses)', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    // Three consecutive wrong answers
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        capturedCb('dog', ['dog'])
        vi.advanceTimersByTime(200)
      })
    }
    // startListening: 1 (auto-start) + 3 (one restart per wrong answer) = 4
    expect(mockStart).toHaveBeenCalledTimes(4)
    expect(mockStop).not.toHaveBeenCalled()
  })

  it('correct answer after a wrong guess still calls onSuccess', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    // Wrong first
    await act(async () => {
      capturedCb('dog', ['dog'])
      vi.advanceTimersByTime(200)
    })
    // Then correct
    await act(async () => {
      capturedCb('cat', ['cat'])
      vi.advanceTimersByTime(2500)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('displays the word and its translation on screen', () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    expect(document.body.textContent).toContain('cat')
    expect(document.body.textContent).toContain('חתול')
  })
})
