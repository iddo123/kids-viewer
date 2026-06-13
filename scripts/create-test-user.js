// Creates (or resets) a confirmed Supabase Auth user for local testing.
//
// Usage:
//   node scripts/create-test-user.js [email] [password]
//
// Defaults to test@example.com / TestPassword123! if not given.
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.

import { readFileSync, existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadDotEnv() {
  if (!existsSync('.env')) return
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

loadDotEnv()

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — fill these in .env first.')
  process.exit(1)
}

const email    = process.argv[2] || 'test@example.com'
const password = process.argv[3] || 'TestPassword123!'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const { data: { users } } = await supabase.auth.admin.listUsers()
const existing = users.find(u => u.email === email)

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  })
  if (error) { console.error('Failed to update existing user:', error.message); process.exit(1) }
  console.log('Updated existing test user:')
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) { console.error('Failed to create user:', error.message); process.exit(1) }
  console.log('Created test user:')
}

console.log(`  email:    ${email}`)
console.log(`  password: ${password}`)
