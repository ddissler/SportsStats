import { useEffect, useState, useMemo, useRef } from 'react'
import { listNflPlayers } from '../api/playerRankingsApi'
import { searchPlayers } from '../api/playersApi'
import { mapToNflDfsPlayer } from '../utils/nflDfsPlayerMapper'
import { useNflLineup } from '../hooks/useNflLineup'
import NflDfsPlayerTable from '../components/NflDfsPlayerTable'
import NflRosterBuilder from '../components/NflRosterBuilder'
import NflDefenseTable from '../components/NflDefenseTable'
import type { NflDfsPlayer } from '../types/nflDfsPlayer'
import type { SlotKey } from '../types/lineup'

const DEFAULT_SEASON = 2024
const NFL_SPORT_ID = 1

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
  const [season, setSeason] = useState(DEFAULT_SEASON)
  const [activeTab, setActiveTab] = useState<PositionTab>('QB')
  const [players, setPlayers] = useState<NflDfsPlayer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search state
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchMsg, setSearchMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const lineup = useNflLineup()

  const loadPlayers = (s: number) => {
    setLoading(true)
    setError(null)
    listNflPlayers(s)
      .then((dtos) => setPlayers(dtos.map(mapToNflDfsPlayer)))
      .catch(() => setError('Failed to load player data.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPlayers(season) }, [season])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q.length < 2) {
      setSearchMsg('Enter at least 2 characters.')
      return
    }
    setSearching(true)
    setSearchMsg(null)
    try {
      const result = await searchPlayers(NFL_SPORT_ID, q, undefined, 1, 50)
      const found = result.totalCount
      setSearchMsg(
        found > 0
          ? `${found} player${found !== 1 ? 's' : ''} found — table updated.`
          : 'No players found for that name.'
      )
      // Reload rankings so newly cached players appear
      loadPlayers(season)
    } catch {
      setSearchMsg('Search failed. Check your connection and try again.')
    } finally {
      setSearching(false)
    }
  }

  // Filter by active tab position
  const tabPlayers = useMemo(
    () => players.filter((p) => p.position === activeTab),
    [players, activeTab]
  )

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">NFL DFS Rankings</h1>
          <p className="text-gray-500 text-sm mt-0.5">PPR fantasy scoring</p>
        </div>
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

      {/* Search bar */}
      <form onSubmit={handleSearch} className="mb-5 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearchMsg(null) }}
            placeholder="Search players by name…"
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {searching && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {searching ? 'Searching…' : 'Search'}
        </button>
        {searchMsg && (
          <span className={`self-center text-xs ${
            searchMsg.includes('found') && !searchMsg.startsWith('No')
              ? 'text-green-400'
              : 'text-gray-400'
          }`}>
            {searchMsg}
          </span>
        )}
      </form>

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

        {/* ── Roster builder sidebar ── */}
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
