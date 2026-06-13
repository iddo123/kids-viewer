// Shared helpers for Stripe-related functions — service-role Supabase
// client (bypasses RLS) + parent-account JWT verification.
const { createClient } = require('@supabase/supabase-js')

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getUserFromAuthHeader(event, supabase) {
  const header = event.headers.authorization || event.headers.Authorization || ''
  const token = header.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}

module.exports = { supabaseAdmin, getUserFromAuthHeader }
