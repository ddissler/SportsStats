import axiosClient from './axiosClient'
import type { TeamDefenseDto } from '../types/teamDefense'

export const getTeamDefense = (season: number) =>
  axiosClient
    .get<TeamDefenseDto[]>('/teamdefense', { params: { season } })
    .then((r) => r.data)
