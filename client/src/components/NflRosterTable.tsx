import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Player } from '../types/player'
import NflDefenseTable from './NflDefenseTable'

const POSITION_ORDER: Record<string, number> = { QB: 0, RB: 1, WR: 2, TE: 3, K: 4 }
const SKILL_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K'])

type PositionTab = 'ALL' | 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'

const TABS: { key: PositionTab; label: string }[] = [
  { key: 'ALL', label: 'OVERALL' },
  { key: 'QB',  label: 'QB' },
  { key: 'RB',  label: 'RB' },
  { key: 'WR',  label: 'WR' },
  { key: 'TE',  label: 'TE' },
  { key: 'K',   label: 'K' },
  { key: 'DEF', label: 'DEF/ST' },
]

interface Props {
  players: Player[]
  sportSlug: string
  sportId: number
}

export default function NflRosterTable({ players, sportSlug, sportId }: Props) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<PositionTab>('ALL')

  // Keep only skill positions; anything without a recognized position is excluded
  const skillPlayers = players.filter(p => {
    const pos = p.position?.toUpperCase()
    return pos !== undefined && SKILL_POSITIONS.has(pos)
  })

  // Sort: QB → RB → WR → K, then alphabetically within each group
  const sorted = [...skillPlayers].sort((a, b) => {
    const aOrd = POSITION_ORDER[a.position!.toUpperCase()] ?? 99
    const bOrd = POSITION_ORDER[b.position!.toUpperCase()] ?? 99
    if (aOrd !== bOrd) return aOrd - bOrd
    return a.name.localeCompare(b.name)
  })

  const visible =
    activeTab === 'ALL' || activeTab === 'DEF'
      ? sorted
      : sorted.filter(p => p.position?.toUpperCase() === activeTab)

  return (
    <div>
      {/* Position tabs */}
      <div className="flex border-b border-gray-700 mb-5 overflow-x-auto">
        {TABS.map(tab => (
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

      {activeTab === 'DEF' ? (
        <NflDefenseTable />
      ) : visible.length === 0 ? (
        <div className="text-center text-gray-500 py-12 text-sm">
          No skill-position players found.
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700">
              <th className="pb-2 pr-4 w-10">#</th>
              <th className="pb-2">Player</th>
              <th className="pb-2 pl-4">Pos</th>
              <th className="pb-2 pl-4">Team</th>
              <th className="pb-2 pl-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((player, i) => (
              <tr
                key={player.id}
                onClick={() => navigate(`/sport/${sportSlug}/player/${player.id}?sportId=${sportId}`)}
                className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors group"
              >
                <td className="py-3 pr-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-900 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border border-gray-600">
                      {player.photoUrl ? (
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">?</div>
                      )}
                    </div>
                    <span className="text-blue-400 group-hover:text-blue-300 font-medium transition-colors">
                      {player.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 pl-4 text-gray-300 font-medium">{player.position}</td>
                <td className="py-3 pl-4 text-gray-400">{player.team ?? '—'}</td>
                <td className="py-3 pl-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    player.isActive
                      ? 'bg-green-900/60 text-green-400'
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {player.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
