import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { version } from '../../package.json'
import SetupScreen from './SetupScreen'

vi.mock('./AccountMenu', () => ({ default: () => <div data-testid="account-menu" /> }))

describe('SetupScreen', () => {
  afterEach(() => { vi.restoreAllMocks(); localStorage.clear() })

  it('renders the title and current app version', () => {
    render(<SetupScreen onStart={() => {}} stats={null} />)
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
    expect(screen.getByText(`v${version}`)).toBeInTheDocument()
  })

  it('calls onHelpOpen when the help button is clicked', () => {
    const onHelpOpen = vi.fn()
    render(<SetupScreen onStart={() => {}} stats={null} onHelpOpen={onHelpOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /help/i }))
    expect(onHelpOpen).toHaveBeenCalledTimes(1)
  })

  it('defaults to Hebrew language and a 1 minute interval', () => {
    render(<SetupScreen onStart={() => {}} stats={null} />)
    expect(screen.getByText('עברית').closest('button').className).toContain('lang-btn--active')
    expect(screen.getByText('1 min').className).toContain('interval-btn--active')
  })

  it('switches the active language when another language is clicked', () => {
    render(<SetupScreen onStart={() => {}} stats={null} />)
    fireEvent.click(screen.getByText('Español').closest('button'))
    expect(screen.getByText('Español').closest('button').className).toContain('lang-btn--active')
    expect(screen.getByText('עברית').closest('button').className).not.toContain('lang-btn--active')
  })

  it('switches the active interval when another interval is clicked', () => {
    render(<SetupScreen onStart={() => {}} stats={null} />)
    fireEvent.click(screen.getByText('2 min'))
    expect(screen.getByText('2 min').className).toContain('interval-btn--active')
    expect(screen.getByText('1 min').className).not.toContain('interval-btn--active')
  })

  it('shows an error and does not start when the URL is invalid', () => {
    const onStart = vi.fn()
    render(<SetupScreen onStart={onStart} stats={null} />)
    fireEvent.change(screen.getByPlaceholderText('Or paste a YouTube link here…'), {
      target: { value: 'not a url' },
    })
    fireEvent.click(screen.getByText('🚀 Start Learning!'))
    expect(screen.getByText('Please enter a valid YouTube URL or video ID')).toBeInTheDocument()
    expect(onStart).not.toHaveBeenCalled()
  })

  it('calls onStart with the url, language and interval when the URL is valid', () => {
    const onStart = vi.fn()
    render(<SetupScreen onStart={onStart} stats={null} />)
    fireEvent.click(screen.getByText('Español').closest('button'))
    fireEvent.click(screen.getByText('2 min'))
    fireEvent.change(screen.getByPlaceholderText('Or paste a YouTube link here…'), {
      target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    })
    fireEvent.click(screen.getByText('🚀 Start Learning!'))
    expect(onStart).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'es', 120, false)
  })

  it('selects a suggested video thumbnail and starts with its URL', () => {
    const onStart = vi.fn()
    render(<SetupScreen onStart={onStart} stats={null} />)
    const thumb = screen.getByTitle('Peppa Pig 🐷')
    fireEvent.click(thumb)
    expect(thumb.className).toContain('thumb-btn--selected')
    fireEvent.click(screen.getByText('🚀 Start Learning!'))
    expect(onStart).toHaveBeenCalledWith('https://www.youtube.com/watch?v=I9-FpvBSN-o', 'he', 60, false)
  })

  it('starts with skipSpeech=true when the pictures-only box is checked', () => {
    const onStart = vi.fn()
    render(<SetupScreen onStart={onStart} stats={null} />)
    fireEvent.click(screen.getByText('Peppa Pig 🐷'))
    fireEvent.click(screen.getByRole('checkbox', { name: /skip speaking/i }))
    fireEvent.click(screen.getByText('🚀 Start Learning!'))
    expect(onStart).toHaveBeenCalledWith('https://www.youtube.com/watch?v=I9-FpvBSN-o', 'he', 60, true)
  })

  it('remembers the pictures-only preference across renders via localStorage', () => {
    const onStart = vi.fn()
    const { unmount } = render(<SetupScreen onStart={onStart} stats={null} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /skip speaking/i }))
    unmount()
    render(<SetupScreen onStart={onStart} stats={null} />)
    expect(screen.getByRole('checkbox', { name: /skip speaking/i })).toBeChecked()
  })

  it('hides the dictionary stats when there are no learned words', () => {
    render(<SetupScreen onStart={() => {}} stats={{ total: 0, mastered: 0 }} />)
    expect(screen.queryByText(/words? learned/)).not.toBeInTheDocument()
  })

  it('shows dictionary stats with mastered count when words have been learned', () => {
    render(<SetupScreen onStart={() => {}} stats={{ total: 5, mastered: 2 }} />)
    expect(screen.getByText(/5 words learned/)).toBeInTheDocument()
    expect(screen.getByText(/2 mastered/)).toBeInTheDocument()
  })

  it('shows singular "word" when exactly one word has been learned', () => {
    render(<SetupScreen onStart={() => {}} stats={{ total: 1, mastered: 0 }} />)
    expect(screen.getByText(/1 word learned/)).toBeInTheDocument()
  })

  it('searches videos and renders results on submit', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.startsWith('/api/search')) {
        return Promise.resolve({
          ok: true,
          json: async () => ([{ id: 'abc12345678', title: 'Cool Video', channel: 'Cool Channel', duration: '3:00' }]),
        })
      }
      return Promise.resolve({ ok: true, json: async () => ([]) })
    }))
    render(<SetupScreen onStart={() => {}} stats={null} />)
    const input = screen.getByPlaceholderText(/animals for kids/)
    fireEvent.change(input, { target: { value: 'cool video search' } })
    fireEvent.submit(input.closest('form'))
    await waitFor(() => expect(screen.getByText('Cool Video')).toBeInTheDocument())
    expect(screen.getByText('Cool Channel')).toBeInTheDocument()
  })

  it('shows an error message when the search request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))
    render(<SetupScreen onStart={() => {}} stats={null} />)
    const input = screen.getByPlaceholderText(/animals for kids/)
    fireEvent.change(input, { target: { value: 'cool video search' } })
    fireEvent.submit(input.closest('form'))
    await waitFor(() => expect(screen.getByText('Search failed — check your connection and try again.')).toBeInTheDocument())
  })

  it('shows an empty message when the search returns no results', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ([]) }))
    render(<SetupScreen onStart={() => {}} stats={null} />)
    const input = screen.getByPlaceholderText(/animals for kids/)
    fireEvent.change(input, { target: { value: 'cool video search' } })
    fireEvent.submit(input.closest('form'))
    await waitFor(() => expect(screen.getByText('No results found. Try different keywords.')).toBeInTheDocument())
  })
})
