import { useEffect, useState } from 'react'
import { getTeamDefense } from '../api/teamDefenseApi'
import type { TeamDefenseDto } from '../types/teamDefense'

const DEFAULT_SEASON = 2024

function fpSign(val: number) {
  if (val > 0) return `+${val}`
  return val.toString()
}

function StatCell({ value, className }: { value: number | string; className?: string }) {
  return (
    <td className={`py-3 px-3 text-sm text-center tabular-nums ${className ?? 'text-gray-200'}`}>
      {value}
    </td>
  )
}

function FpCell({ value }: { value: number }) {
  const color =
    value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-gray-500'
  return (
    <td className={`py-3 px-3 text-sm text-center tabular-nums font-medium ${color}`}>
      {fpSign(value)}
    </td>
  )
}

export default function NflDefenseTable() {
  const [season, setSeason] = useState(DEFAULT_SEASON)
  const [teams, setTeams] = useState<TeamDefenseDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getTeamDefense(season)
      .then(setTeams)
      .catch(() => setError('Failed to load DEF/ST data. Check your API key and try again.'))
      .finally(() => setLoading(false))
  }, [season])

  return (
    <div>
      {/* Season selector */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-400 text-sm">
          Ranked by total fantasy points — standard DEF/ST scoring
        </p>
        <div className="flex items-center gap-2">
          <label className="text-gray-400 text-sm">Season:</label>
          <select
            value={season}
            onChange={(e) => setSeason(Number(e.target.value))}
            className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          >
            {[2024, 2023, 2022].map((yr) => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">
              Loading DEF/ST data — first load fetches from API-Sports…
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && teams.length === 0 && (
        <div className="text-center text-gray-500 py-12 text-sm">No data available.</div>
      )}

      {!loading && teams.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm border-collapse">

            {/* ── grouped column headers ── */}
            <thead>
              <tr className="border-b-2 border-gray-600">
                {/* Rank + Team */}
                <th colSpan={3} className="pb-1 text-left text-xs text-gray-500 uppercase tracking-wider px-3" />

                {/* Defensive Stats group */}
                <th colSpan={8}
                  className="pb-1 text-center text-xs text-gray-400 uppercase tracking-wider border-l border-gray-700 font-bold">
                  Defensive Stats
                </th>

                {/* Fantasy Points group */}
                <th colSpan={7}
                  className="pb-1 text-center text-xs text-blue-400 uppercase tracking-wider border-l border-gray-700 font-bold">
                  Fantasy Points
                </th>
              </tr>

              <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
                <th className="pb-2 px-3 text-left w-10">#</th>
                <th className="pb-2 px-3 text-left">Team</th>
                <th className="pb-2 px-3 text-center">GP</th>

                {/* Defensive Stats columns */}
                <th className="pb-2 px-3 text-center border-l border-gray-700">PA</th>
                <th className="pb-2 px-3 text-center">Avg PA</th>
                <th className="pb-2 px-3 text-center">Yds All</th>
                <th className="pb-2 px-3 text-center">Sacks</th>
                <th className="pb-2 px-3 text-center">FF</th>
                <th className="pb-2 px-3 text-center">INT</th>
                <th className="pb-2 px-3 text-center">FR</th>
                <th className="pb-2 px-3 text-center">Def TD</th>

                {/* Fantasy Points columns */}
                <th className="pb-2 px-3 text-center border-l border-gray-700 text-blue-400/70">PA Pts</th>
                <th className="pb-2 px-3 text-center text-blue-400/70">Sack</th>
                <th className="pb-2 px-3 text-center text-blue-400/70">TO</th>
                <th className="pb-2 px-3 text-center text-blue-400/70">TD</th>
                <th className="pb-2 px-3 text-center text-blue-400/70">Saf</th>
                <th className="pb-2 px-3 text-center text-blue-400/70">Blk</th>
                <th className="pb-2 px-3 text-center text-blue-300 font-bold">Total</th>
              </tr>
            </thead>

            <tbody>
              {teams.map((team, i) => {
                const totalTDs = team.defensiveTDs + team.specialTeamsTDs
                // TO fantasy = INT fp + fumble recovered fp
                const toFp = team.fpInterceptions + team.fpFumblesRecovered

                return (
                  <tr
                    key={team.teamId}
                    className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors"
                  >
                    {/* Rank */}
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-gray-900 text-white text-xs font-bold">
                        {i + 1}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {team.logoUrl ? (
                          <img
                            src={team.logoUrl}
                            alt={team.teamAbbr ?? team.teamName}
                            className="w-7 h-7 object-contain flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-gray-700 flex-shrink-0" />
                        )}
                        <div className="leading-tight">
                          <span className="text-white font-medium">
                            {team.teamAbbr ?? team.teamName}
                          </span>
                          {team.teamAbbr && (
                            <div className="text-gray-500 text-xs">{team.teamName}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* GP */}
                    <StatCell value={team.gamesPlayed || '—'} className="text-gray-400" />

                    {/* ── Defensive Stats ── */}
                    <StatCell
                      value={team.totalPointsAllowed || '—'}
                      className="text-gray-200 border-l border-gray-700"
                    />
                    <StatCell value={team.avgPointsAllowed || '—'} />
                    <StatCell value={team.yardsAllowed || '—'} />
                    <StatCell value={team.sacks || '—'} />
                    <StatCell value={team.forcedFumbles || '—'} />
                    <StatCell value={team.interceptions || '—'} />
                    <StatCell value={team.fumblesRecovered || '—'} />
                    <StatCell value={totalTDs || '—'} />

                    {/* ── Fantasy Points ── */}
                    <td className="border-l border-gray-700">
                      <FpCell value={team.fpPointsAllowed} />
                    </td>
                    <FpCell value={team.fpSacks} />
                    <FpCell value={Math.round(toFp)} />
                    <FpCell value={team.fpTouchdowns} />
                    <FpCell value={team.fpSafeties} />
                    <FpCell value={team.fpBlockedKicks} />

                    {/* Total FP */}
                    <td className="py-3 px-3 text-center">
                      <span className={`text-sm font-bold tabular-nums ${
                        team.totalFantasyPoints >= 100 ? 'text-blue-300' :
                        team.totalFantasyPoints >= 50  ? 'text-blue-400' : 'text-gray-300'
                      }`}>
                        {team.totalFantasyPoints}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Scoring key */}
      {!loading && teams.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
          <span>Sack = +1 pt</span>
          <span>INT / FR = +2 pts each</span>
          <span>Def / ST TD = +6 pts each</span>
          <span>Safety / Blk Kick = +2 pts each</span>
          <span>PA 0 pts = +10</span>
          <span>PA 1–6 = +7 · 7–13 = +4 · 14–20 = +1</span>
          <span>PA 21–27 = 0 · 28–34 = −1</span>
          <span>PA 35+ = −4</span>
        </div>
      )}
    </div>
  )
}
