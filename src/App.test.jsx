import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { useTranscriptWords } from './hooks/useTranscriptWords'
import { useUserDictionary } from './hooks/useUserDictionary'
import { useAuth } from './hooks/useAuth'
import { useSubscription } from './hooks/useSubscription'
import { useVideoCount } from './hooks/useVideoCount'

vi.mock('./hooks/useTranscriptWords', () => ({ useTranscriptWords: vi.fn() }))
vi.mock('./hooks/useUserDictionary', () => ({ useUserDictionary: vi.fn() }))
vi.mock('./hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('./hooks/useSubscription', () => ({ useSubscription: vi.fn() }))
vi.mock('./hooks/useVideoCount', () => ({ useVideoCount: vi.fn() }))

vi.mock('./components/VideoPlayer', () => ({
  default: ({ onTimeUpdate, onVideoError, onVideoEnd }) => (
    <div data-testid="video-player">
      {/* Step in <=4s increments so the "forward seek" skip logic doesn't
          mark the cat@12s schedule entry as fired before it's reached. */}
      <button onClick={() => { onTimeUpdate(4); onTimeUpdate(8); onTimeUpdate(12) }}>advance-time</button>
      <button onClick={() => onVideoError('Video unavailable')}>trigger-error</button>
      <button onClick={() => onVideoEnd()}>trigger-end</button>
    </div>
  ),
}))

vi.mock('./components/WordChallenge', () => ({
  default: ({ wordEntry, onSuccess, onSkip }) => (
    <div data-testid="word-challenge">
      <span>challenge: {wordEntry.word}</span>
      <button onClick={() => onSuccess(50)}>answer-correct</button>
      <button onClick={() => onSkip()}>answer-skip</button>
    </div>
  ),
}))

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
// 'cat' at 10s and 700s -> schedule entries at 12s and 702s (see App.test.js)
const TRANSCRIPT = [{ word: 'cat', startMs: 10000 }, { word: 'cat', startMs: 700000 }]

const start = () => {
  fireEvent.change(screen.getByPlaceholderText('Or paste a YouTube link here…'), {
    target: { value: VALID_URL },
  })
  fireEvent.click(screen.getByText('🚀 Start Learning!'))
}

describe('App', () => {
  beforeEach(() => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: [], status: 'idle' } : { transcriptWords: [], status: 'idle' },
    )
    useUserDictionary.mockReturnValue({
      dictionary: {},
      recordAttempt: vi.fn(),
      stats: { total: 0, mastered: 0 },
    })
    useAuth.mockReturnValue({
      user: { id: 'user-1', email: 'parent@example.com' },
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    })
    useSubscription.mockReturnValue({
      status: 'active',
      isActive: true,
      loading: false,
      refresh: vi.fn(),
    })
    useVideoCount.mockReturnValue({ count: 0, increment: vi.fn() })
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders nothing while the auth state is loading', () => {
    useAuth.mockReturnValue({ user: null, loading: true, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    const { container } = render(<App />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the sign-in screen when there is no authenticated user', () => {
    useAuth.mockReturnValue({ user: null, loading: false, signIn: vi.fn(), signUp: vi.fn(), signOut: vi.fn() })
    render(<App />)
    expect(screen.getByText('Sign in to start the adventure')).toBeInTheDocument()
    expect(screen.queryByText('🚀 Start Learning!')).not.toBeInTheDocument()
  })

  it('shows the setup screen on first render', () => {
    render(<App />)
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
  })

  it('transitions to the playing screen after starting a video', () => {
    render(<App />)
    start()
    expect(screen.getByTestId('video-player')).toBeInTheDocument()
    expect(screen.getByText('← Back')).toBeInTheDocument()
  })

  it('counts a video toward the free limit only once its captions load', () => {
    const increment = vi.fn()
    useVideoCount.mockReturnValue({ count: 0, increment })
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: TRANSCRIPT, status: 'ready' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    expect(increment).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('video-player')).toBeInTheDocument()
  })

  it('does NOT count a video whose captions fail to load', () => {
    const increment = vi.fn()
    useVideoCount.mockReturnValue({ count: 0, increment })
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: [], status: 'unavailable' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    expect(increment).not.toHaveBeenCalled()
    expect(screen.getByTestId('video-player')).toBeInTheDocument()
  })

  it('shows the upgrade prompt instead of starting once the free video limit is reached', () => {
    const increment = vi.fn()
    useSubscription.mockReturnValue({ status: 'free', isActive: false, loading: false, refresh: vi.fn() })
    useVideoCount.mockReturnValue({ count: 3, increment })
    render(<App />)
    start()
    expect(screen.getByText('Keep the adventure going!')).toBeInTheDocument()
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument()
    expect(increment).not.toHaveBeenCalled()
  })

  it('closes the upgrade prompt without starting a video', () => {
    useSubscription.mockReturnValue({ status: 'free', isActive: false, loading: false, refresh: vi.fn() })
    useVideoCount.mockReturnValue({ count: 3, increment: vi.fn() })
    render(<App />)
    start()
    fireEvent.click(screen.getByText('Maybe later'))
    expect(screen.queryByText('Keep the adventure going!')).not.toBeInTheDocument()
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
  })

  it('returns to the setup screen via the back button', () => {
    render(<App />)
    start()
    fireEvent.click(screen.getByText('← Back'))
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
  })

  it('shows a loading badge while the transcript is loading', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: [], status: 'loading' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    expect(screen.getByText('📄 Loading captions…')).toBeInTheDocument()
  })

  it('shows a no-captions banner when the transcript is unavailable', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: [], status: 'unavailable' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    expect(screen.getByText('📄 No captions — no challenges for this video')).toBeInTheDocument()
    expect(screen.getByText('No captions found for this video')).toBeInTheDocument()
  })

  it('builds and displays the word schedule from the transcript', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: TRANSCRIPT, status: 'ready' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    expect(screen.getByText('📄 2 words from video')).toBeInTheDocument()

    fireEvent.click(screen.getByText('📄 2 words from video'))
    expect(screen.getByText('🗓 Word Schedule')).toBeInTheDocument()
    expect(screen.getAllByText('cat').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByText('✕'))
    expect(screen.queryByText('🗓 Word Schedule')).not.toBeInTheDocument()
  })

  it('triggers a word challenge once playback reaches the scheduled time', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: TRANSCRIPT, status: 'ready' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    fireEvent.click(screen.getByText('advance-time'))
    expect(screen.getByTestId('word-challenge')).toBeInTheDocument()
    expect(screen.getByText('challenge: cat')).toBeInTheDocument()
  })

  it('awards points and shows a celebration on a correct answer', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: TRANSCRIPT, status: 'ready' } : { transcriptWords: [], status: 'idle' },
    )
    render(<App />)
    start()
    fireEvent.click(screen.getByText('advance-time'))
    fireEvent.click(screen.getByText('answer-correct'))
    expect(screen.getByText('⭐ +50 points!')).toBeInTheDocument()
    expect(screen.queryByTestId('word-challenge')).not.toBeInTheDocument()
  })

  it('shows a level-up celebration when an already-seen word is answered correctly', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: TRANSCRIPT, status: 'ready' } : { transcriptWords: [], status: 'idle' },
    )
    useUserDictionary.mockReturnValue({
      dictionary: { cat: { timesCorrect: 0, timesWrong: 1, firstSeen: 1, lastSeen: 1 } },
      recordAttempt: vi.fn(),
      stats: { total: 1, mastered: 0 },
    })
    render(<App />)
    start()
    fireEvent.click(screen.getByText('advance-time'))
    fireEvent.click(screen.getByText('answer-correct'))
    expect(screen.getByText('Level Up!')).toBeInTheDocument()
  })

  it('resets the streak and records a miss on skip', () => {
    useTranscriptWords.mockImplementation((videoId) =>
      videoId ? { transcriptWords: TRANSCRIPT, status: 'ready' } : { transcriptWords: [], status: 'idle' },
    )
    const recordAttempt = vi.fn()
    useUserDictionary.mockReturnValue({ dictionary: {}, recordAttempt, stats: { total: 0, mastered: 0 } })
    render(<App />)
    start()
    fireEvent.click(screen.getByText('advance-time'))
    fireEvent.click(screen.getByText('answer-skip'))
    expect(recordAttempt).toHaveBeenCalledWith('cat', false)
    expect(screen.queryByTestId('word-challenge')).not.toBeInTheDocument()
  })

  it('opens and closes the dictionary view', () => {
    render(<App />)
    start()
    fireEvent.click(screen.getByText('📚 0 words'))
    expect(screen.getByText('No words yet — watch a video to start learning!')).toBeInTheDocument()
    fireEvent.click(screen.getByText('✕'))
    expect(screen.queryByText('No words yet — watch a video to start learning!')).not.toBeInTheDocument()
  })

  it('shows a video error screen and can navigate back from it', () => {
    render(<App />)
    start()
    fireEvent.click(screen.getByText('trigger-error'))
    expect(screen.getByText('Video unavailable')).toBeInTheDocument()
    fireEvent.click(screen.getByText('← Pick a different video'))
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
  })

  it('shows the end-of-video overlay and supports watching again', () => {
    render(<App />)
    start()
    fireEvent.click(screen.getByText('trigger-end'))
    expect(screen.getByText('Great watching!')).toBeInTheDocument()
    fireEvent.click(screen.getByText('🔁 Watch again'))
    expect(screen.queryByText('Great watching!')).not.toBeInTheDocument()
  })

  it('returns to setup from the end-of-video overlay', () => {
    render(<App />)
    start()
    fireEvent.click(screen.getByText('trigger-end'))
    fireEvent.click(screen.getByText('🔍 Find another video'))
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
  })
})
