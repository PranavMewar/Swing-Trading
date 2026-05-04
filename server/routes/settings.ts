import { Router } from 'express';
import CryptoJS from 'crypto-js';
import { getDb } from '../db';

export const settingsRouter = Router();

settingsRouter.get('/', (_req, res) => {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as Array<{ key: string; value: string }>;
  const obj: Record<string, string> = {};
  for (const r of rows) obj[r.key] = r.value;
  res.json(obj);
});

settingsRouter.put('/:key', (req, res) => {
  const { key } = req.params;
  const value = String(req.body?.value ?? '');
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
  res.json({ ok: true });
});

settingsRouter.post('/password/set', (req, res) => {
  const password = String(req.body?.password ?? '');
  if (!password) return res.status(400).json({ error: 'password required' });
  const hash = CryptoJS.SHA256(password).toString();
  getDb()
    .prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run('password_hash', hash);
  res.json({ ok: true });
});

settingsRouter.post('/password/verify', (req, res) => {
  const password = String(req.body?.password ?? '');
  const row = getDb().prepare("SELECT value FROM settings WHERE key='password_hash'").get() as { value: string } | undefined;
  if (!row) return res.json({ ok: true, hasPassword: false });
  const hash = CryptoJS.SHA256(password).toString();
  res.json({ ok: hash === row.value, hasPassword: true });
});
