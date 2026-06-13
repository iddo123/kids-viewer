import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSubscription } from './useSubscription'

const mockMaybeSingle = vi.fn()
const mockUser = { id: 'user-1' }

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: (...args) => mockMaybeSingle(...args),
        }),
      }),
    }),
  },
}))

vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}))

beforeEach(() => {
  mockMaybeSingle.mockReset()
})

describe('useSubscription', () => {
  it('treats a missing row as free', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('free')
    expect(result.current.isActive).toBe(false)
  })

  it('reports active for status=active', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { status: 'active' } })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('active')
    expect(result.current.isActive).toBe(true)
  })

  it('reports active for status=trialing', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { status: 'trialing' } })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.isActive).toBe(true)
  })

  it('reports inactive for status=canceled', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { status: 'canceled' } })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.status).toBe('canceled')
    expect(result.current.isActive).toBe(false)
  })
})
