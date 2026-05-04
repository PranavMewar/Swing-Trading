import { useMemo } from 'react';
import { eachDayOfInterval, format, getDay, startOfWeek, subDays } from 'date-fns';
import { fmtINR } from '@/lib/calc';

interface Props {
  data: Array<{ date: string; pnl: number }>;
  days?: number;
}

export default function HeatmapCalendar({ data, days = 365 }: Props) {
  const map = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) m.set(d.date, d.pnl);
    return m;
  }, [data]);

  const today = new Date();
  const start = startOfWeek(subDays(today, days - 1), { weekStartsOn: 1 });
  const range = eachDayOfInterval({ start, end: today });

  const max = Math.max(0.0001, ...data.map((d) => Math.abs(d.pnl)));
  const cells: Array<{ date: Date; pnl: number | undefined; col: number; row: number }> = [];
  range.forEach((date, i) => {
    cells.push({
      date,
      pnl: map.get(format(date, 'yyyy-MM-dd')),
      col: Math.floor(i / 7),
      row: (getDay(date) + 6) % 7,
    });
  });
  const cols = Math.max(...cells.map((c) => c.col)) + 1;

  const colorFor = (pnl: number | undefined): string => {
    if (pnl === undefined) return '#161b24';
    if (pnl === 0) return '#1f2733';
    const intensity = Math.min(1, Math.abs(pnl) / max);
    if (pnl > 0) {
      const a = 0.18 + intensity * 0.7;
      return `rgba(34,197,94,${a})`;
    }
    const a = 0.18 + intensity * 0.7;
    return `rgba(239,68,68,${a})`;
  };

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-3">
        <div className="text-sm text-slate-400">Daily P&L Heatmap</div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span>Less</span>
          <div className="flex gap-0.5">
            <span className="w-3 h-3 block" style={{ background: '#1f2733' }} />
            <span className="w-3 h-3 block" style={{ background: 'rgba(34,197,94,0.3)' }} />
            <span className="w-3 h-3 block" style={{ background: 'rgba(34,197,94,0.6)' }} />
            <span className="w-3 h-3 block" style={{ background: 'rgba(34,197,94,0.9)' }} />
          </div>
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pt-1 pr-1">
            {dayLabels.map((d, i) => (
              <div key={i} className="text-[9px] text-slate-500 h-3 leading-3">{i % 2 === 0 ? d : ''}</div>
            ))}
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${cols}, 12px)`, gridAutoRows: '12px' }}
          >
            {cells.map((c, i) => (
              <div
                key={i}
                title={`${format(c.date, 'MMM d, yyyy')}${c.pnl !== undefined ? `: ${fmtINR(c.pnl)}` : ''}`}
                className="rounded-sm cursor-pointer"
                style={{
                  background: colorFor(c.pnl),
                  gridColumn: c.col + 1,
                  gridRow: c.row + 1,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
