import { Router } from 'express';
import { getDb } from '../db';

export const analyticsRouter = Router();

interface TradeRow {
  id: number;
  symbol: string;
  side: 'BUY' | 'SELL';
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_at: string;
  exit_at: string | null;
  strategy: string | null;
  setup_type: string | null;
  fees: number | null;
}

function pnl(t: TradeRow): number {
  if (t.exit_price == null) return 0;
  const gross = (t.exit_price - t.entry_price) * t.quantity * (t.side === 'BUY' ? 1 : -1);
  return gross - (t.fees ?? 0);
}

analyticsRouter.get('/summary', (req, res) => {
  const db = getDb();
  const { from, to } = req.query as Record<string, string>;
  const where: string[] = ['exit_price IS NOT NULL'];
  const params: any[] = [];
  if (from) { where.push('entry_at >= ?'); params.push(from); }
  if (to) { where.push('entry_at <= ?'); params.push(to); }

  const trades = db
    .prepare(`SELECT * FROM trades WHERE ${where.join(' AND ')} ORDER BY entry_at ASC`)
    .all(...params) as TradeRow[];

  const totalTrades = trades.length;
  const wins = trades.filter((t) => pnl(t) > 0);
  const losses = trades.filter((t) => pnl(t) < 0);
  const totalPnl = trades.reduce((sum, t) => sum + pnl(t), 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + pnl(t), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + pnl(t), 0) / losses.length : 0;
  const winRate = totalTrades ? (wins.length / totalTrades) * 100 : 0;
  const expectancy = totalTrades ? totalPnl / totalTrades : 0;
  const avgRR = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

  let equity = 0;
  let peak = 0;
  let maxDD = 0;
  const equityCurve = trades.map((t) => {
    equity += pnl(t);
    peak = Math.max(peak, equity);
    const dd = peak - equity;
    if (dd > maxDD) maxDD = dd;
    return { date: (t.exit_at ?? t.entry_at).slice(0, 10), equity, pnl: pnl(t) };
  });

  res.json({
    totalTrades,
    wins: wins.length,
    losses: losses.length,
    winRate,
    totalPnl,
    avgWin,
    avgLoss,
    avgRR,
    expectancy,
    maxDrawdown: maxDD,
    equityCurve,
  });
});

analyticsRouter.get('/heatmap', (req, res) => {
  const db = getDb();
  const { from, to } = req.query as Record<string, string>;
  const where: string[] = ['exit_price IS NOT NULL'];
  const params: any[] = [];
  if (from) { where.push('entry_at >= ?'); params.push(from); }
  if (to) { where.push('entry_at <= ?'); params.push(to); }

  const trades = db
    .prepare(`SELECT * FROM trades WHERE ${where.join(' AND ')}`)
    .all(...params) as TradeRow[];

  const byDay = new Map<string, number>();
  for (const t of trades) {
    const day = (t.exit_at ?? t.entry_at).slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + pnl(t));
  }
  res.json(Array.from(byDay.entries()).map(([date, pnl]) => ({ date, pnl })));
});

analyticsRouter.get('/monthly', (_req, res) => {
  const trades = getDb()
    .prepare("SELECT * FROM trades WHERE exit_price IS NOT NULL")
    .all() as TradeRow[];
  const byMonth = new Map<string, number>();
  for (const t of trades) {
    const m = (t.exit_at ?? t.entry_at).slice(0, 7);
    byMonth.set(m, (byMonth.get(m) ?? 0) + pnl(t));
  }
  const out = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pnl]) => ({ month, pnl }));
  res.json(out);
});

analyticsRouter.get('/by-strategy', (_req, res) => {
  const trades = getDb()
    .prepare("SELECT * FROM trades WHERE exit_price IS NOT NULL")
    .all() as TradeRow[];
  const groups = new Map<string, { trades: number; wins: number; pnl: number }>();
  for (const t of trades) {
    const key = t.strategy || 'Untagged';
    const g = groups.get(key) ?? { trades: 0, wins: 0, pnl: 0 };
    g.trades += 1;
    if (pnl(t) > 0) g.wins += 1;
    g.pnl += pnl(t);
    groups.set(key, g);
  }
  res.json(
    Array.from(groups.entries()).map(([strategy, g]) => ({
      strategy,
      trades: g.trades,
      wins: g.wins,
      winRate: g.trades ? (g.wins / g.trades) * 100 : 0,
      pnl: g.pnl,
    }))
  );
});

analyticsRouter.get('/by-setup', (_req, res) => {
  const trades = getDb()
    .prepare("SELECT * FROM trades WHERE exit_price IS NOT NULL")
    .all() as TradeRow[];
  const groups = new Map<string, { trades: number; wins: number; pnl: number }>();
  for (const t of trades) {
    const key = t.setup_type || 'Untagged';
    const g = groups.get(key) ?? { trades: 0, wins: 0, pnl: 0 };
    g.trades += 1;
    if (pnl(t) > 0) g.wins += 1;
    g.pnl += pnl(t);
    groups.set(key, g);
  }
  res.json(
    Array.from(groups.entries()).map(([setup, g]) => ({
      setup,
      trades: g.trades,
      wins: g.wins,
      winRate: g.trades ? (g.wins / g.trades) * 100 : 0,
      pnl: g.pnl,
    }))
  );
});
