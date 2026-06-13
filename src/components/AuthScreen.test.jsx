import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AuthScreen from './AuthScreen'
import { useAuth } from '../hooks/useAuth'

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }))

describe('AuthScreen', () => {
  let signIn, signUp

  beforeEach(() => {
    signIn = vi.fn().mockResolvedValue({ error: null })
    signUp = vi.fn().mockResolvedValue({ error: null })
    useAuth.mockReturnValue({ signIn, signUp })
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders the hero and defaults to the sign-in form', () => {
    render(<AuthScreen />)
    expect(screen.getByText('English Adventure')).toBeInTheDocument()
    expect(screen.getByText('Sign in to start the adventure')).toBeInTheDocument()
    expect(screen.getByText('Sign In').className).toContain('auth-tab--active')
    expect(screen.getByRole('button', { name: '👋 Sign In' })).toBeInTheDocument()
  })

  it('switches to the sign-up form when the Sign Up tab is clicked', () => {
    render(<AuthScreen />)
    fireEvent.click(screen.getByText('Sign Up'))
    expect(screen.getByText('Sign Up').className).toContain('auth-tab--active')
    expect(screen.getByText('Sign In').className).not.toContain('auth-tab--active')
    expect(screen.getByRole('button', { name: '🚀 Create Account' })).toBeInTheDocument()
  })

  it('submits email and password to signIn', async () => {
    render(<AuthScreen />)
    fireEvent.change(screen.getByLabelText('Parent Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: '👋 Sign In' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123' }))
    expect(signUp).not.toHaveBeenCalled()
  })

  it('submits email and password to signUp and shows the check-email state', async () => {
    render(<AuthScreen />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.change(screen.getByLabelText('Parent Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: '🚀 Create Account' }))
    await waitFor(() => expect(screen.getByText(/We sent you a confirmation link/)).toBeInTheDocument())
    expect(signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret123' })
  })

  it('returns to the sign-in tab from the check-email state', async () => {
    render(<AuthScreen />)
    fireEvent.click(screen.getByText('Sign Up'))
    fireEvent.change(screen.getByLabelText('Parent Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: '🚀 Create Account' }))
    await waitFor(() => screen.getByText(/We sent you a confirmation link/))
    fireEvent.click(screen.getByText('Back to sign in'))
    expect(screen.getByText('Sign In').className).toContain('auth-tab--active')
    expect(screen.getByRole('button', { name: '👋 Sign In' })).toBeInTheDocument()
  })

  it('shows an error message returned by signIn', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    render(<AuthScreen />)
    fireEvent.change(screen.getByLabelText('Parent Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: '👋 Sign In' }))
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
    // stays on the sign-in form, doesn't move to check-email
    expect(screen.getByRole('button', { name: '👋 Sign In' })).toBeInTheDocument()
  })

  it('clears the error when switching tabs', async () => {
    signIn.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    render(<AuthScreen />)
    fireEvent.change(screen.getByLabelText('Parent Email'), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: '👋 Sign In' }))
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Sign Up'))
    expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
  })
})
