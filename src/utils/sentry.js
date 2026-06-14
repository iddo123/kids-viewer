import * as Sentry from '@sentry/react'

// Skipped entirely when VITE_SENTRY_DSN is unset (local dev/test) — no-op SDK.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // This app is used by kids — never attach IPs, cookies, or other PII.
    sendDefaultPii: false,
  })
}
