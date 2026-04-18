import {
  getResponseItems, extractGroups, extractGameLabel, calcFantasy,
  type QbFantasy, type RbFantasy, type WrTeFantasy, type NflFantasy,
} from '../utils/nflFantasyScoring'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fpColor(val: number) {
  if (val > 0) return 'text-green-400'
  if (val < 0) return 'text-red-400'
  return 'text-gray-500'
}

function fmt(n: number, decimals = 1) {
  if (n === 0) return '—'
  return n % 1 === 0 ? String(n) : n.toFixed(decimals)
}

function fmtFp(n: number) {
  if (n === 0) return '—'
  return n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1)
}

// ─── season-total breakdown card ──────────────────────────────────────────────

interface BreakdownRow { label: string; stat: string | number; fp: number }

function buildRows(f: NflFantasy, position: string): BreakdownRow[] {
  const pos = position.toUpperCase()
  if (pos === 'QB') {
    const q = f as QbFantasy
    return [
      { label: 'Pass Yards',     stat: q.passYards,       fp: q.passYardsFP      },
      { label: 'Pass TDs',       stat: q.passTDs,         fp: q.passTDsFP        },
      { label: 'Interceptions',  stat: q.ints,            fp: q.intsFP           },
      { label: 'Rush Yards',     stat: q.rushYards,       fp: q.rushYardsFP      },
      { label: 'Rush TDs',       stat: q.rushTDs,         fp: q.rushTDsFP        },
      // Receiving rows — filtered out automatically when 0
      { label: 'Receptions',     stat: q.recReceptions,   fp: q.recReceptionsFP  },
      { label: 'Rec Yards',      stat: q.recYards,        fp: q.recYardsFP       },
      { label: 'Rec TDs',        stat: q.recTDs,          fp: q.recTDsFP         },
      { label: 'Fumbles Lost',   stat: q.fumbleLost,      fp: q.fumbleLostFP     },
    ]
  }
  if (pos === 'RB') {
    const r = f as RbFantasy
    return [
      { label: 'Rush Attempts',  stat: r.rushAttempts, fp: 0             },
      { label: 'Rush Yards',     stat: r.rushYards,    fp: r.rushYardsFP },
      { label: 'Rush TDs',       stat: r.rushTDs,      fp: r.rushTDsFP   },
      { label: 'Receptions',     stat: r.receptions,   fp: r.receptionsFP},
      { label: 'Rec Yards',      stat: r.recYards,     fp: r.recYardsFP  },
      { label: 'Rec TDs',        stat: r.recTDs,       fp: r.recTDsFP    },
      { label: 'Fumbles Lost',   stat: r.fumbleLost,   fp: r.fumbleLostFP},
    ]
  }
  // WR / TE
  const w = f as WrTeFantasy
  return [
    { label: 'Targets',          stat: w.targets,     fp: 0              },
    { label: 'Receptions',       stat: w.receptions,  fp: w.receptionsFP },
    { label: 'Rec Yards',        stat: w.recYards,    fp: w.recYardsFP   },
    { label: 'Rec TDs',          stat: w.recTDs,      fp: w.recTDsFP     },
    { label: 'Rush Yards',       stat: w.rushYards,   fp: w.rushYardsFP  },
    { label: 'Rush TDs',         stat: w.rushTDs,     fp: w.rushTDsFP    },
    { label: 'Fumbles Lost',     stat: w.fumbleLost,  fp: w.fumbleLostFP },
  ]
}

