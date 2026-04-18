export interface TeamDefenseDto {
  teamId: string
  teamName: string
  teamAbbr: string | null
  logoUrl: string | null
  season: number
  gamesPlayed: number

  // Raw stats
  totalPointsAllowed: number
  avgPointsAllowed: number
  yardsAllowed: number
  sacks: number
  forcedFumbles: number
  fumblesRecovered: number
  interceptions: number
  defensiveTDs: number
  specialTeamsTDs: number
  safeties: number
  blockedKicks: number

  // Fantasy point breakdown
  fpPointsAllowed: number
  fpSacks: number
  fpInterceptions: number
  fpFumblesRecovered: number
  fpTouchdowns: number
  fpSafeties: number
  fpBlockedKicks: number
  totalFantasyPoints: number

  lastUpdated: string
}
