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

// Speech recognition hook: controlled via module-level vars (speech is disabled
// in the component for now, but the hook is still imported so we keep the mock)
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

// Flush all the promise chains inside present() (7 awaits × some overhead)
async function flushPresent() {
  await act(async () => {
    for (let i = 0; i < 20; i++) await Promise.resolve()
  })
}

// The clickable picture cards (each has aria-label = the option word)
function choiceCards() {
  return Array.from(document.querySelectorAll('.choice-card'))
}
function wrongCards() {
  return choiceCards().filter(c => c.getAttribute('aria-label') !== 'cat')
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('WordChallenge (tap-the-picture)', () => {
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

  it('does NOT start the microphone (speech answering is disabled)', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).not.toHaveBeenCalled()
  })

  it('shows three distinct picture options after TTS completes', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    const cards = choiceCards()
    expect(cards).toHaveLength(3)
    // one of them is the correct word
    expect(cards.some(c => c.getAttribute('aria-label') === 'cat')).toBe(true)
    // every emoji is unique
    const emojis = cards.map(c => c.textContent)
    expect(new Set(emojis).size).toBe(3)
  })

  it('calls onSuccess when the correct picture is tapped', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      screen.getByRole('button', { name: 'cat' }).click()
      vi.advanceTimersByTime(1200)   // 1100ms success schedule
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('rules out a wrong picture and keeps the challenge open', async () => {
    const onSuccess = vi.fn()
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={onSkip} />)
    await flushPresent()
    await act(async () => { wrongCards()[0].click() })
    expect(screen.getByText(/try again/i)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
    expect(onSkip).not.toHaveBeenCalled()
    // a correct tap afterwards still succeeds (for reduced points)
    await act(async () => {
      screen.getByRole('button', { name: 'cat' }).click()
      vi.advanceTimersByTime(1200)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('reveals the answer and skips after both wrong pictures are tapped', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    const wrong = wrongCards()
    await act(async () => { wrong[0].click() })
    await act(async () => { wrong[1].click() })
    expect(screen.getByText(/The word is:/i)).toBeInTheDocument()
    await act(async () => { vi.advanceTimersByTime(4000) })   // 3500ms skip timer
    expect(onSkip).toHaveBeenCalledOnce()
  })

  it('skips after the 10s timer expires with no answer', async () => {
    const onSkip = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={onSkip} />)
    await flushPresent()
    await act(async () => { vi.advanceTimersByTime(10_000) })   // timer expiry → reveal
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

// ── Syllable breakdown (presentation — unaffected by answer mode) ────────────

describe('WordChallenge syllable breakdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockSpeakAndWait.mockClear()
  })
  afterEach(() => vi.useRealTimers())

  it('speaks each syllable separately for a multi-syllable word', async () => {
    const entry = { word: 'elephant', emoji: '🐘', imageQuery: 'elephant', translations: { he: 'פיל' } }
    render(<WordChallenge wordEntry={entry} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()

    const spokenWords = mockSpeakAndWait.mock.calls.map(c => c[0])
    expect(spokenWords).toEqual(['elephant', 'e', 'le', 'phant', 'elephant'])
  })

  it('does not add a syllable breakdown for a single-syllable word', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()

    const spokenWords = mockSpeakAndWait.mock.calls.map(c => c[0])
    expect(spokenWords).toEqual(['cat', 'cat'])
  })
})

// ── Speech answering (DISABLED) ──────────────────────────────────────────────
// Kept for when SPEECH_ENABLED is flipped back on in WordChallenge.jsx. These
// describe the microphone flow and only pass while speech answering is active.
describe.skip('WordChallenge (speech mode — disabled)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockStart.mockClear()
    mockStop.mockClear()
    capturedCb = null
  })
  afterEach(() => vi.useRealTimers())

  it('calls startListening after TTS completes', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    expect(mockStart).toHaveBeenCalledOnce()
  })

  it('calls onSuccess when the correct word is spoken', async () => {
    const onSuccess = vi.fn()
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={onSuccess} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      capturedCb('cat', ['cat'])
      vi.advanceTimersByTime(1200)
    })
    expect(onSuccess).toHaveBeenCalledOnce()
  })

  it('does NOT call stopListening on a wrong answer — mic restarts', async () => {
    render(<WordChallenge wordEntry={WORD_ENTRY} language="he" onSuccess={vi.fn()} onSkip={vi.fn()} />)
    await flushPresent()
    await act(async () => {
      capturedCb('dog', ['dog'])
      vi.advanceTimersByTime(200)
    })
    expect(mockStop).not.toHaveBeenCalled()
    expect(mockStart).toHaveBeenCalledTimes(2)
  })
})
