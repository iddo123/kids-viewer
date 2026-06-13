import { supabase } from '../lib/supabaseClient'

async function postWithAuth(endpoint) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(endpoint, {
    method:  'POST',
    headers: { Authorization: `Bearer ${session?.access_token}` },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const { url } = await res.json()
  return url
}

// Redirects to a Stripe-hosted Checkout page for the subscription.
export const startCheckout = () => postWithAuth('/api/create-checkout-session')

// Redirects to the Stripe Customer Portal for managing/canceling.
export const openBillingPortal = () => postWithAuth('/api/create-portal-session')
