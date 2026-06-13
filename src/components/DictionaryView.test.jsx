import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DictionaryView from './DictionaryView'

describe('DictionaryView', () => {
  it('shows the empty state when the dictionary has no entries', () => {
    render(<DictionaryView dictionary={{}} onClose={() => {}} />)
    expect(screen.getByText('No words yet — watch a video to start learning!')).toBeInTheDocument()
    expect(screen.getByText('🌱')).toBeInTheDocument()
    expect(screen.getByText('0 words')).toBeInTheDocument()
  })

  it('lists each word with its correct/wrong counts', () => {
    const dictionary = {
      cat: { timesCorrect: 0, timesWrong: 0, lastSeen: 1 },
      dog: { timesCorrect: 1, timesWrong: 2, lastSeen: 2 },
    }
    render(<DictionaryView dictionary={dictionary} onClose={() => {}} />)
    expect(screen.getByText('cat')).toBeInTheDocument()
    expect(screen.getByText('dog')).toBeInTheDocument()
    expect(screen.getByText('✓1')).toBeInTheDocument()
    expect(screen.getByText('✗2')).toBeInTheDocument()
    expect(screen.getByText('2 words')).toBeInTheDocument()
  })

  it('labels a never-attempted word as "New"', () => {
    const dictionary = { cat: { timesCorrect: 0, timesWrong: 0, lastSeen: 1 } }
    render(<DictionaryView dictionary={dictionary} onClose={() => {}} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('labels a word missed at least once (and never correct) as "Seen"', () => {
    const dictionary = { cat: { timesCorrect: 0, timesWrong: 1, lastSeen: 1 } }
    render(<DictionaryView dictionary={dictionary} onClose={() => {}} />)
    expect(screen.getByText('Seen')).toBeInTheDocument()
  })

  it('labels a word with 1-2 correct answers as "Learning"', () => {
    const dictionary = { cat: { timesCorrect: 1, timesWrong: 0, lastSeen: 1 } }
    render(<DictionaryView dictionary={dictionary} onClose={() => {}} />)
    expect(screen.getByText('Learning')).toBeInTheDocument()
  })

  it('labels a word with 3+ correct answers as "Mastered"', () => {
    const dictionary = { cat: { timesCorrect: 3, timesWrong: 0, lastSeen: 1 } }
    render(<DictionaryView dictionary={dictionary} onClose={() => {}} />)
    expect(screen.getByText('Mastered')).toBeInTheDocument()
  })

  it('sorts entries by lastSeen descending', () => {
    const dictionary = {
      old: { timesCorrect: 0, timesWrong: 0, lastSeen: 1 },
      newest: { timesCorrect: 0, timesWrong: 0, lastSeen: 3 },
      middle: { timesCorrect: 0, timesWrong: 0, lastSeen: 2 },
    }
    const { container } = render(<DictionaryView dictionary={dictionary} onClose={() => {}} />)
    const words = [...container.querySelectorAll('.dict-word')].map(el => el.textContent)
    expect(words).toEqual(['newest', 'middle', 'old'])
  })

  it('calls onClose when the overlay is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<DictionaryView dictionary={{}} onClose={onClose} />)
    fireEvent.click(container.querySelector('.dict-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the modal content is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<DictionaryView dictionary={{}} onClose={onClose} />)
    fireEvent.click(container.querySelector('.dict-modal'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<DictionaryView dictionary={{}} onClose={onClose} />)
    fireEvent.click(screen.getByText('✕'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
