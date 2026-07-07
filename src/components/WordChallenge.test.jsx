import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import WordChallenge from './WordChallenge'

// ── Mocks ──────────────────────────────────────────────────────────────────────

// TTS: all async calls resolve immediately so present() completes in one flush
const { mockSpeakAndWait } = vi.hoisted(() => ({ mockSpeakAndWait: vi.fn(() => Promise.resolve()) }))
vi.mock('../utils/tts', () => ({
  sleep:            () => Promise.resolve(),
  speakAndWait:     mockSpeakAndWait,
  speakTranslation: () => Promise.resolve(),
  cancelSpeech:     vi.fn(),
  playBeep:         vi.fn(),
  LANG_TTS:         {},
}))

// Speech recognition hook: controlled via module-level vars. The component now
// starts each challenge in speech mode, so tests drive the captured callback to
// simulate the child speaking (correctly or not).
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

// 'cat' is a real vocabulary word, so getChallengeOptions() yields cat + 2
// animal distractors. WORD_ENTRY only needs to drive the presentation/render.
const WORD_ENTRY = {
  word: 'cat', emoji: '🐱', imageQuery: 'cat',
  translations: { he: 'חתול' },
}

// Flush all the promise chains inside present() (several awaits × some overhead)
async function flushPresent() {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

// Simulate a failed spoken attempt to drop into the tap-the-picture fallback.
async function failSpeech() {
  await act(async () => { capturedCb('dog', ['dog']) })
}

// The clickable picture cards (each has aria-label = the option word)
function choiceCards() {
  return Array.from(document.querySelectorAll('.choice-card'))
}
function wrongCards() {
  return choiceCards().filter(c => c.getAttribute('aria-label') !== 'cat')
}

// ── Presentation + speech ────────────────────────────────────────────────────────

describe('WordChallenge (speech first)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
    mockStop.mockClear()
    mockSpeakAndWait.mockClear()
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

  it('starts the microphone after TTS completes', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).toHaveBeenCalled()
  })

  it('does NOT show picture options while still in speech mode', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(choiceCards()).toHaveLength(0)
  })

  it('calls onSuccess when the correct word is spoken', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      capturedCb('cat', ['cat'])
      vi.advanceTimersByTime(1200)   // 1100ms success schedule
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledWith(100)   // full marks for saying it
  })
})

// ── skipSpeech: jump straight to the pictures (no microphone) ────────────────────

describe('WordChallenge (skipSpeech)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
    mockStop.mockClear()
    mockSpeakAndWait.mockClear()
    capturedCb = null
  })
  afterEach(() => vi.useRealTimers())

  it('never starts the mic and shows the pictures directly', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" skipSpeech onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).not.toHaveBeenCalled()
    expect(choiceCards()).toHaveLength(3)
  })

  it('awards full points for a first-try tap when speech is skipped', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" skipSpeech onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      screen.getByRole('button', { name: 'cat' }).click()
      vi.advanceTimersByTime(1200)
    })
    expect(onSuccess).toHaveBeenCalledWith(100)
  })
})

// ── Tap-the-picture fallback (after a failed spoken attempt) ────────────────────

describe('WordChallenge (tap fallback)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
    mockStop.mockClear()
    mockSpeakAndWait.mockClear()
    capturedCb = null
  })
  afterEach(() => vi.useRealTimers())

  it('shows three distinct picture options after a wrong spoken answer', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    await failSpeech()
    const cards = choiceCards()
    expect(cards).toHaveLength(3)
    // one of them is the correct word
    expect(cards.some(c => c.getAttribute('aria-label') === 'cat')).toBe(true)
    // every emoji is unique
    const emojis = cards.map(c => c.textContent)
    expect(new Set(emojis).size).toBe(3)
  })

  it('falls back to the pictures when the speech timer expires', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => { vi.advanceTimersByTime(10_000) })   // listening timeout
    expect(choiceCards()).toHaveLength(3)
  })

  it('awards reduced points when the picture is tapped after a spoken miss', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await failSpeech()
    await act(async () => {
      screen.getByRole('button', { name: 'cat' }).click()
      vi.advanceTimersByTime(1200)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledWith(50)   // one tier down for missing the spoken try
  })

  it('rules out a wrong picture and keeps the challenge open', async () => {
    const onSuccess = vi.fn()
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={onSkip} />)
    await flushPresent()
    await failSpeech()
    await act(async () => { wrongCards()[0].click() })
    expect(screen.getByText(/try again/i)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onSkip).not.toHaveBeenCalled()
    // a correct tap afterwards still succeeds (for further reduced points)
    await act(async () => {
      screen.getByRole('button', { name: 'cat' }).click()
      vi.advanceTimersByTime(1200)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
    expect(onSuccess).toHaveBeenCalledWith(25)
  })

  it('reveals the answer and skips after both wrong pictures are tapped', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    await failSpeech()
    const wrong = wrongCards()
    await act(async () => { wrong[0].click() })
    await act(async () => { wrong[1].click() })
    expect(screen.getByText(/The word is:/i)).toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(4000) })   // 3500ms skip timer
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('reveals the answer and skips if the picture timer also expires', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    await failSpeech()
    await act(async () => { vi.advanceTimersByTime(10_000) })   // tap timer expiry → reveal
    await act(async () => { vi.advanceTimersByTime(4000) })     // 3500ms skip timer
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('skip button calls onSkip immediately without waiting for timers', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    await act(async () => { screen.getByText(/Skip for now/i).click() })
    expect(onSkip).toHaveBeenCalledOnce()
  })
})

// ── Microphone release (the hook auto-restarts through silence, so the mic must
// be explicitly stopped on every exit from the listening phase) ─────────────────

describe('WordChallenge microphone release', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
    mockStop.mockClear()
    mockSpeakAndWait.mockClear()
    capturedCb = null
  })
  afterEach(() => vi.useRealTimers())

  it('stops the mic when skipped mid-listening', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).toHaveBeenCalled()   // we are in the listening phase
    await act(async () => { screen.getByText(/Skip for now/i).click() })
    expect(mockStop).toHaveBeenCalled()
  })

  it('stops the mic when unmounted mid-listening', async () => {
    const { unmount } = render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).toHaveBeenCalled()
    await act(async () => { unmount() })
    expect(mockStop).toHaveBeenCalled()
  })

  it('stops the mic when the speech timer expires (moving to pictures)', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => { vi.advanceTimersByTime(10_000) })
    expect(mockStop).toHaveBeenCalled()
    expect(choiceCards()).toHaveLength(3)
  })
})

// ── Presentation audio (sound out multi-syllable words, say it twice) ────────────

describe('WordChallenge presentation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSpeakAndWait.mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('sounds out a multi-syllable word before repeating it', async () => {
    const entry = { word: 'elephant', emoji: '🐘', imageQuery: 'elephant', translations: { he: 'פיל' } }
    render(<WordChallenge wordEntry={entry} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()

    const spokenWords = mockSpeakAndWait.mock.calls.map(c => c[0])
    // says the whole word first and last, sounding out syllables in between
    expect(spokenWords[0]).toBe('elephant')
    expect(spokenWords[spokenWords.length - 1]).toBe('elephant')
    expect(spokenWords.length).toBeGreaterThan(2)
  })

  it('speaks a single-syllable word exactly twice, without sounding out', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()

    const spokenWords = mockSpeakAndWait.mock.calls.map(c => c[0])
    expect(spokenWords).toEqual(['cat', 'cat'])
  })
})
