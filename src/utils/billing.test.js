import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { startCheckout, openBillingPortal } from './billing'
import { supabase } from '../lib/supabaseClient'

vi.mock('../lib/supabaseClient', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}))

describe('billing', () => {
  beforeEach(() => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok123' } } })
  })

  afterEach(() => vi.restoreAllMocks())

  it('startCheckout posts to /api/create-checkout-session with the auth token and returns the url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://stripe.example/checkout' }),
    }))
    const url = await startCheckout()
    expect(url).toBe('https://stripe.example/checkout')
    expect(fetch).toHaveBeenCalledWith('/api/create-checkout-session', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok123' },
    })
  })

  it('openBillingPortal posts to /api/create-portal-session with the auth token and returns the url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://stripe.example/portal' }),
    }))
    const url = await openBillingPortal()
    expect(url).toBe('https://stripe.example/portal')
    expect(fetch).toHaveBeenCalledWith('/api/create-portal-session', {
      method: 'POST',
      headers: { Authorization: 'Bearer tok123' },
    })
  })

  it('throws an error when the response is not ok', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(startCheckout()).rejects.toThrow('HTTP 500')
  })

  it('sends "Bearer undefined" when there is no session', async () => {
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ url: 'x' }) }))
    await startCheckout()
    expect(fetch).toHaveBeenCalledWith('/api/create-checkout-session', {
      method: 'POST',
      headers: { Authorization: 'Bearer undefined' },
    })
  })
})
