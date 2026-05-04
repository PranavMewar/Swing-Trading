import { Router } from 'express';
import { getDb } from '../db';

export const stocksRouter = Router();

stocksRouter.get('/search', (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const exchange = req.query.exchange as string | undefined;
  const limit = Math.min(Number(req.query.limit ?? 30), 200);
  const db = getDb();

  if (!q) {
    const rows = db
      .prepare('SELECT symbol, exchange, name FROM stocks ORDER BY symbol LIMIT ?')
      .all(limit);
    return res.json(rows);
  }

  const like = `${q}%`;
  const contains = `%${q}%`;
  const params: any[] = [like, like, contains];
  let sql = `
    SELECT symbol, exchange, name FROM stocks
    WHERE (symbol LIKE ? OR name LIKE ? OR name LIKE ?)
  `;
  if (exchange) {
    sql += ' AND exchange = ?';
    params.push(exchange);
  }
  sql += `
    ORDER BY
      CASE WHEN symbol = ? THEN 0
           WHEN symbol LIKE ? THEN 1
           WHEN name LIKE ? THEN 2
           ELSE 3 END,
      symbol
    LIMIT ?
  `;
  params.push(q.toUpperCase(), like, like, limit);
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

stocksRouter.get('/count', (_req, res) => {
  const row = getDb().prepare('SELECT COUNT(*) AS count FROM stocks').get();
  res.json(row);
});

stocksRouter.post('/bulk', (req, res) => {
  const stocks: Array<{ symbol: string; exchange: string; name: string; series?: string; isin?: string }> = req.body;
  if (!Array.isArray(stocks)) return res.status(400).json({ error: 'array required' });
  const db = getDb();
  const insert = db.prepare(
    'INSERT OR REPLACE INTO stocks (symbol, exchange, name, series, isin) VALUES (?,?,?,?,?)'
  );
  const tx = db.transaction(() => {
    for (const s of stocks) insert.run(s.symbol, s.exchange, s.name, s.series ?? null, s.isin ?? null);
  });
  tx();
  res.json({ inserted: stocks.length });
});
