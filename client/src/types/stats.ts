export interface StatsResponse {
  statType: string
  season: string | null
  data: unknown
  lastUpdated: string
  source?: string
  message?: string
}
