import axiosClient from './axiosClient'
import type { StatsResponse } from '../types/stats'

export const getSeasonalStats = (sportId: number, playerId: string, season: number) =>
  axiosClient
    .get<StatsResponse>('/stats/seasonal', { params: { sportId, playerId, season } })
    .then((r) => r.data)

export const getCareerStats = (sportId: number, playerId: string) =>
  axiosClient
    .get<StatsResponse[]>('/stats/career', { params: { sportId, playerId } })
    .then((r) => r.data)

export const getGameLogs = (sportId: number, playerId: string, season: number) =>
  axiosClient
    .get<StatsResponse>('/stats/gamelogs', { params: { sportId, playerId, season } })
    .then((r) => r.data)
