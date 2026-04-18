// ─── Shared stat types ────────────────────────────────────────────────────────

export interface NflStatItem {
  name: string
  value: string | null
}

export interface NflStatGroup {
  groupName: string
  stats: NflStatItem[]
}

// ─── Response parsing ─────────────────────────────────────────────────────────

/**
 * Pull the raw response array out of the API envelope.
 * Each item represents one game (game log) or one season summary.
 */
export function getResponseItems(data: unknown): unknown[] {
  if (typeof data !== 'object' || data === null) return []
  const env = data as Record<string, unknown>
  const r = env.response
  if (Array.isArray(r) && r.length > 0) return r
  return [data]  // fallback: treat the whole object as one entry
}

/**
 * Extract stat groups from one response item using the NFL-style structure:
 * { teams: [{ groups: [{ name, statistics: [{name, value}] }] }] }
 */
export function extractGroups(item: unknown): NflStatGroup[] {
  if (typeof item !== 'object' || item === null) return []
  const obj = item as Record<string, unknown>
  const teams = obj.teams as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(teams)) return []

  const groups: NflStatGroup[] = []
  for (const teamEntry of teams) {
    const statGroups = teamEntry.groups as Array<Record<string, unknown>> | undefined
    if (!Array.isArray(statGroups)) continue
    for (const group of statGroups) {
      const groupName = String(group.name ?? 'Stats')
      const statistics = group.statistics as Array<Record<string, unknown>> | undefined
      if (!Array.isArray(statistics)) continue
      const stats: NflStatItem[] = statistics
        .filter(s => s.name !== undefined)
        .map(s => ({
          name: String(s.name),
          value: s.value != null ? String(s.value) : null,
        }))
      if (stats.length) groups.push({ groupName, stats })
    }
  }
  return groups
}

/**
 * Try to get a game date string from the top-level item (if present).
 * Falls back to null so the caller can show "G1, G2..." instead.
 */
export function extractGameLabel(item: unknown): string | null {
  if (typeof item !== 'object' || item === null) return null
  const obj = item as Record<string, unknown>
  const game = obj.game as Record<string, unknown> | undefined
  if (!game) return null
  // Try { game: { date: { date: "2024-09-08" } } } or { game: { date: "..." } }
  const d = game.date
  if (typeof d === 'string') return d.slice(0, 10)
  if (typeof d === 'object' && d !== null) {
    const inner = (d as Record<string, unknown>).date
    if (typeof inner === 'string') return inner.slice(0, 10)
  }
  return null
}

// ─── Stat lookup helpers ──────────────────────────────────────────────────────

function parseNum(val: string | null | undefined): number {
  if (!val || val === '—' || val === '-') return 0
  return parseFloat(val) || 0
}

/**
 * Find a numeric stat within a group whose name contains `groupHint`,
 * trying each candidate stat name in order (exact then contains match).
 */
function getStat(groups: NflStatGroup[], groupHint: string, ...statHints: string[]): number {
  const group = groups.find(g =>
    g.groupName.toLowerCase().includes(groupHint.toLowerCase())
  )
  if (!group) return 0
  for (const hint of statHints) {
    const lower = hint.toLowerCase()
    let stat = group.stats.find(s => s.name.toLowerCase() === lower)
    if (!stat) stat = group.stats.find(s => s.name.toLowerCase().includes(lower))
    if (stat?.value) {
      const n = parseNum(stat.value)
      // return 0 values only when we know the stat exists (value === "0")
      if (n !== 0 || stat.value.trim() === '0') return n
    }
  }
  return 0
}

// ─── Fantasy scoring constants ────────────────────────────────────────────────

// Standard PPR scoring
const PASS_YDS_PER_PT = 25          // 1 pt per 25 pass yards
const SKILL_YDS_PER_PT = 10         // 1 pt per 10 rush/rec yards
const PASS_TD_PTS    = 4
const SKILL_TD_PTS   = 6
const INT_PTS        = -2
const REC_PTS        = 1            // PPR: 1 pt per reception
const FUMBLE_PTS     = -2

