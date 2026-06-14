import * as Sentry from '@sentry/react'
import './ErrorBoundary.css'

function ErrorFallback() {
  return (
    <div className="crash-overlay">
      <div className="crash-panel">
        <div className="crash-icon">🛟</div>
        <h2 className="crash-title">Oops! Something went wrong</h2>
        <p className="crash-text">
          Don't worry — your progress is saved. Let's get back to the adventure!
        </p>
        <button className="crash-btn" onClick={() => window.location.reload()}>
          🔄 Reload
        </button>
      </div>
    </div>
  )
}

export default function ErrorBoundary({ children }) {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
    </Sentry.ErrorBoundary>
  )
}
