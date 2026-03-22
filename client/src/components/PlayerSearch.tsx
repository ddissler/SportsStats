import { useState } from 'react'

type ActiveFilter = 'all' | 'active' | 'inactive'

interface Props {
  onSearch: (name: string, isActive: boolean | undefined) => void
  loading: boolean
}

export default function PlayerSearch({ onSearch, loading }: Props) {
  const [name, setName] = useState('')
  const [filter, setFilter] = useState<ActiveFilter>('all')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return
    const isActive = filter === 'all' ? undefined : filter === 'active'
    onSearch(name.trim(), isActive)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Search player name..."
          minLength={2}
          className="flex-1 bg-gray-800 border border-gray-600 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || name.trim().length < 2}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </span>
          ) : 'Search'}
        </button>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'inactive'] as ActiveFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </form>
  )
}
