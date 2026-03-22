import { useCallback, useState } from 'react'
import { getSeasonalStats, getCareerStats, getGameLogs } from '../api/statsApi'
import type { StatsResponse } from '../types/stats'

export function useStats() {
  const [stats, setStats] = useState<StatsResponse | StatsResponse[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSeasonal = useCallback(async (sportId: number, playerId: string, season: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getSeasonalStats(sportId, playerId, season)
      setStats(result)
    } catch {
      setError('Failed to load seasonal stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCareer = useCallback(async (sportId: number, playerId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCareerStats(sportId, playerId)
      setStats(result)
    } catch {
      setError('Failed to load career stats.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGameLogs = useCallback(async (sportId: number, playerId: string, season: number) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getGameLogs(sportId, playerId, season)
      setStats(result)
    } catch {
      setError('Failed to load game logs.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, error, fetchSeasonal, fetchCareer, fetchGameLogs }
}
