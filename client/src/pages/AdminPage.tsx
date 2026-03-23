import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

interface ApiStatus {
  account: {
    firstname: string
    lastname: string
    email: string
  }
  subscription: {
    plan: string
    end: string
    active: boolean
  }
  requests: {
    current: number
    limit_day: number
  }
}

export default function AdminPage() {
  const [status, setStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = () => {
    setLoading(true)
    setError(null)
    axiosClient.get('/admin/api-status')
      .then((r) => setStatus(r.data.response))
      .catch(() => setError('Failed to fetch API status.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStatus() }, [])

  const remaining = status ? status.requests.limit_day - status.requests.current : 0
  const usagePct = status ? (status.requests.current / status.requests.limit_day) * 100 : 0

  const barColor =
    usagePct >= 90 ? 'bg-red-500' :
    usagePct >= 70 ? 'bg-yellow-500' :
    'bg-green-500'

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Admin</h1>

      {loading && (
        <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading API status...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      {status && (
        <div className="space-y-6">
          {/* API Usage */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-lg">API Usage (Today)</h2>
              <button
                onClick={fetchStatus}
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="flex items-end justify-between mb-2">
              <span className="text-4xl font-bold text-white">{remaining}</span>
              <span className="text-gray-400 text-sm">of {status.requests.limit_day} remaining</span>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>

            <p className="text-gray-500 text-xs">
              {status.requests.current} requests used today. Resets at midnight UTC. Counter may be delayed by a few minutes.
            </p>
          </div>

          {/* Subscription */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-white font-semibold text-lg mb-4">Subscription</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-700/40">
                <tr>
                  <td className="py-2.5 text-gray-400">Plan</td>
                  <td className="py-2.5 text-white font-medium">{status.subscription.plan}</td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">Status</td>
                  <td className="py-2.5">
                    <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${
                      status.subscription.active
                        ? 'bg-green-900/60 text-green-400'
                        : 'bg-red-900/60 text-red-400'
                    }`}>
                      {status.subscription.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">Expires</td>
                  <td className="py-2.5 text-white font-medium">
                    {new Date(status.subscription.end).toLocaleDateString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Account */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h2 className="text-white font-semibold text-lg mb-4">API Account</h2>
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-700/40">
                <tr>
                  <td className="py-2.5 text-gray-400">Name</td>
                  <td className="py-2.5 text-white font-medium">
                    {status.account.firstname} {status.account.lastname}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 text-gray-400">Email</td>
                  <td className="py-2.5 text-white font-medium">{status.account.email}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
