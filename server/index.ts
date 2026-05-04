import express from 'express';
import cors from 'cors';
import * as path from 'node:path';
import { initDb } from './db';
import { tradesRouter } from './routes/trades';
import { stocksRouter } from './routes/stocks';
import { analyticsRouter } from './routes/analytics';
import { importExportRouter } from './routes/importExport';
import { settingsRouter } from './routes/settings';

export async function startServer(port: number, userDataDir: string): Promise<void> {
  const dbPath = path.join(userDataDir, 'journal.db');
  initDb(dbPath);

  const app = express();
  app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'file://'] }));
  app.use(express.json({ limit: '20mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, dbPath }));

  app.use('/api/trades', tradesRouter);
  app.use('/api/stocks', stocksRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/io', importExportRouter);
  app.use('/api/settings', settingsRouter);

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('[server]', err);
    res.status(500).json({ error: err.message });
  });

  await new Promise<void>((resolve) => app.listen(port, '127.0.0.1', resolve));
  console.log(`[server] listening http://127.0.0.1:${port}`);
}
