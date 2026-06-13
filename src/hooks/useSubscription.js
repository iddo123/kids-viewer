import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

export function useSubscription() {
  const { user } = useAuth()
  const [status, setStatus] = useState('free')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) {
      setStatus('free')
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setStatus(data?.status ?? 'free')
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    status,
    isActive: ACTIVE_STATUSES.has(status),
    loading,
    refresh,
  }
}
