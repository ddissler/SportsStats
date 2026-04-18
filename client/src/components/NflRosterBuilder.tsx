import { useState } from 'react'
import type { RosterMap, SavedLineup, SlotKey } from '../types/lineup'
import { ROSTER_SLOT_DEFS } from '../types/lineup'

interface Props {
  roster: RosterMap
  savedLineups: SavedLineup[]
  season: number
  onRemove: (slot: SlotKey) => void
  onClear: () => void
  onSave: (name: string, season: number) => void
  onDelete: (id: string) => void
  notification: string | null
}

export default function NflRosterBuilder({
  roster, savedLineups, season,
  onRemove, onClear, onSave, onDelete, notification,
}: Props) {
  const [lineupName, setLineupName] = useState('')
  const [showSaved, setShowSaved] = useState(false)

  const filled = ROSTER_SLOT_DEFS.filter((s) => roster[s.key]).length
  const totalFP = Object.values(roster).reduce(
    (sum, e) => sum + (e?.player.totalFP ?? 0), 0
  )

  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold text-base">My Lineup</h2>
        <span className="text-xs text-gray-500">{filled}/10 filled</span>
      </div>

      {/* Notification toast */}
      {notification && (
        <div className="mb-3 bg-blue-900/60 border border-blue-600 text-blue-200 text-xs px-3 py-2 rounded-lg">
          {notification}
        </div>
      )}

      {/* Roster slots */}
      <div className="space-y-1.5 mb-4">
        {ROSTER_SLOT_DEFS.map((slotDef) => {
          const entry = roster[slotDef.key]
          return (
            <div
              key={slotDef.key}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                entry ? 'bg-gray-700/70' : 'bg-gray-900/40 border border-dashed border-gray-700'
              }`}
            >
              {/* Slot label */}
              <span className={`text-xs font-bold w-10 flex-shrink-0 ${
                slotDef.key === 'FLEX' ? 'text-purple-400' : 'text-gray-500'
              }`}>
                {slotDef.label}
              </span>

              {entry ? (
                <>
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-medium truncate block text-xs">
                      {entry.player.name}
                    </span>
                    <span className="text-gray-500 text-xs">{entry.player.team ?? '—'}</span>
                  </div>
                  <span className="text-blue-300 text-xs font-semibold tabular-nums flex-shrink-0">
                    {entry.player.totalFP > 0 ? `${entry.player.totalFP} FP` : '—'}
                  </span>
                  <button
                    onClick={() => onRemove(slotDef.key)}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                    title="Remove"
                  >
                    ✕
                  </button>
                </>
              ) : (
                <span className="text-gray-600 text-xs flex-1">Empty</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Total FP */}
      <div className="flex justify-between items-center py-2 border-t border-gray-700 mb-4">
        <span className="text-gray-400 text-xs">Projected FP</span>
        <span className="text-blue-300 font-bold text-sm tabular-nums">
          {totalFP > 0 ? Math.round(totalFP * 10) / 10 : '—'}
        </span>
      </div>

      {/* Save controls */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={lineupName}
          onChange={(e) => setLineupName(e.target.value)}
          placeholder="Lineup name (optional)"
          className="flex-1 bg-gray-900 border border-gray-600 text-white text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 placeholder:text-gray-600"
        />
        <button
          onClick={() => { onSave(lineupName, season); setLineupName('') }}
          disabled={filled === 0}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          Save
        </button>
      </div>

      <button
        onClick={onClear}
        disabled={filled === 0}
        className="w-full py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-gray-900/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Clear roster
      </button>

      {/* Saved lineups toggle */}
      {savedLineups.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-3">
          <button
            onClick={() => setShowSaved((v) => !v)}
            className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition-colors"
          >
            <span>Saved lineups ({savedLineups.length}/20)</span>
            <span>{showSaved ? '▲' : '▼'}</span>
          </button>

          {showSaved && (
            <div className="mt-2 space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {savedLineups.map((lineup) => (
                <div
                  key={lineup.id}
                  className="flex items-center gap-2 bg-gray-900/60 rounded-lg px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">{lineup.name}</div>
                    <div className="text-gray-600 text-xs">
                      {lineup.season} · {lineup.totalProjectedFP} FP
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(lineup.id)}
                    className="text-gray-600 hover:text-red-400 transition-colors text-xs flex-shrink-0"
                    title="Delete lineup"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
