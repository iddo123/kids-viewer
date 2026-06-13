import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LevelUpCelebration from './LevelUpCelebration'

describe('LevelUpCelebration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('renders the word in quotes', () => {
    render(<LevelUpCelebration word="cat" level={2} onDone={() => {}} />)
    expect(screen.getByText('"cat"')).toBeInTheDocument()
  })

  it('shows "Level Up!" with 2 filled stars for level 2', () => {
    const { container } = render(<LevelUpCelebration word="cat" level={2} onDone={() => {}} />)
    expect(screen.getByText('Level Up!')).toBeInTheDocument()
    expect(container.querySelectorAll('.levelup-star.filled')).toHaveLength(2)
    expect(container.querySelectorAll('.levelup-star.empty')).toHaveLength(1)
  })

  it('shows "Word Mastered!" with 3 filled stars for level 3', () => {
    const { container } = render(<LevelUpCelebration word="cat" level={3} onDone={() => {}} />)
    expect(screen.getByText('Word Mastered!')).toBeInTheDocument()
    expect(container.querySelectorAll('.levelup-star.filled')).toHaveLength(3)
    expect(container.querySelectorAll('.levelup-star.empty')).toHaveLength(0)
  })

  it('falls back to the level-2 config for an unknown level', () => {
    render(<LevelUpCelebration word="cat" level={99} onDone={() => {}} />)
    expect(screen.getByText('Level Up!')).toBeInTheDocument()
  })

  it('calls onDone when the overlay is clicked', () => {
    const onDone = vi.fn()
    const { container } = render(<LevelUpCelebration word="cat" level={2} onDone={onDone} />)
    fireEvent.click(container.querySelector('.levelup-overlay'))
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('calls onDone automatically after 4000ms', () => {
    const onDone = vi.fn()
    render(<LevelUpCelebration word="cat" level={2} onDone={onDone} />)
    expect(onDone).not.toHaveBeenCalled()
    vi.advanceTimersByTime(4000)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('does not call onDone after unmount', () => {
    const onDone = vi.fn()
    const { unmount } = render(<LevelUpCelebration word="cat" level={2} onDone={onDone} />)
    unmount()
    vi.advanceTimersByTime(4000)
    expect(onDone).not.toHaveBeenCalled()
  })
})
