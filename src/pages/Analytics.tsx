import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Summary, StrategyStat, SetupStat } from '@/types';
import { fmtINR, fmtPct } from '@/lib/calc';
import StatCard from '@/components/StatCard';
import EquityCurve from '@/components/EquityCurve';
import MonthlyBars from '@/components/MonthlyBars';
import HeatmapCalendar from '@/components/HeatmapCalendar';

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<Array<{ month: string; pnl: number }>>([]);
  const [heatmap, setHeatmap] = useState<Array<{ date: string; pnl: number }>>([]);
  const [strats, setStrats] = useState<StrategyStat[]>([]);
  const [setups, setSetups] = useState<SetupStat[]>([]);

  useEffect(() => {
    Promise.all([
      api.summary(),
      api.monthly(),
      api.heatmap(),
      api.byStrategy(),
      api.bySetup(),
    ]).then(([s, m, h, st, su]) => {
      setSummary(s);
      setMonthly(m);
      setHeatmap(h);
      setStrats(st);
      setSetups(su);
    });
  }, []);

  if (!summary) return <div className="p-8 text-slate-400">Loading analytics…</div>;

  const bestStrat = [...strats].sort((a, b) => b.pnl - a.pnl)[0];
  const worstStrat = [...strats].sort((a, b) => a.pnl - b.pnl)[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-slate-400">Performance breakdown across all your trades</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Trades" value={String(summary.totalTrades)} />
        <StatCard label="Win Rate" value={fmtPct(summary.winRate)} />
        <StatCard label="Avg Win" value={fmtINR(summary.avgWin)} tone="pos" />
        <StatCard label="Avg Loss" value={fmtINR(summary.avgLoss)} tone="neg" />
        <StatCard label="Expectancy" value={fmtINR(summary.expectancy)} tone={summary.expectancy >= 0 ? 'pos' : 'neg'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EquityCurve data={summary.equityCurve} />
        <MonthlyBars data={monthly} />
      </div>

      <HeatmapCalendar data={heatmap} />

      {bestStrat && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card border-emerald-500/30">
            <div className="text-xs uppercase text-slate-500">Best Strategy</div>
            <div className="text-lg font-semibold mt-1">{bestStrat.strategy}</div>
            <div className="text-sm text-emerald-400 font-mono">{fmtINR(bestStrat.pnl)}</div>
            <div className="text-xs text-slate-400">{bestStrat.trades} trades · {fmtPct(bestStrat.winRate)} win</div>
          </div>
          {worstStrat && worstStrat.strategy !== bestStrat.strategy && (
            <div className="card border-rose-500/30">
              <div className="text-xs uppercase text-slate-500">Worst Strategy</div>
              <div className="text-lg font-semibold mt-1">{worstStrat.strategy}</div>
              <div className="text-sm text-rose-400 font-mono">{fmtINR(worstStrat.pnl)}</div>
              <div className="text-xs text-slate-400">{worstStrat.trades} trades · {fmtPct(worstStrat.winRate)} win</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-sm text-slate-400 mb-3">By Strategy</div>
          <Table
            cols={['Strategy', 'Trades', 'Win %', 'P&L']}
            rows={strats.map((s) => [s.strategy, String(s.trades), fmtPct(s.winRate), fmtINR(s.pnl)])}
            colored={(r) => r[3].includes('-')}
          />
        </div>
        <div className="card">
          <div className="text-sm text-slate-400 mb-3">By Setup</div>
          <Table
            cols={['Setup', 'Trades', 'Win %', 'P&L']}
            rows={setups.map((s) => [s.setup, String(s.trades), fmtPct(s.winRate), fmtINR(s.pnl)])}
            colored={(r) => r[3].includes('-')}
          />
        </div>
      </div>
    </div>
  );
}

function Table({ cols, rows, colored }: { cols: string[]; rows: string[][]; colored?: (r: string[]) => boolean }) {
  if (rows.length === 0) return <div className="text-slate-500 text-sm">No data yet.</div>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase text-slate-500 border-b border-bg-border">
          {cols.map((c) => <th key={c} className="py-2">{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-bg-border last:border-0">
            {r.map((cell, j) => (
              <td key={j} className={`py-2 ${j === r.length - 1 ? `text-right font-mono ${colored?.(r) ? 'text-loss' : 'text-win'}` : ''}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
