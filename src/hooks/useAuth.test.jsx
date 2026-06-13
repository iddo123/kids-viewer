import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'
import { useAuth } from './useAuth'

const mockGetSession         = vi.fn()
const mockOnAuthStateChange   = vi.fn()
const mockSignUp              = vi.fn()
const mockSignInWithPassword  = vi.fn()
const mockSignOut             = vi.fn()

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession:         (...a) => mockGetSession(...a),
      onAuthStateChange:  (...a) => mockOnAuthStateChange(...a),
      signUp:             (...a) => mockSignUp(...a),
      signInWithPassword: (...a) => mockSignInWithPassword(...a),
      signOut:            (...a) => mockSignOut(...a),
    },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: { session: null } })
  mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })
  mockSignUp.mockResolvedValue({ data: {}, error: null })
  mockSignInWithPassword.mockResolvedValue({ data: {}, error: null })
  mockSignOut.mockResolvedValue({ error: null })
})

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth', () => {
  it('starts loading and resolves to no session', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toBeNull()
  })

  it('exposes the user from an existing session', async () => {
    const session = { user: { id: '1', email: 'parent@example.com' } }
    mockGetSession.mockResolvedValue({ data: { session } })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user).toEqual(session.user)
  })

  it('delegates signIn, signUp, and signOut to supabase', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => { await result.current.signIn({ email: 'a@b.com', password: 'secret' }) })
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })

    await act(async () => { await result.current.signUp({ email: 'a@b.com', password: 'secret' }) })
    expect(mockSignUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })

    await act(async () => { await result.current.signOut() })
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('throws when used outside an AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider')
  })
})
