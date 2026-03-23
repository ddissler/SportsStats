import axiosClient from './axiosClient'
import type { StatsResponse } from '../types/stats'
import type { Game } from '../types/game'

export const getSeasonalStats = (sportId: number, playerId: string, season: number) =>
  axiosClient
    .get<StatsResponse>('/stats/seasonal', { params: { sportId, playerId, season } })
    .then((r) => r.data)

export const getGames = (sportId: number, playerId: string, season: number) =>
  axiosClient
    .get<Game[]>('/stats/games', { params: { sportId, playerId, season } })
    .then((r) => r.data)

export const getGameStats = (sportId: number, playerId: string, gameId: number) =>
  axiosClient
    .get<StatsResponse>('/stats/game', { params: { sportId, playerId, gameId } })
    .then((r) => r.data)
