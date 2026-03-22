import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSportBySlug } from '../api/sportsApi'
import { usePlayers } from '../hooks/usePlayers'
import PlayerSearch from '../components/PlayerSearch'
import PlayerCard from '../components/PlayerCard'
import Pagination from '../components/Pagination'
import type { Sport } from '../types/sport'

const PAGE_SIZE = 10

export default function PlayerSearchPage() {
  const { sportSlug } = useParams<{ sportSlug: string }>()
  const navigate = useNavigate()
  const [sport, setSport] = useState<Sport | null>(null)
  const [sportError, setSportError] = useState(false)
  const [page, setPage] = useState(1)

  // Keep last search params so we can re-search when page changes
  const lastSearch = useRef<{ name: string; isActive?: boolean } | null>(null)

  const { result, loading, error, search } = usePlayers()

  useEffect(() => {
    if (!sportSlug) return
    getSportBySlug(sportSlug)
      .then(setSport)
      .catch(() => setSportError(true))
  }, [sportSlug])

  const handleSearch = (name: string, isActive?: boolean) => {
    lastSearch.current = { name, isActive }
    setPage(1)
    search(sport!.id, name, isActive, 1, PAGE_SIZE)
  }

  const handlePageChange = (newPage: number) => {
    if (!lastSearch.current || !sport) return
    setPage(newPage)
    search(sport.id, lastSearch.current.name, lastSearch.current.isActive, newPage, PAGE_SIZE)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (sportError) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">Sport not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:underline">
          ← Back to sports
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-1 text-sm"
      >
        ← All Sports
      </button>

      {sport && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{sport.name}</h1>
          <p className="text-gray-400 mt-1">Search for a player</p>
        </div>
      )}

      <div className="mb-8">
        {sport && <PlayerSearch onSearch={handleSearch} loading={loading} />}
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {result && result.items.length > 0 && (
        <div>
          <p className="text-gray-400 text-sm mb-3">
            {result.totalCount} player{result.totalCount !== 1 ? 's' : ''} found
          </p>
          <div className="space-y-2">
            {sport && result.items.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                sportSlug={sport.slug}
                sportId={sport.id}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={result.totalPages}
            totalCount={result.totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {result && result.items.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-12">No players found.</div>
      )}

      {!result && !loading && !error && (
        <div className="text-center text-gray-500 py-12">
          Search for a player above to see results.
        </div>
      )}
    </div>
  )
}
