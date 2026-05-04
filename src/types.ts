export type Side = 'BUY' | 'SELL';

export interface Trade {
  id?: number;
  symbol: string;
  exchange: string;
  stock_name?: string | null;
  side: Side;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  entry_at: string;
  exit_at: string | null;
  strategy: string | null;
  setup_type: string | null;
  stop_loss: number | null;
  target: number | null;
  notes: string | null;
  screenshot_path: string | null;
  mood: string | null;
  discipline_score: number | null;
  followed_rules: number | null;
  reflection: string | null;
  capital: number | null;
  fees: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Stock {
  symbol: string;
  exchange: string;
  name: string;
}

export interface Summary {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  avgRR: number;
  expectancy: number;
  maxDrawdown: number;
  equityCurve: Array<{ date: string; equity: number; pnl: number }>;
}

export interface StrategyStat {
  strategy: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export interface SetupStat {
  setup: string;
  trades: number;
  wins: number;
  winRate: number;
  pnl: number;
}

export const MOODS = ['Calm', 'Confident', 'Focused', 'Anxious', 'Greedy', 'Fearful', 'FOMO', 'Tired'] as const;
export const SETUP_TYPES = ['Breakout', 'Pullback', 'Reversal', 'Trend Continuation', 'Range', 'Gap Fill', 'Earnings', 'News'] as const;
