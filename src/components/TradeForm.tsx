import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StockSearch from './StockSearch';
import type { Trade } from '@/types';
import { MOODS, SETUP_TYPES } from '@/types';
import { pnl, pnlPercent, riskReward, positionSize, fmtINR, fmtPct } from '@/lib/calc';
import { useStore } from '@/store/useStore';
import { Image as ImageIcon, Save, X } from 'lucide-react';

interface Props {
  initial?: Trade;
  onDone?: () => void;
}

export default function TradeForm({ initial, onDone }: Props) {
  const nav = useNavigate();
  const { addTrade, updateTrade } = useStore();

  const [form, setForm] = useState<Partial<Trade>>(
    initial ?? {
      side: 'BUY',
      exchange: 'NSE',
      entry_at: new Date().toISOString().slice(0, 16),
      quantity: 0,
      entry_price: 0,
      exit_price: null,
      followed_rules: 1,
      discipline_score: 7,
    }
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm(initial);
  }, [initial?.id]);

  const update = (patch: Partial<Trade>) => setForm((f) => ({ ...f, ...patch }));

  const computed = {
    pnl: pnl(form as any),
    pnlPct: pnlPercent(form as any),
    rr: riskReward(form as any),
    posSize: positionSize(form as any),
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!form.symbol) return setErr('Select a stock');
    if (!form.entry_price || !form.quantity) return setErr('Entry price and quantity are required');
    setSaving(true);
    try {
      if (initial?.id) {
        await updateTrade(initial.id, form);
      } else {
        await addTrade(form);
      }
      onDone?.();
      nav('/trades');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    if (!window.desktop?.openImageDialog) return;
    const path = await window.desktop.openImageDialog();
    if (path) update({ screenshot_path: path });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="card">
        <div className="text-sm text-slate-400 mb-3">Stock</div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 md:col-span-7">
            <label className="label">Symbol *</label>
            <StockSearch
              value={form.symbol ? { symbol: form.symbol, exchange: form.exchange ?? 'NSE', name: form.stock_name ?? undefined } : null}
              onSelect={(s) => update({ symbol: s.symbol, exchange: s.exchange, stock_name: s.name })}
            />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Exchange</label>
            <select value={form.exchange ?? 'NSE'} onChange={(e) => update({ exchange: e.target.value })} className="w-full">
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Side *</label>
            <div className="flex rounded-md overflow-hidden border border-bg-border">
              <button
                type="button"
                onClick={() => update({ side: 'BUY' })}
                className={`flex-1 py-2 text-sm ${form.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-bg-panel text-slate-400'}`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => update({ side: 'SELL' })}
                className={`flex-1 py-2 text-sm ${form.side === 'SELL' ? 'bg-rose-500/20 text-rose-300' : 'bg-bg-panel text-slate-400'}`}
              >
                SELL
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm text-slate-400 mb-3">Execution</div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-3">
            <label className="label">Entry Price *</label>
            <input type="number" step="0.05" value={form.entry_price ?? ''} onChange={(e) => update({ entry_price: Number(e.target.value) })} className="w-full font-mono" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Exit Price</label>
            <input type="number" step="0.05" value={form.exit_price ?? ''} onChange={(e) => update({ exit_price: e.target.value ? Number(e.target.value) : null })} className="w-full font-mono" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Quantity *</label>
            <input type="number" value={form.quantity ?? ''} onChange={(e) => update({ quantity: Number(e.target.value) })} className="w-full font-mono" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Stop Loss</label>
            <input type="number" step="0.05" value={form.stop_loss ?? ''} onChange={(e) => update({ stop_loss: e.target.value ? Number(e.target.value) : null })} className="w-full font-mono" />
          </div>
          <div className="col-span-6 md:col-span-2">
            <label className="label">Target</label>
            <input type="number" step="0.05" value={form.target ?? ''} onChange={(e) => update({ target: e.target.value ? Number(e.target.value) : null })} className="w-full font-mono" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Entry Date/Time</label>
            <input type="datetime-local" value={form.entry_at?.slice(0, 16) ?? ''} onChange={(e) => update({ entry_at: e.target.value })} className="w-full" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Exit Date/Time</label>
            <input type="datetime-local" value={form.exit_at?.slice(0, 16) ?? ''} onChange={(e) => update({ exit_at: e.target.value || null })} className="w-full" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Capital Allocated</label>
            <input type="number" step="100" value={form.capital ?? ''} onChange={(e) => update({ capital: e.target.value ? Number(e.target.value) : null })} className="w-full font-mono" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Fees / Charges</label>
            <input type="number" step="0.01" value={form.fees ?? ''} onChange={(e) => update({ fees: e.target.value ? Number(e.target.value) : 0 })} className="w-full font-mono" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm text-slate-400 mb-3">Strategy</div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-4">
            <label className="label">Strategy Tag</label>
            <input type="text" value={form.strategy ?? ''} onChange={(e) => update({ strategy: e.target.value })} placeholder="e.g. Swing Momentum" className="w-full" />
          </div>
          <div className="col-span-6 md:col-span-4">
            <label className="label">Setup Type</label>
            <select value={form.setup_type ?? ''} onChange={(e) => update({ setup_type: e.target.value || null })} className="w-full">
              <option value="">—</option>
              {SETUP_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="col-span-12 md:col-span-4">
            <label className="label">Chart Screenshot</label>
            <button type="button" onClick={pickImage} className="btn w-full justify-center">
              <ImageIcon size={14} />
              {form.screenshot_path ? 'Change image' : 'Attach image'}
            </button>
            {form.screenshot_path && (
              <div className="mt-1 text-[10px] text-slate-500 truncate" title={form.screenshot_path}>{form.screenshot_path}</div>
            )}
          </div>
          <div className="col-span-12">
            <label className="label">Notes</label>
            <textarea rows={3} value={form.notes ?? ''} onChange={(e) => update({ notes: e.target.value })} className="w-full" placeholder="Thesis, levels, observations…" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm text-slate-400 mb-3">Psychology & Discipline</div>
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-6 md:col-span-3">
            <label className="label">Mood</label>
            <select value={form.mood ?? ''} onChange={(e) => update({ mood: e.target.value || null })} className="w-full">
              <option value="">—</option>
              {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Discipline (1–10): {form.discipline_score ?? '-'}</label>
            <input type="range" min={1} max={10} value={form.discipline_score ?? 5} onChange={(e) => update({ discipline_score: Number(e.target.value) })} className="w-full" />
          </div>
          <div className="col-span-6 md:col-span-3">
            <label className="label">Followed Rules?</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => update({ followed_rules: 1 })} className={`btn flex-1 justify-center ${form.followed_rules === 1 ? '!bg-emerald-500/20 !text-emerald-300' : ''}`}>Yes</button>
              <button type="button" onClick={() => update({ followed_rules: 0 })} className={`btn flex-1 justify-center ${form.followed_rules === 0 ? '!bg-rose-500/20 !text-rose-300' : ''}`}>No</button>
            </div>
          </div>
          <div className="col-span-12">
            <label className="label">Post-trade Reflection</label>
            <textarea rows={2} value={form.reflection ?? ''} onChange={(e) => update({ reflection: e.target.value })} className="w-full" placeholder="What went well? What would you do differently?" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <div className="stat-label">P&L</div>
          <div className={`stat-value ${computed.pnl >= 0 ? 'text-win' : 'text-loss'}`}>{fmtINR(computed.pnl)}</div>
          <div className="text-xs text-slate-500 mt-1">{fmtPct(computed.pnlPct)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Risk:Reward</div>
          <div className="stat-value">{computed.rr.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Position Size</div>
          <div className="stat-value">{fmtINR(computed.posSize)}</div>
        </div>
        <div className="card">
          <div className="stat-label">Risk Amount</div>
          <div className="stat-value text-loss">
            {form.stop_loss != null && form.entry_price != null && form.quantity
              ? fmtINR(Math.abs(form.entry_price - form.stop_loss) * form.quantity)
              : '—'}
          </div>
        </div>
      </div>

      {err && <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded p-3">{err}</div>}

      <div className="flex justify-end gap-2 sticky bottom-0 bg-bg/80 backdrop-blur py-3">
        <button type="button" onClick={() => nav(-1)} className="btn"><X size={16} /> Cancel</button>
        <button type="submit" disabled={saving} className="btn-primary"><Save size={16} /> {saving ? 'Saving…' : 'Save Trade'}</button>
      </div>
    </form>
  );
}
