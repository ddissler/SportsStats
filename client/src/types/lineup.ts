import type { NflDfsPlayer } from './nflDfsPlayer'

// ─── Slot definitions ─────────────────────────────────────────────────────────

export type SlotKey =
  | 'QB'
  | 'RB1' | 'RB2'
  | 'WR1' | 'WR2' | 'WR3'
  | 'TE'
  | 'FLEX'
  | 'K'
  | 'DEF'

export interface SlotDef {
  key: SlotKey
  label: string
  /** Positions eligible for this slot */
  eligible: string[]
}

export const ROSTER_SLOT_DEFS: SlotDef[] = [
  { key: 'QB',   label: 'QB',   eligible: ['QB'] },
  { key: 'RB1',  label: 'RB',   eligible: ['RB'] },
  { key: 'RB2',  label: 'RB',   eligible: ['RB'] },
  { key: 'WR1',  label: 'WR',   eligible: ['WR'] },
  { key: 'WR2',  label: 'WR',   eligible: ['WR'] },
  { key: 'WR3',  label: 'WR',   eligible: ['WR'] },
  { key: 'TE',   label: 'TE',   eligible: ['TE'] },
  { key: 'FLEX', label: 'FLEX', eligible: ['WR', 'RB', 'TE'] },
  { key: 'K',    label: 'K',    eligible: ['K'] },
  { key: 'DEF',  label: 'DEF',  eligible: ['DEF'] },
]

// ─── Roster & lineup types ────────────────────────────────────────────────────

export interface RosterPlayerEntry {
  player: NflDfsPlayer
  slot: SlotKey
}

export type RosterMap = Partial<Record<SlotKey, RosterPlayerEntry>>

export interface SavedLineup {
  id: string
  name: string
  createdAt: string
  season: number
  roster: Record<string, { id: string; name: string; position: string; team: string | null; totalFP: number } | null>
  totalProjectedFP: number
}
