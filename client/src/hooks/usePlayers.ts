import { useCallback, useState } from 'react'
import { searchPlayers } from '../api/playersApi'
import type { Player } from '../types/player'
import type { PaginatedResult } from '../types/pagination'

export function usePlayers() {
  const [result, setResult] = useState<PaginatedResult<Player> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (
    sportId: number,
    name: string,
    isActive?: boolean,
    page = 1,
    pageSize = 10
  ) => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchPlayers(sportId, name, isActive, page, pageSize)
      setResult(data)
    } catch {
      setError('Failed to load players. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { result, loading, error, search }
}
