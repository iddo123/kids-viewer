// Shared Sentry setup for Netlify Functions (Node/Lambda runtime).
// Server-side counterpart to src/utils/sentry.js — uses SENTRY_DSN
// (never exposed to the browser). Can reuse the same DSN as VITE_SENTRY_DSN.
import * as Sentry from '@sentry/node'

let initialized = false

export function initSentry() {
  if (initialized || !process.env.SENTRY_DSN) return
  initialized = true
  Sentry.init({
    dsn:         process.env.SENTRY_DSN,
    environment: process.env.CONTEXT || 'production',
    sendDefaultPii: false,
  })
}

// Reports an error to Sentry and waits for it to send before the
// (short-lived) function container is frozen. No-op if SENTRY_DSN is unset.
export async function reportError(err) {
  initSentry()
  if (!process.env.SENTRY_DSN) return
  Sentry.captureException(err)
  await Sentry.flush(2000)
}
