import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { fmtINR } from '@/lib/calc';

interface Props {
  data: Array<{ month: string; pnl: number }>;
}

export default function MonthlyBars({ data }: Props) {
  return (
    <div className="card h-80">
      <div className="text-sm text-slate-400 mb-2">Monthly Returns</div>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data}>
          <CartesianGrid stroke="#1f2733" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => fmtINR(v as number)} width={80} />
          <Tooltip
            contentStyle={{ background: '#161b24', border: '1px solid #1f2733', borderRadius: 6 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(v) => fmtINR(v as number)}
          />
          <Bar dataKey="pnl">
            {data.map((d, i) => (
              <Cell key={i} fill={d.pnl >= 0 ? '#22c55e' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