// ─── Fantasy breakdown types ──────────────────────────────────────────────────

export interface QbFantasy {
  passYards: number;     passYardsFP: number
  passTDs: number;       passTDsFP: number
  ints: number;          intsFP: number
  rushYards: number;     rushYardsFP: number
  rushTDs: number;       rushTDsFP: number
  // Rare receiving (trick plays, flea-flickers, etc.) — usually 0 but must be scored
  recReceptions: number; recReceptionsFP: number
  recYards: number;      recYardsFP: number
  recTDs: number;        recTDsFP: number
  fumbleLost: number;    fumbleLostFP: number
  total: number
}

export interface RbFantasy {
  rushAttempts: number
  rushYards: number;  rushYardsFP: number
  rushTDs: number;    rushTDsFP: number
  receptions: number; receptionsFP: number
  recYards: number;   recYardsFP: number
  recTDs: number;     recTDsFP: number
  fumbleLost: number; fumbleLostFP: number
  total: number
}

export interface WrTeFantasy {
  targets: number
  receptions: number; receptionsFP: number
  recYards: number;   recYardsFP: number
  recTDs: number;     recTDsFP: number
  rushYards: number;  rushYardsFP: number
  rushTDs: number;    rushTDsFP: number
  fumbleLost: number; fumbleLostFP: number
  total: number
}

export type NflFantasy = QbFantasy | RbFantasy | WrTeFantasy

// ─── Per-position calculators ─────────────────────────────────────────────────

export function calcQb(groups: NflStatGroup[]): QbFantasy {
  const passYards     = getStat(groups, 'pass', 'passing yards', 'yards', 'net yards', 'pass yards')
  const passTDs       = getStat(groups, 'pass', 'touchdowns', 'td', 'passing touchdowns')
  const ints          = getStat(groups, 'pass', 'interceptions', 'int')
  const rushYards     = getStat(groups, 'rush', 'rushing yards', 'yards', 'rush yards')
  const rushTDs       = getStat(groups, 'rush', 'touchdowns', 'td', 'rushing touchdowns')
  // Receiving: trick plays, flea-flickers, hook-and-ladder returns to QB, etc.
  const recReceptions = getStat(groups, 'receiv', 'receptions', 'rec', 'catches')
  const recYards      = getStat(groups, 'receiv', 'receiving yards', 'yards', 'rec yards')
  const recTDs        = getStat(groups, 'receiv', 'touchdowns', 'td', 'receiving touchdowns')
  const fumbleLost    = getStat(groups, 'fumble', 'lost', 'fumbles lost', 'lost fumbles')

  const passYardsFP     = Math.round((passYards / PASS_YDS_PER_PT) * 10) / 10
  const passTDsFP       = passTDs * PASS_TD_PTS
  const intsFP          = ints * INT_PTS
  const rushYardsFP     = Math.round((rushYards / SKILL_YDS_PER_PT) * 10) / 10
  const rushTDsFP       = rushTDs * SKILL_TD_PTS
  const recReceptionsFP = recReceptions * REC_PTS
  const recYardsFP      = Math.round((recYards / SKILL_YDS_PER_PT) * 10) / 10
  const recTDsFP        = recTDs * SKILL_TD_PTS
  const fumbleLostFP    = fumbleLost * FUMBLE_PTS

  const total = Math.round(
    (passYardsFP + passTDsFP + intsFP + rushYardsFP + rushTDsFP +
     recReceptionsFP + recYardsFP + recTDsFP + fumbleLostFP) * 10
  ) / 10

  return {
    passYards, passYardsFP, passTDs, passTDsFP, ints, intsFP,
    rushYards, rushYardsFP, rushTDs, rushTDsFP,
    recReceptions, recReceptionsFP, recYards, recYardsFP, recTDs, recTDsFP,
    fumbleLost, fumbleLostFP, total,
  }
}

