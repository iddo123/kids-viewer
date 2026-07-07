import { useState } from 'react'
import { startCheckout } from '../utils/billing'
import './UpgradePrompt.css'

export default function UpgradePrompt({ onClose }) {
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState('')

  const handleUpgrade = async () => {
    setBusy(true)
    setError('')
    try {
      const url = await startCheckout()
      if (!url) throw new Error('No checkout URL returned')
      window.location.href = url
    } catch {
      setError('Something went wrong — please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="upgrade-overlay">
      <div className="upgrade-panel">
        <div className="upgrade-icon">⭐</div>
        <h2 className="upgrade-title">Keep the adventure going!</h2>
        <p className="upgrade-text">
          You've used up your free videos. Subscribe for unlimited videos and challenges.
        </p>
        {error && <p className="upgrade-error">{error}</p>}
        <button className="upgrade-btn" onClick={handleUpgrade} disabled={busy}>
          {busy ? '…' : '⭐ Upgrade Now'}
        </button>
        <button className="upgrade-close-btn" onClick={onClose} disabled={busy}>
          Maybe later
        </button>
      </div>
    </div>
  )
}
