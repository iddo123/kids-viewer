import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HelpModal from './HelpModal'

describe('HelpModal', () => {
  it('renders the help title and instructions', () => {
    render(<HelpModal onClose={() => {}} />)
    expect(screen.getByText('❓ How to Play')).toBeInTheDocument()
    expect(screen.getByText('Pick a video')).toBeInTheDocument()
    expect(screen.getByText('My Dictionary')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<HelpModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close help/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the overlay backdrop is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<HelpModal onClose={onClose} />)
    fireEvent.click(container.querySelector('.help-overlay'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the modal content is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<HelpModal onClose={onClose} />)
    fireEvent.click(container.querySelector('.help-modal'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
