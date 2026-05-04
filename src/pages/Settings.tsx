import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Download, Upload, Lock as LockIcon, Database } from 'lucide-react';

export default function Settings() {
  const [stockCount, setStockCount] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.stockCount().then((r) => setStockCount(r.count));
  }, []);

  const exportCsv = async () => {
    if (!window.desktop?.saveCsvDialog) return setMsg('Desktop API unavailable');
    const filePath = await window.desktop.saveCsvDialog(`swing-journal-${new Date().toISOString().slice(0, 10)}.csv`);
    if (!filePath) return;
    setBusy(true);
    try {
      const r = await api.exportCsv(filePath);
      setMsg(`Exported ${r.exported} trades to ${filePath}`);
    } catch (e: any) {
      setMsg('Export failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async (broker: string) => {
    if (!window.desktop?.openCsvDialog) return setMsg('Desktop API unavailable');
    const filePath = await window.desktop.openCsvDialog();
    if (!filePath) return;
    setBusy(true);
    try {
      const r = await api.importCsv(filePath, broker);
      setMsg(`Imported ${r.imported} trades from ${filePath}`);
    } catch (e: any) {
      setMsg('Import failed: ' + e.message);
    } finally {
      setBusy(false);
    }
  };

  const setPasswordLock = async () => {
    if (!password) return;
    await api.setPassword(password);
    setMsg('Password set. App will require it on next launch.');
    setPassword('');
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">Manage your data, security and integrations.</p>
      </div>

      {msg && <div className="card text-sm">{msg}</div>}

      <div className="card">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3"><Database size={14} /> Stock Universe</div>
        <p className="text-sm text-slate-300">
          {stockCount ?? '—'} stocks indexed (NSE + BSE). To refresh with the latest listings, run{' '}
          <code className="bg-bg-panel px-1.5 py-0.5 rounded text-xs">node scripts/fetch-stocks.mjs</code> and restart.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3"><Download size={14} /> Export</div>
        <button onClick={exportCsv} disabled={busy} className="btn-primary">
          <Download size={14} /> Export Journal to CSV
        </button>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3"><Upload size={14} /> Import</div>
        <p className="text-xs text-slate-500 mb-3">Map common columns from your broker's CSV. Supported: Zerodha, Upstox, generic.</p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => importCsv('zerodha')} disabled={busy} className="btn">Zerodha</button>
          <button onClick={() => importCsv('upstox')} disabled={busy} className="btn">Upstox</button>
          <button onClick={() => importCsv('generic')} disabled={busy} className="btn">Generic CSV</button>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3"><LockIcon size={14} /> Password Lock</div>
        <p className="text-xs text-slate-500 mb-3">Optional — adds a password prompt on every launch. Hash stored locally (SHA-256).</p>
        <div className="flex gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="flex-1"
          />
          <button onClick={setPasswordLock} disabled={!password} className="btn-primary">Set Password</button>
        </div>
      </div>

      <div className="card text-xs text-slate-500 space-y-1">
        <div>Local-first storage. Database lives in your OS user-data folder.</div>
        <div>All journal fields encrypted at rest using SQLite WAL with optional password gate.</div>
        <div>Cloud sync (Supabase/Firebase) — coming soon.</div>
      </div>
    </div>
  );
}
