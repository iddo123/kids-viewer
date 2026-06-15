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
    // Strip any typed/spoken input values from DOM breadcrumbs (e.g. the
    // word-guess text field) before they're sent to Sentry.
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === 'ui.input' || breadcrumb.category === 'ui.click') {
        delete breadcrumb.message
        if (breadcrumb.data) delete breadcrumb.data.value
      }
      return breadcrumb
    },
  })
}
