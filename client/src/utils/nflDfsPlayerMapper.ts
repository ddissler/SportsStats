import type { PlayerWithStatsApiDto } from '../api/playerRankingsApi'
import type { NflDfsPlayer } from '../types/nflDfsPlayer'
import {
  extractGroups,
  getResponseItems,
  calcQb,
  calcRb,
  calcWrTe,
} from './nflFantasyScoring'

/**
 * Convert a raw API DTO into an NflDfsPlayer with computed fantasy points
 * and a flat stats map for column sorting.
 */
export function mapToNflDfsPlayer(dto: PlayerWithStatsApiDto): NflDfsPlayer {
  const pos = (dto.position ?? '').toUpperCase()
  let totalFP = 0
  const stats: Record<string, number> = {}

  if (dto.seasonalStats && (pos === 'QB' || pos === 'RB' || pos === 'WR' || pos === 'TE')) {
    const items = getResponseItems(dto.seasonalStats)
    if (items.length > 0) {
      const groups = extractGroups(items[0])

      if (pos === 'QB') {
        const f = calcQb(groups)
        totalFP = f.total
        stats.passYards = f.passYards
        stats.passTDs = f.passTDs
        stats.ints = f.ints
        stats.rushYards = f.rushYards
        stats.rushTDs = f.rushTDs
        stats.fumbleLost = f.fumbleLost
      } else if (pos === 'RB') {
        const f = calcRb(groups)
        totalFP = f.total
        stats.rushAttempts = f.rushAttempts
        stats.rushYards = f.rushYards
        stats.rushTDs = f.rushTDs
        stats.receptions = f.receptions
        stats.recYards = f.recYards
        stats.recTDs = f.recTDs
        stats.fumbleLost = f.fumbleLost
      } else {
        // WR / TE
        const f = calcWrTe(groups)
        totalFP = f.total
        stats.targets = f.targets
        stats.receptions = f.receptions
        stats.recYards = f.recYards
        stats.recTDs = f.recTDs
        stats.rushYards = f.rushYards
        stats.rushTDs = f.rushTDs
        stats.fumbleLost = f.fumbleLost
      }
    }
  }

  return {
    id: dto.id,
    name: dto.name,
    photoUrl: dto.photoUrl,
    isActive: dto.isActive,
    position: pos || 'UNK',
    team: dto.team,
    totalFP,
    stats,
    seasonalStats: dto.seasonalStats,
  }
}
