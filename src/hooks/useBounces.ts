import { useCallback, useEffect, useState } from 'react'
import { fetchBounces } from '../lib/supabase'
import type { Bounce } from '../types/bounce'

export function useBounces() {
  const [bounces, setBounces] = useState<Bounce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadBounces = useCallback(async () => {
    setIsLoading(true)
    setError(null)
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
    void loadBounces()
  }, [loadBounces])

  return { bounces, isLoading, error, retry: loadBounces }
}
