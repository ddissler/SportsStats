import type { Player } from '../types/player'

interface Props {
  data: unknown
  player?: Player | null
  source?: string
  message?: string
}

interface StatEntry {
  name: string
  value: string | null
}

interface StatGroup {
  groupName: string
  teamName?: string
  stats: StatEntry[]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '' || value === '-') return '—'
  return String(value)
}

function formatLabel(name: string): string {
  return name
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function checkForApiError(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null
  const envelope = data as Record<string, unknown>

  if (envelope.errors) {
    if (Array.isArray(envelope.errors) && envelope.errors.length === 0) {
      // no errors
    } else if (typeof envelope.errors === 'object') {
      const msgs = Object.values(envelope.errors as Record<string, unknown>).filter(Boolean)
      if (msgs.length > 0) return String(msgs[0])
    }
  }

  if (Array.isArray(envelope.response) && envelope.response.length === 0) {
    return 'NO_GAME_STATS'
  }

  return null
}

/**
 * Parse an NFL-style response item:
 * { player, teams: [{ team: {name}, groups: [{ name, statistics: [{name, value}] }] }] }
 */
function parseNflStyle(item: Record<string, unknown>): StatGroup[] {
  const groups: StatGroup[] = []
  const teams = item.teams as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(teams)) return []

  for (const teamEntry of teams) {
    const teamName = (teamEntry.team as Record<string, unknown>)?.name as string | undefined
    const statGroups = teamEntry.groups as Array<Record<string, unknown>> | undefined
    if (!Array.isArray(statGroups)) continue

    for (const group of statGroups) {
      const groupName = String(group.name ?? 'Stats')
      const statistics = group.statistics as Array<Record<string, unknown>> | undefined
      if (!Array.isArray(statistics)) continue

      const stats: StatEntry[] = statistics
        .filter(s => s.name && s.value !== undefined)
        .map(s => ({ name: String(s.name), value: formatValue(s.value) }))

      if (stats.length > 0) {
        groups.push({ groupName, teamName, stats })
      }
    }
  }

  return groups
}

/**
 * Parse a flat-style response item (NBA, MLB, NHL):
 * { player, team, game, points, assists, rebounds, ... }
 * Skip known metadata keys and show the rest as stats.
 */
const METADATA_KEYS = new Set([
  'id', 'name', 'firstname', 'lastname', 'image', 'photo', 'logo',
  'player', 'team', 'game', 'league', 'season', 'country', 'flag',
  'code', 'type', 'color', 'nickname', 'city', 'arena',
])

function parseFlatStyle(item: Record<string, unknown>): StatGroup[] {
  const stats: StatEntry[] = []

  function walk(obj: Record<string, unknown>, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (METADATA_KEYS.has(key.toLowerCase())) continue
      if (value === null || value === undefined) continue

      if (typeof value === 'object' && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, prefix ? `${prefix} ${key}` : key)
      } else if (!Array.isArray(value)) {
        stats.push({ name: prefix ? `${prefix} ${key}` : key, value: formatValue(value) })
      }
    }
  }

  walk(item)
  return stats.length > 0 ? [{ groupName: 'Statistics', stats }] : []
}

function parseResponseItem(item: unknown): StatGroup[] {
  if (typeof item !== 'object' || item === null) return []
  const obj = item as Record<string, unknown>

  // NFL-style: has "teams" array with "groups"
  if (Array.isArray(obj.teams)) return parseNflStyle(obj)

  // Flat style (NBA, MLB, NHL game logs etc.)
  return parseFlatStyle(obj)
}

/** Build a profile stat table from the player's known info */
function buildProfileStats(player: Player): StatGroup[] {
  const stats: StatEntry[] = []
  if (player.position) stats.push({ name: 'Position', value: player.position })
  if (player.number != null) stats.push({ name: 'Number', value: `#${player.number}` })
  if (player.age) stats.push({ name: 'Age', value: String(player.age) })
  if (player.height) stats.push({ name: 'Height', value: player.height })
  if (player.weight) stats.push({ name: 'Weight', value: player.weight })
  if (player.college) stats.push({ name: 'College', value: player.college })
  if (player.experience != null) stats.push({ name: 'Experience', value: `${player.experience} yr${player.experience !== 1 ? 's' : ''}` })
  return stats.length > 0 ? [{ groupName: 'Player Profile', stats }] : []
}

export default function StatsTable({ data, player, source, message }: Props) {
  // Show contextual message (e.g. "No NFL stats available for the 2026 season")
  if (message) {
    return (
      <div className="space-y-2">
        <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 rounded-xl px-5 py-4 text-center">
          <p className="font-medium">{message}</p>
        </div>
        {source && (
          <div className="text-right text-xs text-gray-500">Source: {source}</div>
        )}
      </div>
    )
  }

  if (!data) {
    return <div className="text-center text-gray-500 py-12">No stats available.</div>
  }

  const apiError = checkForApiError(data)
  if (apiError === 'NO_GAME_STATS') {
    const profileGroups = player ? buildProfileStats(player) : []
    return (
      <div className="space-y-4">
        <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 rounded-xl px-5 py-4 text-center">
          <p className="font-medium">No game statistics recorded</p>
          <p className="text-yellow-400/70 text-sm mt-1">
            This player is in the league roster database but has no recorded game stats for this season.
            They may be on a practice squad, injured reserve, or did not see game action.
          </p>
        </div>
        {profileGroups.length > 0 && (
          <>
            {profileGroups.map((group, gi) => (
              <div key={gi} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <div className="px-4 py-2.5 bg-gray-700/60 border-b border-gray-700">
                  <span className="text-white font-semibold text-sm">{group.groupName}</span>
                </div>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-700/40">
                    {group.stats.map((stat, si) => (
                      <tr key={si} className="hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-2.5 text-gray-400 w-1/2">{stat.name}</td>
                        <td className="px-4 py-2.5 text-white font-medium">{stat.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}
      </div>
    )
  }
  if (apiError) {
    return (
      <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 rounded-xl px-5 py-4 text-center">
        {apiError}
      </div>
    )
  }

  const envelope = data as Record<string, unknown>
  const responseArr = Array.isArray(envelope?.response) ? envelope.response as unknown[] : [data]

  const allGroups = responseArr.flatMap(parseResponseItem)

  if (allGroups.length === 0) {
    return <div className="text-center text-gray-500 py-12">No stats available for this selection.</div>
  }

  return (
    <div className="space-y-4">
      {allGroups.map((group, gi) => (
        <div key={gi} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <div className="px-4 py-2.5 bg-gray-700/60 border-b border-gray-700 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">{group.groupName}</span>
            {group.teamName && (
              <span className="text-gray-400 text-xs">{group.teamName}</span>
            )}
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-700/40">
              {group.stats.map((stat, si) => (
                <tr key={si} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-2.5 text-gray-400 w-1/2">{formatLabel(stat.name)}</td>
                  <td className="px-4 py-2.5 text-white font-medium">{stat.value ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {source && (
        <div className="text-right text-xs text-gray-500">Source: {source}</div>
      )}
    </div>
  )
}
