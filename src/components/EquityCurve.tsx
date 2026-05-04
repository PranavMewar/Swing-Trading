import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fmtINR } from '@/lib/calc';

interface Props {
  data: Array<{ date: string; equity: number }>;
}

export default function EquityCurve({ data }: Props) {
  return (
    <div className="card h-80">
      <div className="text-sm text-slate-400 mb-2">Equity Curve</div>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1f2733" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
          <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => fmtINR(v as number)} width={80} />
          <Tooltip
            contentStyle={{ background: '#161b24', border: '1px solid #1f2733', borderRadius: 6 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(v) => fmtINR(v as number)}
          />
          <Area type="monotone" dataKey="equity" stroke="#22c55e" strokeWidth={2} fill="url(#eq)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
