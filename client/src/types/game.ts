export interface Game {
  gameId: number
  date: string
  stage: string
  week: string
  homeTeam: string
  homeTeamLogo: string | null
  homeScore: number | null
  awayTeam: string
  awayTeamLogo: string | null
  awayScore: number | null
  source?: string
}
