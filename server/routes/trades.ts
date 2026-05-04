import { Router } from 'express';
import { getDb } from '../db';

export const tradesRouter = Router();

const COLUMNS = [
  'symbol', 'exchange', 'stock_name', 'side', 'entry_price', 'exit_price', 'quantity',
  'entry_at', 'exit_at', 'strategy', 'setup_type', 'stop_loss', 'target', 'notes',
  'screenshot_path', 'mood', 'discipline_score', 'followed_rules', 'reflection',
  'capital', 'fees',
];

tradesRouter.get('/', (req, res) => {
  const db = getDb();
  const { from, to, symbol, strategy, setup, result, limit = '5000' } = req.query as Record<string, string>;
  const where: string[] = [];
  const params: any[] = [];

  if (from) { where.push('entry_at >= ?'); params.push(from); }
  if (to) { where.push('entry_at <= ?'); params.push(to); }
  if (symbol) { where.push('symbol = ?'); params.push(symbol); }
  if (strategy) { where.push('strategy = ?'); params.push(strategy); }
  if (setup) { where.push('setup_type = ?'); params.push(setup); }
  if (result === 'win') { where.push('((side="BUY" AND exit_price > entry_price) OR (side="SELL" AND exit_price < entry_price))'); }
  if (result === 'loss') { where.push('((side="BUY" AND exit_price < entry_price) OR (side="SELL" AND exit_price > entry_price))'); }
  if (result === 'open') { where.push('exit_price IS NULL'); }

  const sql = `SELECT * FROM trades ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY entry_at DESC LIMIT ?`;
  params.push(Number(limit));
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

tradesRouter.get('/:id', (req, res) => {
  const row = getDb().prepare('SELECT * FROM trades WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

tradesRouter.post('/', (req, res) => {
  const db = getDb();
  const body = req.body ?? {};
  const placeholders = COLUMNS.map(() => '?').join(',');
  const values = COLUMNS.map((c) => body[toCamel(c)] ?? body[c] ?? null);
  const stmt = db.prepare(`INSERT INTO trades (${COLUMNS.join(',')}) VALUES (${placeholders})`);
  const info = stmt.run(...values);
  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(row);
});

tradesRouter.put('/:id', (req, res) => {
  const db = getDb();
  const body = req.body ?? {};
  const sets = COLUMNS.map((c) => `${c} = ?`).join(',');
  const values = COLUMNS.map((c) => body[toCamel(c)] ?? body[c] ?? null);
  values.push(req.params.id);
  db.prepare(`UPDATE trades SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...values);
  const row = db.prepare('SELECT * FROM trades WHERE id = ?').get(req.params.id);
  res.json(row);
});

tradesRouter.delete('/:id', (req, res) => {
  getDb().prepare('DELETE FROM trades WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

tradesRouter.get('/meta/strategies', (_req, res) => {
  const rows = getDb()
    .prepare("SELECT DISTINCT strategy FROM trades WHERE strategy IS NOT NULL AND strategy != '' ORDER BY strategy")
    .all() as Array<{ strategy: string }>;
  res.json(rows.map((r) => r.strategy));
});

function toCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}
