import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TradeForm from '@/components/TradeForm';
import { api } from '@/lib/api';
import type { Trade } from '@/types';

export default function EditTrade() {
  const { id } = useParams();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.getTrade(Number(id)).then(setTrade).catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="p-6 text-rose-400">{err}</div>;
  if (!trade) return <div className="p-6 text-slate-400">Loading…</div>;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-1">Edit Trade #{trade.id}</h1>
      <p className="text-sm text-slate-400 mb-6">{trade.symbol} · {trade.exchange}</p>
      <TradeForm initial={trade} />
    </div>
  );
}
