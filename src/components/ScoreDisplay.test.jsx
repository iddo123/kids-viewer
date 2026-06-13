import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ScoreDisplay from './ScoreDisplay'

describe('ScoreDisplay', () => {
  it('renders the score and streak values', () => {
    render(<ScoreDisplay score={150} streak={2} onBack={() => {}} dictCount={5} onDictOpen={() => {}} />)
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('shows the level title and icon for the current score', () => {
    render(<ScoreDisplay score={150} streak={0} onBack={() => {}} dictCount={0} onDictOpen={() => {}} />)
    expect(screen.getByText(/Level 1 · Beginner/)).toBeInTheDocument()
    expect(screen.getByText('🌱')).toBeInTheDocument()
  })

  it('shows the next level once the score crosses a threshold', () => {
    render(<ScoreDisplay score={300} streak={0} onBack={() => {}} dictCount={0} onDictOpen={() => {}} />)
    expect(screen.getByText(/Level 2 · Learner/)).toBeInTheDocument()
  })

  it('fills the level bar proportionally to the next threshold', () => {
    const { container } = render(<ScoreDisplay score={150} streak={0} onBack={() => {}} dictCount={0} onDictOpen={() => {}} />)
    const fill = container.querySelector('.level-bar-fill')
    expect(fill.style.width).toBe('50%')
  })

  it('fills the level bar to 100% at the max level (no next threshold)', () => {
    const { container } = render(<ScoreDisplay score={3000} streak={0} onBack={() => {}} dictCount={0} onDictOpen={() => {}} />)
    const fill = container.querySelector('.level-bar-fill')
    expect(fill.style.width).toBe('100%')
  })

  it('adds the "hot" class to the streak value once streak reaches 3', () => {
    const { container } = render(<ScoreDisplay score={0} streak={3} onBack={() => {}} dictCount={0} onDictOpen={() => {}} />)
    expect(container.querySelector('.streak-val').className).toContain('hot')
  })

  it('does not add the "hot" class when streak is below 3', () => {
    const { container } = render(<ScoreDisplay score={0} streak={2} onBack={() => {}} dictCount={0} onDictOpen={() => {}} />)
    expect(container.querySelector('.streak-val').className).not.toContain('hot')
  })

  it('shows singular "word" for a dictionary count of 1', () => {
    render(<ScoreDisplay score={0} streak={0} onBack={() => {}} dictCount={1} onDictOpen={() => {}} />)
    expect(screen.getByText(/1 word$/)).toBeInTheDocument()
  })

  it('shows plural "words" for a dictionary count other than 1', () => {
    render(<ScoreDisplay score={0} streak={0} onBack={() => {}} dictCount={5} onDictOpen={() => {}} />)
    expect(screen.getByText(/5 words/)).toBeInTheDocument()
  })

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn()
    render(<ScoreDisplay score={0} streak={0} onBack={onBack} dictCount={0} onDictOpen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onDictOpen when the dictionary button is clicked', () => {
    const onDictOpen = vi.fn()
    render(<ScoreDisplay score={0} streak={0} onBack={() => {}} dictCount={3} onDictOpen={onDictOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /words/i }))
    expect(onDictOpen).toHaveBeenCalledTimes(1)
  })
})
