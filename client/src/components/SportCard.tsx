import { useNavigate } from 'react-router-dom'
import type { Sport } from '../types/sport'

const SPORT_EMOJIS: Record<string, string> = {
  nfl: '🏈',
  nba: '🏀',
  mlb: '⚾',
  nhl: '🏒',
  mls: '⚽',
}

const SPORT_COLORS: Record<string, string> = {
  nfl: 'from-blue-900 to-blue-700 hover:from-blue-800 hover:to-blue-600',
  nba: 'from-orange-900 to-orange-700 hover:from-orange-800 hover:to-orange-600',
  mlb: 'from-red-900 to-red-700 hover:from-red-800 hover:to-red-600',
  nhl: 'from-slate-800 to-slate-600 hover:from-slate-700 hover:to-slate-500',
  mls: 'from-green-900 to-green-700 hover:from-green-800 hover:to-green-600',
}

interface Props {
  sport: Sport
}

export default function SportCard({ sport }: Props) {
  const navigate = useNavigate()
  const emoji = SPORT_EMOJIS[sport.slug] ?? '🏅'
  const gradient = SPORT_COLORS[sport.slug] ?? 'from-gray-800 to-gray-600 hover:from-gray-700 hover:to-gray-500'

  return (
    <button
      onClick={() => navigate(`/sport/${sport.slug}`)}
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-2xl border border-white/10 w-full`}
    >
      {sport.iconUrl ? (
        <img src={sport.iconUrl} alt={sport.name} className="w-16 h-16 object-contain" />
      ) : (
        <span className="text-6xl">{emoji}</span>
      )}
      <span className="text-white font-bold text-2xl tracking-wide">{sport.name}</span>
      <span className="text-white/60 text-sm">Search players →</span>
    </button>
  )
}