function SeasonBreakdown({ fantasy, position }: { fantasy: NflFantasy; position: string }) {
  const rows = buildRows(fantasy, position).filter(r => r.stat !== 0 || r.fp !== 0)
  const totalFP = fantasy.total

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-700/60 border-b border-gray-700 flex items-center justify-between">
        <span className="text-white font-semibold text-sm">Fantasy Points (PPR)</span>
        <span className={`text-lg font-bold tabular-nums ${
          totalFP >= 20 ? 'text-blue-300' : totalFP >= 10 ? 'text-blue-400' : 'text-gray-300'
        }`}>
          {totalFP.toFixed(1)} pts
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-700/50">
            <th className="px-4 py-2 text-left font-medium">Stat</th>
            <th className="px-4 py-2 text-right font-medium">Value</th>
            <th className="px-4 py-2 text-right font-medium">FP</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/40">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-700/30 transition-colors">
              <td className="px-4 py-2 text-gray-400">{row.label}</td>
              <td className="px-4 py-2 text-right text-white font-medium tabular-nums">
                {fmt(Number(row.stat), 0)}
              </td>
              <td className={`px-4 py-2 text-right font-medium tabular-nums ${fpColor(row.fp)}`}>
                {row.fp !== 0 ? fmtFp(row.fp) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-600 bg-gray-700/30">
            <td className="px-4 py-2.5 text-white font-bold" colSpan={2}>Total</td>
            <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${fpColor(totalFP)}`}>
              {totalFP.toFixed(1)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── per-game (game log) table ────────────────────────────────────────────────

interface GameRow {
  label: string
  fantasy: NflFantasy
}

const ZERO_QB: QbFantasy = {
  passYards:0, passYardsFP:0, passTDs:0, passTDsFP:0, ints:0, intsFP:0,
  rushYards:0, rushYardsFP:0, rushTDs:0, rushTDsFP:0,
  recReceptions:0, recReceptionsFP:0, recYards:0, recYardsFP:0, recTDs:0, recTDsFP:0,
  fumbleLost:0, fumbleLostFP:0, total:0,
}

function QbGameTable({ rows }: { rows: GameRow[] }) {
  const totQ = rows.reduce<QbFantasy>((acc, r) => {
    const q = r.fantasy as QbFantasy
    return {
      passYards:      acc.passYards      + q.passYards,
      passYardsFP:    acc.passYardsFP    + q.passYardsFP,
      passTDs:        acc.passTDs        + q.passTDs,
      passTDsFP:      acc.passTDsFP      + q.passTDsFP,
      ints:           acc.ints           + q.ints,
      intsFP:         acc.intsFP         + q.intsFP,
      rushYards:      acc.rushYards      + q.rushYards,
      rushYardsFP:    acc.rushYardsFP    + q.rushYardsFP,
      rushTDs:        acc.rushTDs        + q.rushTDs,
      rushTDsFP:      acc.rushTDsFP      + q.rushTDsFP,
      recReceptions:  acc.recReceptions  + q.recReceptions,
      recReceptionsFP:acc.recReceptionsFP+ q.recReceptionsFP,
      recYards:       acc.recYards       + q.recYards,
      recYardsFP:     acc.recYardsFP     + q.recYardsFP,
      recTDs:         acc.recTDs         + q.recTDs,
      recTDsFP:       acc.recTDsFP       + q.recTDsFP,
      fumbleLost:     acc.fumbleLost     + q.fumbleLost,
      fumbleLostFP:   acc.fumbleLostFP   + q.fumbleLostFP,
      total:          Math.round((acc.total + q.total) * 10) / 10,
    }
  }, { ...ZERO_QB })

  // Only show receiving columns when at least one game has QB receiving activity
  const showRec = rows.some(r => {
    const q = r.fantasy as QbFantasy
    return q.recReceptions > 0 || q.recYards > 0 || q.recTDs > 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse" style={{ minWidth: showRec ? '950px' : '750px' }}>
        <thead>
          <tr className="border-b-2 border-gray-600">
            <th colSpan={2} className="pb-1 px-3 text-left text-xs text-gray-500 uppercase" />
            <th colSpan={3} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Passing</th>
            <th colSpan={2} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Rushing</th>
            {showRec && (
              <th colSpan={3} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Receiving</th>
            )}
            <th colSpan={2} className="pb-1 px-3 text-center text-xs text-blue-400 uppercase font-bold border-l border-gray-700">Fantasy</th>
          </tr>
          <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
            <th className="pb-2 px-3 text-left w-8">#</th>
            <th className="pb-2 px-3 text-left">Date</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700">Yds</th>
            <th className="pb-2 px-3 text-center">TD</th>
            <th className="pb-2 px-3 text-center">INT</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700">Yds</th>
            <th className="pb-2 px-3 text-center">TD</th>
            {showRec && <>
              <th className="pb-2 px-3 text-center border-l border-gray-700">Rec</th>
              <th className="pb-2 px-3 text-center">Yds</th>
              <th className="pb-2 px-3 text-center">TD</th>
            </>}
            <th className="pb-2 px-3 text-center border-l border-gray-700 text-blue-400/70">FL</th>
            <th className="pb-2 px-3 text-center text-blue-300 font-bold">FP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const q = row.fantasy as QbFantasy
            return (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td className="py-2.5 px-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-white text-xs font-bold">{i + 1}</span>
                </td>
                <td className="py-2.5 px-3 text-gray-400 text-xs">{row.label}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums border-l border-gray-800">{fmt(q.passYards, 0)}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">{fmt(q.passTDs, 0)}</td>
                <td className={`py-2.5 px-3 text-center tabular-nums ${q.ints > 0 ? 'text-red-400' : 'text-gray-400'}`}>{fmt(q.ints, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums border-l border-gray-800">{fmt(q.rushYards, 0)}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">{fmt(q.rushTDs, 0)}</td>
                {showRec && <>
                  <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums border-l border-gray-800">{fmt(q.recReceptions, 0)}</td>
                  <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums">{fmt(q.recYards, 0)}</td>
                  <td className="py-2.5 px-3 text-center tabular-nums">{fmt(q.recTDs, 0)}</td>
                </>}
                <td className={`py-2.5 px-3 text-center tabular-nums border-l border-gray-800 ${q.fumbleLost > 0 ? 'text-red-400' : 'text-gray-500'}`}>{fmt(q.fumbleLost, 0)}</td>
                <td className={`py-2.5 px-3 text-center font-bold tabular-nums ${fpColor(q.total)}`}>{q.total.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-600 bg-gray-800/60 text-xs font-bold text-gray-300 uppercase tracking-wide">
            <td colSpan={2} className="py-2.5 px-3">Season Total</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(totQ.passYards, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(totQ.passTDs, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(totQ.ints, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(totQ.rushYards, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(totQ.rushTDs, 0)}</td>
            {showRec && <>
              <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(totQ.recReceptions, 0)}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{fmt(totQ.recYards, 0)}</td>
              <td className="py-2.5 px-3 text-center tabular-nums">{fmt(totQ.recTDs, 0)}</td>
            </>}
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(totQ.fumbleLost, 0)}</td>
            <td className={`py-2.5 px-3 text-center tabular-nums ${fpColor(totQ.total)}`}>{totQ.total.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function RbGameTable({ rows }: { rows: GameRow[] }) {
  const zero: RbFantasy = { rushAttempts:0,rushYards:0,rushYardsFP:0,rushTDs:0,rushTDsFP:0,
    receptions:0,receptionsFP:0,recYards:0,recYardsFP:0,recTDs:0,recTDsFP:0,
    fumbleLost:0,fumbleLostFP:0,total:0 }
  const tot = rows.reduce<RbFantasy>((acc, r) => {
    const b = r.fantasy as RbFantasy
    return { ...acc,
      rushAttempts: acc.rushAttempts + b.rushAttempts,
      rushYards: acc.rushYards + b.rushYards, rushYardsFP: acc.rushYardsFP + b.rushYardsFP,
      rushTDs: acc.rushTDs + b.rushTDs, rushTDsFP: acc.rushTDsFP + b.rushTDsFP,
      receptions: acc.receptions + b.receptions, receptionsFP: acc.receptionsFP + b.receptionsFP,
      recYards: acc.recYards + b.recYards, recYardsFP: acc.recYardsFP + b.recYardsFP,
      recTDs: acc.recTDs + b.recTDs, recTDsFP: acc.recTDsFP + b.recTDsFP,
      fumbleLost: acc.fumbleLost + b.fumbleLost, fumbleLostFP: acc.fumbleLostFP + b.fumbleLostFP,
      total: Math.round((acc.total + b.total) * 10) / 10,
    }
  }, zero)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[750px] w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-600">
            <th colSpan={2} className="pb-1 px-3 text-left text-xs text-gray-500 uppercase" />
            <th colSpan={3} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Rushing</th>
            <th colSpan={3} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Receiving</th>
            <th colSpan={2} className="pb-1 px-3 text-center text-xs text-blue-400 uppercase font-bold border-l border-gray-700">Fantasy</th>
          </tr>
          <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
            <th className="pb-2 px-3 text-left w-8">#</th>
            <th className="pb-2 px-3 text-left">Date</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700">Att</th>
            <th className="pb-2 px-3 text-center">Yds</th>
            <th className="pb-2 px-3 text-center">TD</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700">Rec</th>
            <th className="pb-2 px-3 text-center">Yds</th>
            <th className="pb-2 px-3 text-center">TD</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700 text-blue-400/70">FL</th>
            <th className="pb-2 px-3 text-center text-blue-300 font-bold">FP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const b = row.fantasy as RbFantasy
            return (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td className="py-2.5 px-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-white text-xs font-bold">{i + 1}</span></td>
                <td className="py-2.5 px-3 text-gray-400 text-xs">{row.label}</td>
                <td className="py-2.5 px-3 text-center text-gray-400 tabular-nums border-l border-gray-800">{fmt(b.rushAttempts, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums">{fmt(b.rushYards, 0)}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">{fmt(b.rushTDs, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums border-l border-gray-800">{fmt(b.receptions, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums">{fmt(b.recYards, 0)}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">{fmt(b.recTDs, 0)}</td>
                <td className={`py-2.5 px-3 text-center tabular-nums border-l border-gray-800 ${b.fumbleLost > 0 ? 'text-red-400' : 'text-gray-500'}`}>{fmt(b.fumbleLost, 0)}</td>
                <td className={`py-2.5 px-3 text-center font-bold tabular-nums ${fpColor(b.total)}`}>{b.total.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-600 bg-gray-800/60 text-xs font-bold text-gray-300 uppercase tracking-wide">
            <td colSpan={2} className="py-2.5 px-3">Season Total</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(tot.rushAttempts, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.rushYards, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.rushTDs, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(tot.receptions, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.recYards, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.recTDs, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(tot.fumbleLost, 0)}</td>
            <td className={`py-2.5 px-3 text-center tabular-nums ${fpColor(tot.total)}`}>{tot.total.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function WrTeGameTable({ rows }: { rows: GameRow[] }) {
  const zero: WrTeFantasy = { targets:0,receptions:0,receptionsFP:0,recYards:0,recYardsFP:0,
    recTDs:0,recTDsFP:0,rushYards:0,rushYardsFP:0,rushTDs:0,rushTDsFP:0,
    fumbleLost:0,fumbleLostFP:0,total:0 }
  const tot = rows.reduce<WrTeFantasy>((acc, r) => {
    const w = r.fantasy as WrTeFantasy
    return { ...acc,
      targets: acc.targets + w.targets,
      receptions: acc.receptions + w.receptions, receptionsFP: acc.receptionsFP + w.receptionsFP,
      recYards: acc.recYards + w.recYards, recYardsFP: acc.recYardsFP + w.recYardsFP,
      recTDs: acc.recTDs + w.recTDs, recTDsFP: acc.recTDsFP + w.recTDsFP,
      rushYards: acc.rushYards + w.rushYards, rushYardsFP: acc.rushYardsFP + w.rushYardsFP,
      rushTDs: acc.rushTDs + w.rushTDs, rushTDsFP: acc.rushTDsFP + w.rushTDsFP,
      fumbleLost: acc.fumbleLost + w.fumbleLost, fumbleLostFP: acc.fumbleLostFP + w.fumbleLostFP,
      total: Math.round((acc.total + w.total) * 10) / 10,
    }
  }, zero)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[650px] w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-600">
            <th colSpan={2} className="pb-1 px-3 text-left text-xs text-gray-500 uppercase" />
            <th colSpan={4} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Receiving</th>
            <th colSpan={2} className="pb-1 px-3 text-center text-xs text-gray-400 uppercase font-bold border-l border-gray-700">Rushing</th>
            <th colSpan={2} className="pb-1 px-3 text-center text-xs text-blue-400 uppercase font-bold border-l border-gray-700">Fantasy</th>
          </tr>
          <tr className="border-b border-gray-700 text-xs text-gray-500 uppercase tracking-wider">
            <th className="pb-2 px-3 text-left w-8">#</th>
            <th className="pb-2 px-3 text-left">Date</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700">Tgt</th>
            <th className="pb-2 px-3 text-center">Rec</th>
            <th className="pb-2 px-3 text-center">Yds</th>
            <th className="pb-2 px-3 text-center">TD</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700">Yds</th>
            <th className="pb-2 px-3 text-center">TD</th>
            <th className="pb-2 px-3 text-center border-l border-gray-700 text-blue-400/70">FL</th>
            <th className="pb-2 px-3 text-center text-blue-300 font-bold">FP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const w = row.fantasy as WrTeFantasy
            return (
              <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/40 transition-colors">
                <td className="py-2.5 px-3"><span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-900 text-white text-xs font-bold">{i + 1}</span></td>
                <td className="py-2.5 px-3 text-gray-400 text-xs">{row.label}</td>
                <td className="py-2.5 px-3 text-center text-gray-400 tabular-nums border-l border-gray-800">{fmt(w.targets, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums">{fmt(w.receptions, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums">{fmt(w.recYards, 0)}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">{fmt(w.recTDs, 0)}</td>
                <td className="py-2.5 px-3 text-center text-gray-200 tabular-nums border-l border-gray-800">{fmt(w.rushYards, 0)}</td>
                <td className="py-2.5 px-3 text-center tabular-nums">{fmt(w.rushTDs, 0)}</td>
                <td className={`py-2.5 px-3 text-center tabular-nums border-l border-gray-800 ${w.fumbleLost > 0 ? 'text-red-400' : 'text-gray-500'}`}>{fmt(w.fumbleLost, 0)}</td>
                <td className={`py-2.5 px-3 text-center font-bold tabular-nums ${fpColor(w.total)}`}>{w.total.toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-600 bg-gray-800/60 text-xs font-bold text-gray-300 uppercase tracking-wide">
            <td colSpan={2} className="py-2.5 px-3">Season Total</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(tot.targets, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.receptions, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.recYards, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.recTDs, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(tot.rushYards, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums">{fmt(tot.rushTDs, 0)}</td>
            <td className="py-2.5 px-3 text-center tabular-nums border-l border-gray-700">{fmt(tot.fumbleLost, 0)}</td>
            <td className={`py-2.5 px-3 text-center tabular-nums ${fpColor(tot.total)}`}>{tot.total.toFixed(1)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ─── scoring key ──────────────────────────────────────────────────────────────

function ScoringKey({ position }: { position: string }) {
  const pos = position.toUpperCase()
  const rules =
    pos === 'QB'
      ? ['Pass Yds: 1 pt / 25 yds', 'Pass TD: +4', 'INT: −2', 'Rush Yds: 1 pt / 10 yds', 'Rush TD: +6', 'Reception: +1 (PPR)', 'Rec Yds: 1 pt / 10 yds', 'Rec TD: +6', 'Fumble Lost: −2']
      : pos === 'RB'
      ? ['Rush Yds: 1 pt / 10 yds', 'Rush TD: +6', 'Reception: +1 (PPR)', 'Rec Yds: 1 pt / 10 yds', 'Rec TD: +6', 'Fumble Lost: −2']
      : ['Reception: +1 (PPR)', 'Rec Yds: 1 pt / 10 yds', 'Rec TD: +6', 'Rush Yds: 1 pt / 10 yds', 'Fumble Lost: −2']
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
      {rules.map((r, i) => <span key={i}>{r}</span>)}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

interface Props {
  data: unknown            // StatsResponse.data (raw API JSON envelope)
  position: string
  statType: 'seasonal' | 'career' | 'gamelogs'
}

export default function NflFantasyScoreCard({ data, position, statType }: Props) {
  const pos = position.toUpperCase()
  if (!['QB', 'RB', 'WR', 'TE'].includes(pos)) return null

  const items = getResponseItems(data)
  if (items.length === 0) return null

  // For game logs with multiple items: per-game table
  if (statType === 'gamelogs' && items.length > 1) {
    const gameRows: GameRow[] = items.map((item, i) => {
      const groups = extractGroups(item)
      const label = extractGameLabel(item) ?? `Game ${i + 1}`
      return { label, fantasy: calcFantasy(groups, position) }
    })

    const header = (
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-semibold text-sm">Fantasy Points per Game (PPR)</span>
        <span className={`text-base font-bold tabular-nums ${fpColor(gameRows.reduce((s, r) => s + r.fantasy.total, 0))}`}>
          {gameRows.reduce((s, r) => s + r.fantasy.total, 0).toFixed(1)} pts total
        </span>
      </div>
    )

    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden p-4">
        {header}
        {pos === 'QB'         && <QbGameTable   rows={gameRows} />}
        {pos === 'RB'         && <RbGameTable   rows={gameRows} />}
        {(pos === 'WR' || pos === 'TE') && <WrTeGameTable rows={gameRows} />}
        <ScoringKey position={position} />
      </div>
    )
  }

  // For seasonal (or game logs with just one entry): aggregate all items and show breakdown
  const allGroups = items.flatMap(extractGroups)
  const fantasy = calcFantasy(allGroups, position)

  return (
    <div>
      <SeasonBreakdown fantasy={fantasy} position={position} />
      <ScoringKey position={position} />
    </div>
  )
}
