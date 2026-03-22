import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getPlayer } from '../api/playersApi'
import { useStats } from '../hooks/useStats'
import StatsTabs from '../components/StatsTabs'
import StatsTable from '../components/StatsTable'
import type { Player } from '../types/player'
import type { StatsResponse } from '../types/stats'

type Tab = 'seasonal' | 'career' | 'gamelogs'

const DEFAULT_SEASON = 2024  // API-Sports free tier covers 2022–2024

export default function PlayerStatsPage() {
  const { sportSlug, playerId } = useParams<{ sportSlug: string; playerId: string }>()
  const [searchParams] = useSearchParams()
  const sportId = Number(searchParams.get('sportId'))
  const navigate = useNavigate()

  const [player, setPlayer] = useState<Player | null>(null)
  const [tab, setTab] = useState<Tab>('seasonal')
  const [season, setSeason] = useState(DEFAULT_SEASON)

  const { stats, loading, error, fetchSeasonal, fetchCareer, fetchGameLogs } = useStats()

  useEffect(() => {
    if (!sportId || !playerId) return
    getPlayer(sportId, playerId).then(setPlayer).catch(() => {})
  }, [sportId, playerId])

  useEffect(() => {
    if (!sportId || !playerId) return
    if (tab === 'seasonal') fetchSeasonal(sportId, playerId, season)
    else if (tab === 'career') fetchCareer(sportId, playerId)
    else fetchGameLogs(sportId, playerId, season)
  }, [tab, season, sportId, playerId])

  // Resolve what to render based on tab
  const renderStats = () => {
    if (loading) return (
      <div className="flex justify-center py-16">
        <div className="flex items-center gap-3 text-gray-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading stats...</span>
        </div>
      </div>
    )

    if (error) return (
      <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3">{error}</div>
    )

    if (!stats) return (
      <div className="text-center text-gray-500 py-16">No stats available for this selection.</div>
    )

    // Career: array of seasonal records — render each season as its own section
    if (Array.isArray(stats)) {
      const seasons = stats as StatsResponse[]
      if (seasons.length === 0) return (
        <div className="text-center text-gray-500 py-16">No career stats stored yet. View a season first.</div>
      )
      return (
        <div className="space-y-8">
          {seasons.map((s) => (
            <div key={s.season}>
              <h3 className="text-white font-semibold text-lg mb-3">
                {s.season ?? 'Unknown Season'}
              </h3>
              <StatsTable data={s.data} />
            </div>
          ))}
        </div>
      )
    }

    // Seasonal or game logs: single StatsResponse
    const single = stats as StatsResponse
    return <StatsTable data={single.data} />
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(`/sport/${sportSlug}`)}
        className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-1 text-sm"
      >
        ← Back to search
      </button>

      {/* Player header */}
      {player && (
        <div className="flex items-center gap-6 mb-8 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{player.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {player.position && (
                <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                  {player.position}
                </span>
              )}
              {player.team && <span className="text-gray-400 text-sm">{player.team}</span>}
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                player.isActive ? 'bg-green-900/60 text-green-400' : 'bg-gray-700 text-gray-400'
              }`}>
                {player.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + season selector */}
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <StatsTabs activeTab={tab} onChange={setTab} />

        {(tab === 'seasonal' || tab === 'gamelogs') && (
          <div className="flex items-center gap-2">
            <label className="text-gray-400 text-sm">Season:</label>
            <select
              value={season}
              onChange={(e) => setSeason(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
            >
              {[2024, 2023, 2022].map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {renderStats()}
    </div>
  )
}
