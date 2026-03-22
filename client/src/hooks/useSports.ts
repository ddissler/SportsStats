import { useEffect, useState } from 'react'
import { getAllSports } from '../api/sportsApi'
import type { Sport } from '../types/sport'

export function useSports() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAllSports()
      .then(setSports)
      .catch(() => setError('Failed to load sports.'))
      .finally(() => setLoading(false))
  }, [])

  return { sports, loading, error }
}
