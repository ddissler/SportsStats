import axiosClient from './axiosClient'
import type { Player } from '../types/player'
import type { PaginatedResult } from '../types/pagination'

export const searchPlayers = (
  sportId: number,
  name: string,
  isActive?: boolean,
  page = 1,
  pageSize = 10
) =>
  axiosClient
    .get<PaginatedResult<Player>>('/players/search', {
      params: { sportId, name, isActive, page, pageSize },
    })
    .then((r) => r.data)

export const getPlayer = (sportId: number, playerId: string) =>
  axiosClient.get<Player>(`/players/${sportId}/${playerId}`).then((r) => r.data)
