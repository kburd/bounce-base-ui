import { useCallback, useEffect, useState } from 'react'
import { fetchBounces } from '../lib/supabase'
import type { Bounce } from '../types/bounce'

export function useBounces(enabled = true) {
  const [bounces, setBounces] = useState<Bounce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBounces = useCallback(async () => {
    try {
      setBounces(await fetchBounces())
    } catch (err) {
      console.error('Unable to load bounce inventory', err)
      setError('We could not load bounce inventory right now. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void loadBounces()
  }, [enabled, loadBounces])

  const retry = useCallback(() => {
    setIsLoading(true)
    setError(null)
    void loadBounces()
  }, [loadBounces])

  return { bounces, isLoading, error, retry }
}
