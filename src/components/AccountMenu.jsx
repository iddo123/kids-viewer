import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { startCheckout, openBillingPortal } from '../utils/billing'
import './AccountMenu.css'

export default function AccountMenu() {
  const { user, signOut } = useAuth()
  const { isActive, loading } = useSubscription()
  const [busy, setBusy] = useState(false)

  const handleBillingClick = async () => {
    setBusy(true)
    try {
      const url = await (isActive ? openBillingPortal() : startCheckout())
      window.location.href = url
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="account-menu">
      <span className="account-email" title={user?.email}>{user?.email}</span>
      {!loading && (
        <button
          className={`account-btn ${isActive ? '' : 'account-btn--upgrade'}`}
          disabled={busy}
          onClick={handleBillingClick}
        >
          {isActive ? '⚙️ Manage Subscription' : '⭐ Upgrade'}
        </button>
      )}
      <button className="account-btn account-btn--signout" onClick={signOut}>
        Sign Out
      </button>
    </div>
  )
}
