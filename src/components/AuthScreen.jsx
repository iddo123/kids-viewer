import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './AuthScreen.css'

export default function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode]     = useState('signin') // signin | signup
  const [email, setEmail]   = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]   = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | check-email

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setStatus('loading')

    const { error: authError } = mode === 'signin'
      ? await signIn({ email, password })
      : await signUp({ email, password })

    if (authError) {
      setError(authError.message)
      setStatus('idle')
      return
    }

    if (mode === 'signup') {
      setStatus('check-email')
    }
    // signin success: AuthProvider's onAuthStateChange picks up the session
  }

  return (
    <div className="auth-screen">
      <div className="auth-hero">
        <div className="auth-hero-icons">🌟 📚 🎉</div>
        <h1 className="auth-title">English Adventure</h1>
        <p className="auth-subtitle">Sign in to start the adventure</p>
      </div>

      <div className="auth-card">
        {status === 'check-email' ? (
          <div className="auth-check-email">
            <p>📬 We sent you a confirmation link. Check your email, then sign in below.</p>
            <button
              className="auth-link-btn"
              onClick={() => { setMode('signin'); setStatus('idle') }}
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
                onClick={() => { setMode('signin'); setError('') }}
              >
                Sign In
              </button>
              <button
                className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
                onClick={() => { setMode('signup'); setError('') }}
              >
                Sign Up
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label" htmlFor="auth-email">Parent Email</label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label className="auth-label" htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                className="auth-input"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={6}
                required
              />

              {error && <p className="auth-error">{error}</p>}

              <button className="auth-submit-btn" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? '…' : mode === 'signin' ? '👋 Sign In' : '🚀 Create Account'}
              </button>
            </form>

            <p className="auth-hint">
              This account is for a parent or guardian — your child uses the app under it.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
