import type { Trade } from '@/types';

export function pnl(t: Pick<Trade, 'side' | 'entry_price' | 'exit_price' | 'quantity' | 'fees'>): number {
  if (t.exit_price == null) return 0;
  const direction = t.side === 'BUY' ? 1 : -1;
  const gross = (t.exit_price - t.entry_price) * t.quantity * direction;
  return gross - (t.fees ?? 0);
}

export function pnlPercent(t: Pick<Trade, 'side' | 'entry_price' | 'exit_price'>): number {
  if (t.exit_price == null || !t.entry_price) return 0;
  const direction = t.side === 'BUY' ? 1 : -1;
  return ((t.exit_price - t.entry_price) / t.entry_price) * 100 * direction;
}

export function riskReward(t: Pick<Trade, 'side' | 'entry_price' | 'exit_price' | 'stop_loss' | 'target'>): number {
  if (t.stop_loss == null) return 0;
  const risk = Math.abs(t.entry_price - t.stop_loss);
  if (risk === 0) return 0;
  const reward = t.exit_price != null
    ? Math.abs(t.exit_price - t.entry_price)
    : t.target != null
      ? Math.abs(t.target - t.entry_price)
      : 0;
  return reward / risk;
}

export function positionSize(t: Pick<Trade, 'entry_price' | 'quantity'>): number {
  return t.entry_price * t.quantity;
}

export function fmtINR(n: number): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '₹0';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function fmtPct(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '0%';
  return `${n.toFixed(digits)}%`;
}

export function isWin(t: Pick<Trade, 'side' | 'entry_price' | 'exit_price' | 'fees'>): boolean | null {
  if (t.exit_price == null) return null;
  return pnl(t) > 0;
}
