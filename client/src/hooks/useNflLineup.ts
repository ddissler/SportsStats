import { useState, useCallback, useMemo } from 'react'
import type { NflDfsPlayer } from '../types/nflDfsPlayer'
import type { RosterMap, RosterPlayerEntry, SavedLineup, SlotKey } from '../types/lineup'
import { ROSTER_SLOT_DEFS } from '../types/lineup'

const STORAGE_KEY = 'nfl_dfs_lineups'
const MAX_LINEUPS = 20

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadSaved(): SavedLineup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SavedLineup[]) : []
  } catch {
    return []
  }
}

function persistSaved(lineups: SavedLineup[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lineups))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNflLineup() {
  const [roster, setRoster] = useState<RosterMap>({})
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(loadSaved)
  const [notification, setNotification] = useState<string | null>(null)

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  /** All player IDs currently in the roster (memoised) */
  const rosterPlayerIds = useMemo(
    () => new Set(
      Object.values(roster)
        .filter(Boolean)
        .map((e) => (e as RosterPlayerEntry).player.id)
    ),
    [roster]
  )

  /**
   * Try to add a player to the roster.
   * 1. Find first empty regular slot for their position.
   * 2. If none, try FLEX (WR/RB/TE only).
   * 3. If still no slot, notify the user.
   */
  const addPlayer = useCallback((player: NflDfsPlayer) => {
    const pos = player.position.toUpperCase()

    const alreadyIn = Object.values(roster).some((e) => e && e.player.id === player.id)
    if (alreadyIn) {
      notify(`${player.name} is already in your lineup.`)
      return
    }

    // Try regular slots first
    for (const slotDef of ROSTER_SLOT_DEFS) {
      if (slotDef.key === 'FLEX') continue
      if (slotDef.eligible.includes(pos) && !roster[slotDef.key]) {
        setRoster((prev) => ({ ...prev, [slotDef.key]: { player, slot: slotDef.key } }))
        return
      }
    }

    // Try FLEX (WR, RB, TE eligible)
    const flex = ROSTER_SLOT_DEFS.find((s) => s.key === 'FLEX')!
    if (flex.eligible.includes(pos) && !roster['FLEX']) {
      setRoster((prev) => ({ ...prev, FLEX: { player, slot: 'FLEX' } }))
      return
    }

    notify(`No open slot for ${player.name} (${player.position}).`)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster])

  const removePlayer = useCallback((slot: SlotKey) => {
    setRoster((prev) => {
      const next = { ...prev }
      delete next[slot]
      return next
    })
  }, [])

  const clearRoster = useCallback(() => setRoster({}), [])

  const saveLineup = useCallback((name: string, season: number) => {
    const saved = loadSaved()
    if (saved.length >= MAX_LINEUPS) {
      notify(`Max ${MAX_LINEUPS} lineups reached. Delete one first.`)
      return
    }

    const totalFP = Object.values(roster).reduce(
      (sum, e) => sum + (e?.player.totalFP ?? 0),
      0
    )

    const rosterSnapshot: SavedLineup['roster'] = {}
    for (const [slot, entry] of Object.entries(roster)) {
      if (entry) {
        rosterSnapshot[slot] = {
          id: entry.player.id,
          name: entry.player.name,
          position: entry.player.position,
          team: entry.player.team,
          totalFP: entry.player.totalFP,
        }
      } else {
        rosterSnapshot[slot] = null
      }
    }

    const newLineup: SavedLineup = {
      id: crypto.randomUUID(),
      name: name.trim() || `Lineup ${saved.length + 1}`,
      createdAt: new Date().toISOString(),
      season,
      roster: rosterSnapshot,
      totalProjectedFP: Math.round(totalFP * 10) / 10,
    }

    const updated = [...saved, newLineup]
    persistSaved(updated)
    setSavedLineups(updated)
    notify(`Lineup "${newLineup.name}" saved!`)
  }, [roster])

  const deleteLineup = useCallback((id: string) => {
    const updated = loadSaved().filter((l) => l.id !== id)
    persistSaved(updated)
    setSavedLineups(updated)
  }, [])

  const loadLineup = useCallback((lineup: SavedLineup) => {
    notify(`Loaded "${lineup.name}" — player stats may differ from when it was saved.`)
  }, [])

  return {
    roster,
    rosterPlayerIds,
    addPlayer,
    removePlayer,
    clearRoster,
    savedLineups,
    saveLineup,
    deleteLineup,
    loadLineup,
    notification,
  }
}
