import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Summary, StrategyStat } from '@/types';
import { fmtINR, fmtPct, pnl as calcPnl, isWin } from '@/lib/calc';
import StatCard from '@/components/StatCard';
import EquityCurve from '@/components/EquityCurve';
import HeatmapCalendar from '@/components/HeatmapCalendar';
import { useStore } from '@/store/useStore';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const trades = useStore((s) => s.trades);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [heatmap, setHeatmap] = useState<Array<{ date: string; pnl: number }>>([]);
  const [strats, setStrats] = useState<StrategyStat[]>([]);

  useEffect(() => {
    Promise.all([api.summary(), api.heatmap(), api.byStrategy()]).then(([s, h, st]) => {
      setSummary(s);
      setHeatmap(h);
      setStrats(st);
    });
  }, [trades.length]);

  if (!summary) {
    return <div className="p-8 text-slate-400">Loading dashboard…</div>;
  }

  const closed = trades.filter((t) => t.exit_price != null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-400">Snapshot of your trading performance</p>
        </div>
        <Link to="/trades/new" className="btn-primary">+ New Trade</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Net P&L"
          value={fmtINR(summary.totalPnl)}
          tone={summary.totalPnl >= 0 ? 'pos' : 'neg'}
          sub={`${summary.totalTrades} closed trades`}
        />
        <StatCard label="Win Rate" value={fmtPct(summary.winRate)} sub={`${summary.wins}W / ${summary.losses}L`} />
        <StatCard label="Avg R:R" value={summary.avgRR.toFixed(2)} sub="Wins ÷ Losses" />
        <StatCard
          label="Max Drawdown"
          value={fmtINR(summary.maxDrawdown)}
          tone="neg"
          sub={`Expectancy: ${fmtINR(summary.expectancy)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EquityCurve data={summary.equityCurve} />
        </div>
        <div className="card">
          <div className="text-sm text-slate-400 mb-3">Top Strategies</div>
          {strats.length === 0 && <div className="text-slate-500 text-sm">Tag strategies on your trades to see breakdown.</div>}
          <div className="space-y-2">
            {strats
              .slice()
              .sort((a, b) => b.pnl - a.pnl)
              .slice(0, 5)
              .map((s) => (
                <div key={s.strategy} className="flex items-center justify-between border-b border-bg-border pb-2 last:border-0">
                  <div>
                    <div className="text-sm">{s.strategy}</div>
                    <div className="text-[10px] text-slate-500">
                      {s.trades} trades · {fmtPct(s.winRate)} win
                    </div>
                  </div>
                  <div className={`text-sm font-mono ${s.pnl >= 0 ? 'text-win' : 'text-loss'}`}>
                    {fmtINR(s.pnl)}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <HeatmapCalendar data={heatmap} />

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-400">Recent Trades</div>
          <Link to="/trades" className="text-xs text-accent flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-slate-500 border-b border-bg-border">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Symbol</th>
                <th className="py-2 pr-4">Side</th>
                <th className="py-2 pr-4">Qty</th>
                <th className="py-2 pr-4 text-right">P&L</th>
                <th className="py-2 pr-4">Strategy</th>
              </tr>
            </thead>
            <tbody>
              {closed.slice(0, 10).map((t) => {
                const p = calcPnl(t);
                const win = isWin(t);
                return (
                  <tr key={t.id} className="border-b border-bg-border last:border-0 hover:bg-bg-panel">
                    <td className="py-2 pr-4 text-slate-400">{t.entry_at?.slice(0, 10)}</td>
                    <td className="py-2 pr-4 font-mono">{t.symbol}</td>
                    <td className="py-2 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded ${t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {t.side}
                      </span>
                    </td>
                    <td className="py-2 pr-4">{t.quantity}</td>
                    <td className={`py-2 pr-4 text-right font-mono ${win ? 'text-win' : 'text-loss'}`}>
                      <span className="inline-flex items-center gap-1">
                        {win ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {fmtINR(p)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-400">{t.strategy ?? '—'}</td>
                  </tr>
                );
              })}
              {closed.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No closed trades yet. <Link to="/trades/new" className="text-accent">Add one</Link>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