export function calcRb(groups: NflStatGroup[]): RbFantasy {
  const rushAttempts = getStat(groups, 'rush', 'rushing attempts', 'attempts', 'carries', 'rushing att')
  const rushYards    = getStat(groups, 'rush', 'rushing yards', 'yards', 'rush yards')
  const rushTDs      = getStat(groups, 'rush', 'touchdowns', 'td', 'rushing touchdowns')
  const receptions   = getStat(groups, 'receiv', 'receptions', 'rec', 'catches', 'completions')
  const recYards     = getStat(groups, 'receiv', 'receiving yards', 'yards', 'rec yards')
  const recTDs       = getStat(groups, 'receiv', 'touchdowns', 'td', 'receiving touchdowns')
  const fumbleLost   = getStat(groups, 'fumble', 'lost', 'fumbles lost', 'lost fumbles')

  const rushYardsFP  = Math.round((rushYards / SKILL_YDS_PER_PT) * 10) / 10
  const rushTDsFP    = rushTDs * SKILL_TD_PTS
  const receptionsFP = receptions * REC_PTS
  const recYardsFP   = Math.round((recYards / SKILL_YDS_PER_PT) * 10) / 10
  const recTDsFP     = recTDs * SKILL_TD_PTS
  const fumbleLostFP = fumbleLost * FUMBLE_PTS

  const total = Math.round(
    (rushYardsFP + rushTDsFP + receptionsFP + recYardsFP + recTDsFP + fumbleLostFP) * 10
  ) / 10

  return { rushAttempts, rushYards, rushYardsFP, rushTDs, rushTDsFP,
           receptions, receptionsFP, recYards, recYardsFP, recTDs, recTDsFP,
           fumbleLost, fumbleLostFP, total }
}

export function calcWrTe(groups: NflStatGroup[]): WrTeFantasy {
  const targets    = getStat(groups, 'receiv', 'targets', 'tgt', 'target')
  const receptions = getStat(groups, 'receiv', 'receptions', 'rec', 'catches')
  const recYards   = getStat(groups, 'receiv', 'receiving yards', 'yards', 'rec yards')
  const recTDs     = getStat(groups, 'receiv', 'touchdowns', 'td', 'receiving touchdowns')
  const rushYards  = getStat(groups, 'rush', 'rushing yards', 'yards', 'rush yards')
  const rushTDs    = getStat(groups, 'rush', 'touchdowns', 'td', 'rushing touchdowns')
  const fumbleLost = getStat(groups, 'fumble', 'lost', 'fumbles lost', 'lost fumbles')

  const receptionsFP = receptions * REC_PTS
  const recYardsFP   = Math.round((recYards / SKILL_YDS_PER_PT) * 10) / 10
  const recTDsFP     = recTDs * SKILL_TD_PTS
  const rushYardsFP  = Math.round((rushYards / SKILL_YDS_PER_PT) * 10) / 10
  const rushTDsFP    = rushTDs * SKILL_TD_PTS
  const fumbleLostFP = fumbleLost * FUMBLE_PTS

  const total = Math.round(
    (receptionsFP + recYardsFP + recTDsFP + rushYardsFP + rushTDsFP + fumbleLostFP) * 10
  ) / 10

  return { targets, receptions, receptionsFP, recYards, recYardsFP, recTDs, recTDsFP,
           rushYards, rushYardsFP, rushTDs, rushTDsFP, fumbleLost, fumbleLostFP, total }
}

export function calcFantasy(groups: NflStatGroup[], position: string): NflFantasy {
  const pos = position.toUpperCase()
  if (pos === 'QB') return calcQb(groups)
  if (pos === 'RB') return calcRb(groups)
  return calcWrTe(groups)  // WR, TE
}
