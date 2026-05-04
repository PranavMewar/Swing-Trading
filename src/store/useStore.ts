import { create } from 'zustand';
import type { Trade } from '@/types';
import { api } from '@/lib/api';

interface FilterState {
  from?: string;
  to?: string;
  symbol?: string;
  strategy?: string;
  setup?: string;
  result?: 'win' | 'loss' | 'open' | '';
}

interface AppState {
  trades: Trade[];
  loading: boolean;
  filters: FilterState;
  setFilter: (patch: Partial<FilterState>) => void;
  clearFilters: () => void;
  loadTrades: () => Promise<void>;
  addTrade: (t: Partial<Trade>) => Promise<Trade>;
  updateTrade: (id: number, t: Partial<Trade>) => Promise<Trade>;
  removeTrade: (id: number) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  trades: [],
  loading: false,
  filters: {},
  setFilter: (patch) => set({ filters: { ...get().filters, ...patch } }),
  clearFilters: () => set({ filters: {} }),
  loadTrades: async () => {
    set({ loading: true });
    try {
      const f = get().filters;
      const trades = await api.listTrades({
        from: f.from,
        to: f.to,
        symbol: f.symbol,
        strategy: f.strategy,
        setup: f.setup,
        result: f.result || undefined,
      });
      set({ trades });
    } finally {
      set({ loading: false });
    }
  },
  addTrade: async (t) => {
    const created = await api.createTrade(t);
    await get().loadTrades();
    return created;
  },
  updateTrade: async (id, t) => {
    const updated = await api.updateTrade(id, t);
    await get().loadTrades();
    return updated;
  },
  removeTrade: async (id) => {
    await api.deleteTrade(id);
    await get().loadTrades();
  },
}));
