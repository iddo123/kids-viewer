import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UpgradePrompt from './UpgradePrompt'
import { startCheckout } from '../utils/billing'

vi.mock('../utils/billing', () => ({ startCheckout: vi.fn() }))

describe('UpgradePrompt', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders the upgrade pitch', () => {
    render(<UpgradePrompt onClose={() => {}} />)
    expect(screen.getByText('Keep the adventure going!')).toBeInTheDocument()
    expect(screen.getByText(/used up your free videos/)).toBeInTheDocument()
  })

  it('calls onClose when "Maybe later" is clicked', () => {
    const onClose = vi.fn()
    render(<UpgradePrompt onClose={onClose} />)
    fireEvent.click(screen.getByText('Maybe later'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls startCheckout when "Upgrade Now" is clicked', async () => {
    startCheckout.mockRejectedValue(new Error('network'))
    render(<UpgradePrompt onClose={() => {}} />)
    fireEvent.click(screen.getByText('⭐ Upgrade Now'))
    await waitFor(() => expect(startCheckout).toHaveBeenCalledTimes(1))
  })

  it('shows an error message and re-enables the button if checkout fails', async () => {
    startCheckout.mockRejectedValue(new Error('network'))
    render(<UpgradePrompt onClose={() => {}} />)
    fireEvent.click(screen.getByText('⭐ Upgrade Now'))
    await waitFor(() => expect(screen.getByText('Something went wrong — please try again.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '⭐ Upgrade Now' })).not.toBeDisabled()
  })

  it('shows an error instead of navigating when checkout returns no url', async () => {
    startCheckout.mockResolvedValue('')   // 2xx response but missing url
    render(<UpgradePrompt onClose={() => {}} />)
    fireEvent.click(screen.getByText('⭐ Upgrade Now'))
    await waitFor(() => expect(screen.getByText('Something went wrong — please try again.')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '⭐ Upgrade Now' })).not.toBeDisabled()
  })

  it('disables both buttons while the upgrade request is in flight', () => {
    startCheckout.mockReturnValue(new Promise(() => {})) // never resolves
    render(<UpgradePrompt onClose={() => {}} />)
    fireEvent.click(screen.getByText('⭐ Upgrade Now'))
    expect(screen.getByText('…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Maybe later' })).toBeDisabled()
  })
})
