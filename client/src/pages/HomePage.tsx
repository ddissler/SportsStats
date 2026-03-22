import { useSports } from '../hooks/useSports'
import SportCard from '../components/SportCard'

export default function HomePage() {
  const { sports, loading, error } = useSports()

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">Sports Stats</h1>
        <p className="text-gray-400 text-lg">Select a sport to search players and view statistics</p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="flex items-center gap-3 text-gray-400">
            <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading sports...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-5 py-4 text-center">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {sports.map((sport) => (
            <SportCard key={sport.id} sport={sport} />
          ))}
        </div>
      )}
    </div>
  )
}
