import { Router } from 'express';
import * as fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { getDb } from '../db';

export const importExportRouter = Router();

const EXPORT_COLUMNS = [
  'id', 'symbol', 'exchange', 'stock_name', 'side', 'entry_price', 'exit_price', 'quantity',
  'entry_at', 'exit_at', 'strategy', 'setup_type', 'stop_loss', 'target', 'notes',
  'mood', 'discipline_score', 'followed_rules', 'reflection', 'capital', 'fees',
];

importExportRouter.post('/export', (req, res) => {
  const filePath = req.body?.filePath as string;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const rows = getDb().prepare(`SELECT ${EXPORT_COLUMNS.join(',')} FROM trades ORDER BY entry_at`).all();
  const csv = stringify(rows as any[], { header: true, columns: EXPORT_COLUMNS });
  fs.writeFileSync(filePath, csv, 'utf8');
  res.json({ exported: rows.length, filePath });
});

importExportRouter.post('/import', (req, res) => {
  const filePath = req.body?.filePath as string;
  const broker = (req.body?.broker as string) || 'generic';
  if (!filePath || !fs.existsSync(filePath)) return res.status(400).json({ error: 'filePath required' });

  const raw = fs.readFileSync(filePath, 'utf8');
  const records: Array<Record<string, string>> = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  });

  const mapped = records.map((r) => mapBrokerRow(r, broker)).filter((r): r is Record<string, any> => r !== null);

  const db = getDb();
  const cols = [
    'symbol', 'exchange', 'stock_name', 'side', 'entry_price', 'exit_price', 'quantity',
    'entry_at', 'exit_at', 'strategy', 'setup_type', 'stop_loss', 'target', 'notes',
    'mood', 'discipline_score', 'followed_rules', 'reflection', 'capital', 'fees',
  ];
  const placeholders = cols.map(() => '?').join(',');
  const insert = db.prepare(`INSERT INTO trades (${cols.join(',')}) VALUES (${placeholders})`);

  const tx = db.transaction(() => {
    for (const row of mapped) insert.run(...cols.map((c) => row[c] ?? null));
  });
  tx();
  res.json({ imported: mapped.length });
});

function mapBrokerRow(r: Record<string, string>, broker: string): Record<string, any> | null {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const found = Object.keys(r).find((kk) => kk.toLowerCase() === k.toLowerCase());
      if (found && r[found] != null && r[found] !== '') return r[found];
    }
    return undefined;
  };

  const symbol = get('symbol', 'Symbol', 'tradingsymbol', 'scrip', 'Stock');
  if (!symbol) return null;

  const sideRaw = (get('side', 'transaction', 'buy_sell', 'Side') || '').toString().toUpperCase();
  const side = sideRaw.startsWith('S') ? 'SELL' : 'BUY';
  const entry_price = parseFloat(get('entry_price', 'price', 'Avg. Price', 'avg_price') || '0');
  const exit_price = parseFloat(get('exit_price', 'sell_price', 'close_price') || '0') || null;
  const quantity = parseInt(get('quantity', 'qty', 'Quantity') || '0', 10);
  const entry_at = get('entry_at', 'date', 'order_execution_time', 'trade_date') || new Date().toISOString();

  return {
    symbol: String(symbol).toUpperCase(),
    exchange: get('exchange', 'Exchange') || 'NSE',
    stock_name: get('stock_name', 'name'),
    side,
    entry_price,
    exit_price,
    quantity,
    entry_at,
    exit_at: get('exit_at', 'exit_time'),
    strategy: get('strategy'),
    setup_type: get('setup_type', 'setup'),
    stop_loss: parseFloat(get('stop_loss') || '0') || null,
    target: parseFloat(get('target') || '0') || null,
    notes: get('notes', `imported from ${broker}`),
    mood: get('mood'),
    discipline_score: parseInt(get('discipline_score') || '0', 10) || null,
    followed_rules: null,
    reflection: get('reflection'),
    capital: parseFloat(get('capital') || '0') || null,
    fees: parseFloat(get('fees', 'brokerage', 'charges') || '0') || 0,
  };
}
