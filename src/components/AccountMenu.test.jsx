import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccountMenu from './AccountMenu'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { startCheckout, openBillingPortal } from '../utils/billing'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useSubscription', () => ({ useSubscription: vi.fn() }))
vi.mock('../utils/billing', () => ({ startCheckout: vi.fn(), openBillingPortal: vi.fn() }))

describe('AccountMenu', () => {
  let signOut

  beforeEach(() => {
    vi.clearAllMocks()
    signOut = vi.fn()
    useAuth.mockReturnValue({ user: { email: 'parent@example.com' }, signOut })
    useSubscription.mockReturnValue({ isActive: false, loading: false })
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows the signed-in user\'s email', () => {
    render(<AccountMenu />)
    expect(screen.getByText('parent@example.com')).toBeInTheDocument()
  })

  it('shows an Upgrade button for a free account', () => {
    render(<AccountMenu />)
    const btn = screen.getByRole('button', { name: '⭐ Upgrade' })
    expect(btn.className).toContain('account-btn--upgrade')
  })

  it('shows a Manage Subscription button for an active subscriber', () => {
    useSubscription.mockReturnValue({ isActive: true, loading: false })
    render(<AccountMenu />)
    const btn = screen.getByRole('button', { name: '⚙️ Manage Subscription' })
    expect(btn.className).not.toContain('account-btn--upgrade')
  })

  it('hides the billing button while subscription status is loading', () => {
    useSubscription.mockReturnValue({ isActive: false, loading: true })
    render(<AccountMenu />)
    expect(screen.queryByText('⭐ Upgrade')).not.toBeInTheDocument()
    expect(screen.queryByText('⚙️ Manage Subscription')).not.toBeInTheDocument()
  })

  it('calls startCheckout when a free user clicks the billing button', async () => {
    startCheckout.mockRejectedValue(new Error('network'))
    render(<AccountMenu />)
    fireEvent.click(screen.getByRole('button', { name: '⭐ Upgrade' }))
    await waitFor(() => expect(startCheckout).toHaveBeenCalledTimes(1))
    expect(openBillingPortal).not.toHaveBeenCalled()
  })

  it('calls openBillingPortal when an active subscriber clicks the billing button', async () => {
    useSubscription.mockReturnValue({ isActive: true, loading: false })
    openBillingPortal.mockRejectedValue(new Error('network'))
    render(<AccountMenu />)
    fireEvent.click(screen.getByRole('button', { name: '⚙️ Manage Subscription' }))
    await waitFor(() => expect(openBillingPortal).toHaveBeenCalledTimes(1))
    expect(startCheckout).not.toHaveBeenCalled()
  })

  it('calls signOut when the Sign Out button is clicked', () => {
    render(<AccountMenu />)
    fireEvent.click(screen.getByText('Sign Out'))
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
