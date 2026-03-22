import axiosClient from './axiosClient'
import type { Sport } from '../types/sport'

export const getAllSports = () =>
  axiosClient.get<Sport[]>('/sports').then((r) => r.data)

export const getSportBySlug = (slug: string) =>
  axiosClient.get<Sport>(`/sports/${slug}`).then((r) => r.data)
