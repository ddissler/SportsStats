export interface NflDfsPlayer {
  id: string
  name: string
  photoUrl: string | null
  isActive: boolean
  position: string      // QB | RB | WR | TE | K
  team: string | null
  // Computed from seasonal stats — 0 when no cached stats exist
  totalFP: number
  // Position-specific key stats for sorting columns
  stats: Record<string, number>
  // Raw seasonal data (passed through to scoring util if needed)
  seasonalStats: unknown
}
