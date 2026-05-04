import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fmtINR, fmtPct, pnl, pnlPercent, isWin } from '@/lib/calc';
import { Trash2, Pencil, Filter } from 'lucide-react';

export default function Trades() {
  const { trades, filters, setFilter, clearFilters, loadTrades, removeTrade } = useStore();

  useEffect(() => {
    loadTrades();
  }, [filters]);

  const totals = useMemo(() => {
    const closed = trades.filter((t) => t.exit_price != null);
    const total = closed.reduce((s, t) => s + pnl(t), 0);
    return { count: trades.length, closed: closed.length, total };
  }, [trades]);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trades</h1>
          <p className="text-sm text-slate-400">
            {totals.count} total · {totals.closed} closed · Net{' '}
            <span className={totals.total >= 0 ? 'text-win' : 'text-loss'}>{fmtINR(totals.total)}</span>
          </p>
        </div>
        <Link to="/trades/new" className="btn-primary">+ New Trade</Link>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              value={filters.from ?? ''}
              onChange={(e) => setFilter({ from: e.target.value || undefined })}
              className="w-full"
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              value={filters.to ?? ''}
              onChange={(e) => setFilter({ to: e.target.value || undefined })}
              className="w-full"
            />
          </div>
          <div>
            <label className="label">Symbol</label>
            <input
              type="text"
              value={filters.symbol ?? ''}
              onChange={(e) => setFilter({ symbol: e.target.value.toUpperCase() || undefined })}
              className="w-full font-mono"
              placeholder="RELIANCE"
            />
          </div>
          <div>
            <label className="label">Strategy</label>
            <input
              type="text"
              value={filters.strategy ?? ''}
              onChange={(e) => setFilter({ strategy: e.target.value || undefined })}
              className="w-full"
            />
          </div>
          <div>
            <label className="label">Setup</label>
            <input
              type="text"
              value={filters.setup ?? ''}
              onChange={(e) => setFilter({ setup: e.target.value || undefined })}
              className="w-full"
            />
          </div>
          <div>
            <label className="label">Result</label>
            <select
              value={filters.result ?? ''}
              onChange={(e) => setFilter({ result: (e.target.value as any) || undefined })}
              className="w-full"
            >
              <option value="">All</option>
              <option value="win">Wins</option>
              <option value="loss">Losses</option>
              <option value="open">Open</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={clearFilters} className="btn">Clear</button>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-slate-500 border-b border-bg-border">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Symbol</th>
              <th className="py-3 px-4">Side</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Entry</th>
              <th className="py-3 px-4 text-right">Exit</th>
              <th className="py-3 px-4 text-right">P&L</th>
              <th className="py-3 px-4 text-right">P&L %</th>
              <th className="py-3 px-4">Strategy</th>
              <th className="py-3 px-4">Setup</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const p = pnl(t);
              const pp = pnlPercent(t);
              const win = isWin(t);
              return (
                <tr key={t.id} className="border-b border-bg-border last:border-0 hover:bg-bg-panel">
                  <td className="py-2 px-4 text-slate-400">{t.entry_at?.slice(0, 16).replace('T', ' ')}</td>
                  <td className="py-2 px-4 font-mono">
                    <div>{t.symbol}</div>
                    <div className="text-[10px] text-slate-500">{t.exchange}</div>
                  </td>
                  <td className="py-2 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded ${t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {t.side}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right font-mono">{t.quantity}</td>
                  <td className="py-2 px-4 text-right font-mono">{t.entry_price.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right font-mono">
                    {t.exit_price != null ? t.exit_price.toFixed(2) : <span className="text-slate-500">—</span>}
                  </td>
                  <td className={`py-2 px-4 text-right font-mono ${win == null ? 'text-slate-500' : win ? 'text-win' : 'text-loss'}`}>
                    {t.exit_price != null ? fmtINR(p) : '—'}
                  </td>
                  <td className={`py-2 px-4 text-right font-mono ${win == null ? 'text-slate-500' : win ? 'text-win' : 'text-loss'}`}>
                    {t.exit_price != null ? fmtPct(pp) : '—'}
                  </td>
                  <td className="py-2 px-4 text-slate-300">{t.strategy ?? '—'}</td>
                  <td className="py-2 px-4 text-slate-300">{t.setup_type ?? '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex gap-1 justify-end">
                      <Link to={`/trades/${t.id}`} className="btn !px-2 !py-1">
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Delete this trade?')) removeTrade(t.id!);
                        }}
                        className="btn-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {trades.length === 0 && (
              <tr>
                <td colSpan={11} className="py-10 text-center text-slate-500">
                  No trades yet. <Link to="/trades/new" className="text-accent">Add your first one</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
