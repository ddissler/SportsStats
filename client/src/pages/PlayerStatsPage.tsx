import { useCallback, useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getPlayer } from '../api/playersApi'
import { getSeasonalStats, getGames, getGameStats } from '../api/statsApi'
import StatsTable from '../components/StatsTable'
import NflFantasyScoreCard from '../components/NflFantasyScoreCard'
import type { Player } from '../types/player'
import type { StatsResponse } from '../types/stats'
import type { Game } from '../types/game'

const currentYear = new Date().getFullYear()
const SEASONS = Array.from({ length: currentYear - 2021 }, (_, i) => currentYear - i)

const NFL_FANTASY_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE'])

export default function PlayerStatsPage() {
  const { sportSlug, playerId } = useParams<{ sportSlug: string; playerId: string }>()
  const [searchParams] = useSearchParams()
  const sportId = Number(searchParams.get('sportId'))
  const navigate = useNavigate()

  const [player, setPlayer] = useState<Player | null>(null)
  const [season, setSeason] = useState(SEASONS[0])

  const [seasonal, setSeasonal] = useState<StatsResponse | null>(null)
  const [seasonalLoading, setSeasonalLoading] = useState(false)
  const [seasonalError, setSeasonalError] = useState<string | null>(null)

  const [games, setGames] = useState<Game[]>([])
  const [gamesLoading, setGamesLoading] = useState(false)

  const [expandedGame, setExpandedGame] = useState<number | null>(null)
  const [gameStats, setGameStats] = useState<Record<number, StatsResponse>>({})
  const [gameStatsLoading, setGameStatsLoading] = useState<number | null>(null)

  const isNflFantasyPos = sportSlug === 'nfl' &&
    NFL_FANTASY_POSITIONS.has(player?.position?.toUpperCase() ?? '')

  useEffect(() => {
    if (!sportId || !playerId) return
    getPlayer(sportId, playerId).then(setPlayer).catch(() => {})
  }, [sportId, playerId])

  // Fetch seasonal stats + games list when season changes
  useEffect(() => {
    if (!sportId || !playerId) return

    setSeasonalLoading(true)
    setSeasonalError(null)
    setSeasonal(null)
    setGames([])
    setExpandedGame(null)
    setGameStats({})

    getSeasonalStats(sportId, playerId, season)
      .then((r) => {
        setSeasonal(r)
        if (r.message) {
          setSeasonalError(null)
        }
        setGamesLoading(true)
        return getGames(sportId, playerId, season)
      })
      .then((g) => setGames(g))
      .catch(() => setSeasonalError('Failed to load stats.'))
      .finally(() => {
        setSeasonalLoading(false)
        setGamesLoading(false)
      })
  }, [sportId, playerId, season])

  const handleGameClick = useCallback(async (gameId: number) => {
    if (expandedGame === gameId) {
      setExpandedGame(null)
      return
    }
    setExpandedGame(gameId)

    if (gameStats[gameId]) return // already loaded

    setGameStatsLoading(gameId)
    try {
      const result = await getGameStats(sportId, playerId!, gameId)
      setGameStats((prev) => ({ ...prev, [gameId]: result }))
    } catch {
      // silently fail — user can retry by clicking again
    } finally {
      setGameStatsLoading(null)
    }
  }, [expandedGame, gameStats, sportId, playerId])

  const Spinner = () => (
    <div className="flex justify-center py-12">
      <div className="flex items-center gap-3 text-gray-400">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(`/sport/${sportSlug}`)}
        className="text-gray-400 hover:text-white transition-colors mb-6 flex items-center gap-1 text-sm"
      >
        ← Back to search
      </button>

      {/* Player header */}
      {player && (
        <div className="flex items-center gap-6 mb-8 bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <div className="w-24 h-24 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-gray-500">👤</div>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {player.name}
              {player.number != null && <span className="text-gray-500 ml-2">#{player.number}</span>}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {player.position && (
                <span className="text-sm bg-gray-700 text-gray-300 px-3 py-1 rounded-full">
                  {player.position}
                </span>
              )}
              {player.team && <span className="text-gray-400 text-sm">{player.team}</span>}
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                player.isActive ? 'bg-green-900/60 text-green-400' : 'bg-gray-700 text-gray-400'
              }`}>
                {player.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400 flex-wrap">
              {player.age && <span>Age: {player.age}</span>}
              {player.height && <span>{player.height}</span>}
              {player.weight && <span>{player.weight}</span>}
              {player.college && <span>College: {player.college}</span>}
              {player.experience != null && <span>Exp: {player.experience} yr{player.experience !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Season selector */}
      <div className="flex items-center gap-2 mb-6">
        <label className="text-gray-400 text-sm">Season:</label>
        <select
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
        >
          {SEASONS.map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </select>
      </div>

      {/* Seasonal stats */}
      <div className="mb-8">
        <h2 className="text-white font-semibold text-lg mb-3">Season Totals</h2>
        {seasonalLoading ? <Spinner /> :
         seasonalError ? (
           <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3">{seasonalError}</div>
         ) : seasonal ? (
           <div className="space-y-4">
             {isNflFantasyPos && player && (
               <NflFantasyScoreCard
                 data={seasonal.data}
                 position={player.position!}
                 statType="seasonal"
               />
             )}
             <StatsTable data={seasonal.data} player={player} source={seasonal.source} message={seasonal.message} />
           </div>
         ) : null}
      </div>

      {/* Games list */}
      {games.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-lg">Game Log</h2>
            {games[0]?.source && (
              <span className="text-xs text-gray-500">Source: {games[0].source}</span>
            )}
          </div>
          <div className="space-y-2">
            {games.map((game) => (
              <div key={game.gameId}>
                <button
                  onClick={() => handleGameClick(game.gameId)}
                  className={`w-full text-left bg-gray-800 border rounded-xl p-4 transition-all duration-150 ${
                    expandedGame === game.gameId
                      ? 'border-blue-500 bg-gray-750'
                      : 'border-gray-700 hover:border-gray-500 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-xs w-16">{game.week}</span>
                      <span className="text-gray-400 text-xs w-20">{game.date}</span>
                      <div className="flex items-center gap-2">
                        {game.awayTeamLogo && (
                          <img src={game.awayTeamLogo} alt="" className="w-5 h-5 object-contain" />
                        )}
                        <span className="text-white text-sm">{game.awayTeam}</span>
                        <span className="text-gray-500 text-sm">@</span>
                        {game.homeTeamLogo && (
                          <img src={game.homeTeamLogo} alt="" className="w-5 h-5 object-contain" />
                        )}
                        <span className="text-white text-sm">{game.homeTeam}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {game.awayScore != null && game.homeScore != null && (
                        <span className="text-gray-300 text-sm font-mono">
                          {game.awayScore} - {game.homeScore}
                        </span>
                      )}
                      <span className={`text-gray-500 transition-transform duration-150 ${
                        expandedGame === game.gameId ? 'rotate-180' : ''
                      }`}>
                        ▾
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded game stats */}
                {expandedGame === game.gameId && (
                  <div className="mt-2 ml-4 mr-1">
                    {gameStatsLoading === game.gameId ? (
                      <div className="flex items-center gap-2 text-gray-400 py-4 pl-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span className="text-sm">Loading game stats...</span>
                      </div>
                    ) : gameStats[game.gameId] ? (
                      <StatsTable data={gameStats[game.gameId].data} player={player} source={gameStats[game.gameId].source} />
                    ) : (
                      <div className="text-gray-500 text-sm py-4 pl-2">
                        Click again to retry loading stats.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!seasonalLoading && !gamesLoading && games.length === 0 && seasonal && (
        <div className="text-center text-gray-500 py-8 text-sm">
          No games found for this season.
        </div>
      )}
    </div>
  )
}
