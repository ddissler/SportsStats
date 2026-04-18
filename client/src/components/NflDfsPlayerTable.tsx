import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { NflDfsPlayer } from '../types/nflDfsPlayer'

// ─── Column definitions per position ─────────────────────────────────────────

interface ColDef {
  key: string
  label: string
  title?: string
}

const QB_COLS: ColDef[] = [
  { key: 'passYards', label: 'Pass Yds' },
  { key: 'passTDs',   label: 'Pass TD' },
  { key: 'ints',      label: 'INT', title: 'Interceptions' },
  { key: 'rushYards', label: 'Rush Yds' },
  { key: 'rushTDs',   label: 'Rush TD' },
  { key: 'fumbleLost', label: 'Fum' },
]

const RB_COLS: ColDef[] = [
  { key: 'rushAttempts', label: 'Att' },
  { key: 'rushYards',    label: 'Rush Yds' },
  { key: 'rushTDs',      label: 'Rush TD' },
  { key: 'receptions',   label: 'Rec' },
  { key: 'recYards',     label: 'Rec Yds' },
  { key: 'recTDs',       label: 'Rec TD' },
  { key: 'fumbleLost',   label: 'Fum' },
]

const WR_TE_COLS: ColDef[] = [
  { key: 'targets',    label: 'Tgt' },
  { key: 'receptions', label: 'Rec' },
  { key: 'recYards',   label: 'Rec Yds' },
  { key: 'recTDs',     label: 'Rec TD' },
  { key: 'rushYards',  label: 'Rush Yds' },
  { key: 'rushTDs',    label: 'Rush TD' },
  { key: 'fumbleLost', label: 'Fum' },
]

function getColDefs(position: string): ColDef[] {
  if (position === 'QB') return QB_COLS
  if (position === 'RB') return RB_COLS
  return WR_TE_COLS
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc'

function sortPlayers(players: NflDfsPlayer[], key: string, dir: SortDir): NflDfsPlayer[] {
  return [...players].sort((a, b) => {
    const av = key === 'totalFP' ? a.totalFP : (a.stats[key] ?? 0)
    const bv = key === 'totalFP' ? b.totalFP : (b.stats[key] ?? 0)
    // Secondary sort: name ascending
    if (av === bv) return a.name.localeCompare(b.name)
    return dir === 'desc' ? bv - av : av - bv
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  players: NflDfsPlayer[]
  position: string          // 'QB' | 'RB' | 'WR' | 'TE' | 'K'
  rosterPlayerIds: Set<string>
  onAdd: (player: NflDfsPlayer) => void
}

export default function NflDfsPlayerTable({ players, position, rosterPlayerIds, onAdd }: Props) {
  const navigate = useNavigate()
  const [sortKey, setSortKey] = useState('totalFP')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const cols = getColDefs(position)

  const sorted = useMemo(
    () => sortPlayers(players, sortKey, sortDir),
    [players, sortKey, sortDir]
  )

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (sortKey !== col) return <span className="text-gray-700 ml-1">↕</span>
    return <span className="text-blue-400 ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  const ThSort = ({ col, label, title }: { col: string; label: string; title?: string }) => (
    <th
      className="pb-2 px-2 text-center cursor-pointer hover:text-gray-300 transition-colors select-none whitespace-nowrap"
      onClick={() => handleSort(col)}
      title={title}
    >
      {label}<SortIcon col={col} />
    </th>
  )

  if (players.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10 text-sm">
        No {position} players found. Search for players first to populate this list.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700">
            <th className="pb-2 w-8" />
            <th className="pb-2 pr-3">Player</th>
            <th className="pb-2 px-2 text-center">Team</th>
            {cols.map((c) => (
              <ThSort key={c.key} col={c.key} label={c.label} title={c.title} />
            ))}
            <th
              className="pb-2 px-2 text-center cursor-pointer hover:text-blue-300 text-blue-400/80 transition-colors select-none"
              onClick={() => handleSort('totalFP')}
            >
              Total FP<SortIcon col="totalFP" />
            </th>
            <th className="pb-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, i) => {
            const inRoster = rosterPlayerIds.has(player.id)
            return (
              <tr
                key={player.id}
                className={`border-b border-gray-800 transition-colors group ${
                  inRoster ? 'bg-blue-900/20' : 'hover:bg-gray-800/50'
                }`}
              >
                {/* Rank */}
                <td className="py-2.5 pr-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-gray-500 text-xs font-bold">
                    {i + 1}
                  </span>
                </td>

                {/* Player name + photo */}
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-600">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/sport/nfl/player/${player.id}?sportId=1`)}
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-left"
                    >
                      {player.name}
                    </button>
                  </div>
                </td>

                {/* Team */}
                <td className="py-2.5 px-2 text-center text-gray-400 text-xs">{player.team ?? '—'}</td>

                {/* Stat columns */}
                {cols.map((c) => {
                  const val = player.stats[c.key] ?? 0
                  return (
                    <td key={c.key} className="py-2.5 px-2 text-center text-gray-300 tabular-nums text-xs">
                      {val || '—'}
                    </td>
                  )
                })}

                {/* Total FP */}
                <td className="py-2.5 px-2 text-center">
                  <span className={`text-xs font-bold tabular-nums ${
                    player.totalFP >= 30 ? 'text-blue-300' :
                    player.totalFP >= 15 ? 'text-blue-400' :
                    player.totalFP > 0  ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {player.totalFP > 0 ? player.totalFP : '—'}
                  </span>
                </td>

                {/* Add button */}
                <td className="py-2.5 pl-2">
                  <button
                    onClick={() => onAdd(player)}
                    disabled={inRoster}
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      inRoster
                        ? 'bg-blue-600/30 text-blue-400 cursor-default'
                        : 'bg-gray-700 hover:bg-blue-600 text-gray-300 hover:text-white'
                    }`}
                    title={inRoster ? 'Already in lineup' : 'Add to lineup'}
                  >
                    {inRoster ? '✓' : '+'}
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
