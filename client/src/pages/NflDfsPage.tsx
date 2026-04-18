import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { listNflPlayers } from '../api/playerRankingsApi'
import { mapToNflDfsPlayer } from '../utils/nflDfsPlayerMapper'
import { useNflLineup } from '../hooks/useNflLineup'
import NflDfsPlayerTable from '../components/NflDfsPlayerTable'
import NflRosterBuilder from '../components/NflRosterBuilder'
import NflDefenseTable from '../components/NflDefenseTable'
import type { NflDfsPlayer } from '../types/nflDfsPlayer'
import type { SlotKey } from '../types/lineup'

const DEFAULT_SEASON = 2024

type PositionTab = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'

const POSITION_TABS: { key: PositionTab; label: string }[] = [
  { key: 'QB',  label: 'QB' },
  { key: 'RB',  label: 'RB' },
  { key: 'WR',  label: 'WR' },
  { key: 'TE',  label: 'TE' },
  { key: 'K',   label: 'K' },
  { key: 'DEF', label: 'DEF/ST' },
]

export default function NflDfsPage() {
  const navigate = useNavigate()
  const [season, setSeason] = useState(DEFAULT_SEASON)
  const [activeTab, setActiveTab] = useState<PositionTab>('QB')
  const [players, setPlayers] = useState<NflDfsPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lineup = useNflLineup()

  // Load players when season changes (fetch all skill positions at once)
  useEffect(() => {
    setLoading(true)
    setError(null)
    listNflPlayers(season)
      .then((dtos) => setPlayers(dtos.map(mapToNflDfsPlayer)))
      .catch(() => setError('Failed to load player data.'))
      .finally(() => setLoading(false))
  }, [season])

  // Filter by active tab position
  const tabPlayers = useMemo(
    () => players.filter((p) => p.position === activeTab),
    [players, activeTab]
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">NFL DFS Rankings</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            PPR fantasy scoring · players you've searched appear here
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search link */}
          <button
            onClick={() => navigate('/sport/nfl/search')}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors border border-blue-800 hover:border-blue-600 px-3 py-1.5 rounded-lg"
          >
            Search players →
          </button>
          {/* Season selector */}
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
        </div>
      </div>

      {/* Two-column layout: rankings left, roster builder right */}
      <div className="flex gap-6 items-start">

        {/* ── Rankings panel ── */}
        <div className="flex-1 min-w-0">
          {/* Position tabs */}
          <div className="flex border-b border-gray-700 mb-5 overflow-x-auto">
            {POSITION_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 text-sm font-semibold tracking-wide whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'border-b-2 border-blue-500 text-white -mb-px'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex justify-center py-16">
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Loading players…</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          {!loading && !error && activeTab === 'DEF' && (
            <NflDefenseTable />
          )}

          {!loading && !error && activeTab !== 'DEF' && (
            <NflDfsPlayerTable
              players={tabPlayers}
              position={activeTab}
              rosterPlayerIds={lineup.rosterPlayerIds}
              onAdd={lineup.addPlayer}
            />
          )}
        </div>

        {/* ── Roster builder (fixed width sidebar) ── */}
        <div className="w-72 flex-shrink-0">
          <NflRosterBuilder
            roster={lineup.roster}
            savedLineups={lineup.savedLineups}
            season={season}
            onRemove={(slot: SlotKey) => lineup.removePlayer(slot)}
            onClear={lineup.clearRoster}
            onSave={lineup.saveLineup}
            onDelete={lineup.deleteLineup}
            notification={lineup.notification}
          />
        </div>
      </div>
    </div>
  )
}
