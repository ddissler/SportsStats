import axiosClient from './axiosClient'

export interface PlayerWithStatsApiDto {
  id: string
  name: string
  photoUrl: string | null
  isActive: boolean
  position: string | null
  team: string | null
  seasonalStats: unknown
  statsSeason: number | null
}

export const listNflPlayers = (season: number, position?: string) =>
  axiosClient
    .get<PlayerWithStatsApiDto[]>('/players/list', {
      params: { sportId: 1, season, ...(position ? { position } : {}) },
    })
    .then((r) => r.data)
