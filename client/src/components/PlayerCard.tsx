import { useNavigate } from 'react-router-dom'
import type { Player } from '../types/player'

interface Props {
  player: Player
  sportSlug: string
  sportId: number
}

export default function PlayerCard({ player, sportSlug, sportId }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/sport/${sportSlug}/player/${player.id}?sportId=${sportId}`)}
      className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl p-4 flex items-center gap-4 transition-all duration-150 text-left w-full group"
    >
      <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden flex-shrink-0 border-2 border-gray-600 group-hover:border-blue-500 transition-colors">
        {player.photoUrl ? (
          <img
            src={player.photoUrl}
            alt={player.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
            👤
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-base truncate group-hover:text-blue-300 transition-colors">
          {player.name}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {player.position && (
            <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
              {player.position}
            </span>
          )}
          {player.team && (
            <span className="text-xs text-gray-400">{player.team}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            player.isActive
              ? 'bg-green-900/60 text-green-400'
              : 'bg-gray-700 text-gray-400'
          }`}>
            {player.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <span className="text-gray-500 group-hover:text-blue-400 transition-colors text-xl">›</span>
    </button>
  )
}
