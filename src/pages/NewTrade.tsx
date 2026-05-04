import TradeForm from '@/components/TradeForm';

export default function NewTrade() {
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold mb-1">New Trade</h1>
      <p className="text-sm text-slate-400 mb-6">Log an entry — you can fill exit details later.</p>
      <TradeForm />
    </div>
  );
}
