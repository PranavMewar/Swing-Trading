interface Props {
  label: string;
  value: string;
  sub?: string;
  tone?: 'pos' | 'neg' | 'neutral';
}

export default function StatCard({ label, value, sub, tone = 'neutral' }: Props) {
  const color = tone === 'pos' ? 'text-win' : tone === 'neg' ? 'text-loss' : 'text-slate-100';
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${color}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}
