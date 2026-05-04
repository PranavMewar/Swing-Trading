import Database from 'better-sqlite3';
import * as fs from 'node:fs';
import * as path from 'node:path';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) throw new Error('DB not initialized');
  return db;
}

export function initDb(dbPath: string): void {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      exchange TEXT NOT NULL DEFAULT 'NSE',
      stock_name TEXT,
      side TEXT NOT NULL CHECK(side IN ('BUY','SELL')),
      entry_price REAL NOT NULL,
      exit_price REAL,
      quantity INTEGER NOT NULL,
      entry_at TEXT NOT NULL,
      exit_at TEXT,
      strategy TEXT,
      setup_type TEXT,
      stop_loss REAL,
      target REAL,
      notes TEXT,
      screenshot_path TEXT,
      mood TEXT,
      discipline_score INTEGER,
      followed_rules INTEGER,
      reflection TEXT,
      capital REAL,
      fees REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
    CREATE INDEX IF NOT EXISTS idx_trades_entry_at ON trades(entry_at);
    CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy);
    CREATE INDEX IF NOT EXISTS idx_trades_setup ON trades(setup_type);

    CREATE TABLE IF NOT EXISTS stocks (
      symbol TEXT NOT NULL,
      exchange TEXT NOT NULL,
      name TEXT NOT NULL,
      series TEXT,
      isin TEXT,
      PRIMARY KEY (symbol, exchange)
    );

    CREATE INDEX IF NOT EXISTS idx_stocks_name ON stocks(name);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  seedStocks();
}

function seedStocks(): void {
  const count = (db.prepare('SELECT COUNT(*) AS c FROM stocks').get() as { c: number }).c;
  if (count > 0) return;

  const candidates = [
    path.join(__dirname, '..', '..', 'data', 'stocks.json'),
    path.join(__dirname, '..', 'data', 'stocks.json'),
    path.join(process.cwd(), 'data', 'stocks.json'),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p));
  if (!filePath) {
    console.warn('[db] no stocks seed file found, looked in:', candidates);
    return;
  }
  const stocks: Array<{ symbol: string; exchange: string; name: string; series?: string; isin?: string }> = JSON.parse(
    fs.readFileSync(filePath, 'utf8')
  );
  const insert = db.prepare(
    'INSERT OR IGNORE INTO stocks (symbol, exchange, name, series, isin) VALUES (?,?,?,?,?)'
  );
  const tx = db.transaction((rows: typeof stocks) => {
    for (const s of rows) insert.run(s.symbol, s.exchange, s.name, s.series ?? null, s.isin ?? null);
  });
  tx(stocks);
  console.log(`[db] seeded ${stocks.length} stocks`);
}
