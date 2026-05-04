import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { Stock } from '@/types';
import { Search } from 'lucide-react';

interface Props {
  value?: { symbol: string; exchange: string; name?: string } | null;
  onSelect: (s: Stock) => void;
  exchange?: string;
  placeholder?: string;
}

export default function StockSearch({ value, onSelect, exchange, placeholder }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && !q) setQ(`${value.symbol}${value.name ? ' — ' + value.name : ''}`);
  }, [value]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!open) return;
      const res = await api.searchStocks(q, exchange).catch(() => []);
      setResults(res);
      setHi(0);
    }, 120);
    return () => clearTimeout(t);
  }, [q, exchange, open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pick = (s: Stock) => {
    onSelect(s);
    setQ(`${s.symbol} — ${s.name}`);
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              setHi((i) => Math.min(i + 1, results.length - 1));
              e.preventDefault();
            } else if (e.key === 'ArrowUp') {
              setHi((i) => Math.max(i - 1, 0));
              e.preventDefault();
            } else if (e.key === 'Enter' && results[hi]) {
              pick(results[hi]);
              e.preventDefault();
            } else if (e.key === 'Escape') {
              setOpen(false);
            }
          }}
          placeholder={placeholder ?? 'Search NSE/BSE stocks...'}
          className="w-full pl-9"
          autoComplete="off"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 left-0 right-0 max-h-80 overflow-auto bg-bg-card border border-bg-border rounded-md shadow-2xl">
          {results.map((r, i) => (
            <button
              type="button"
              key={`${r.exchange}-${r.symbol}`}
              onMouseEnter={() => setHi(i)}
              onClick={() => pick(r)}
              className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 ${
                i === hi ? 'bg-bg-panel' : ''
              }`}
            >
              <div className="min-w-0">
                <div className="font-mono text-sm text-slate-100 truncate">{r.symbol}</div>
                <div className="text-xs text-slate-400 truncate">{r.name}</div>
              </div>
              <span
                className={`text-[10px] uppercase px-2 py-0.5 rounded ${
                  r.exchange === 'NSE' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {r.exchange}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
