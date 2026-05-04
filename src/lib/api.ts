import type { Trade, Stock, Summary, StrategyStat, SetupStat } from '@/types';

const DEV_BASE = 'http://127.0.0.1:43117';

async function apiBase(): Promise<string> {
  if (typeof window !== 'undefined' && window.desktop?.getApiBase) {
    try {
      return await window.desktop.getApiBase();
    } catch {
      /* fallthrough */
    }
  }
  return DEV_BASE;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const base = await apiBase();
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listTrades: (params: Record<string, string | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    return req<Trade[]>(`/api/trades?${qs.toString()}`);
  },
  getTrade: (id: number) => req<Trade>(`/api/trades/${id}`),
  createTrade: (data: Partial<Trade>) =>
    req<Trade>('/api/trades', { method: 'POST', body: JSON.stringify(data) }),
  updateTrade: (id: number, data: Partial<Trade>) =>
    req<Trade>(`/api/trades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrade: (id: number) => req<{ ok: boolean }>(`/api/trades/${id}`, { method: 'DELETE' }),
  strategies: () => req<string[]>('/api/trades/meta/strategies'),

  searchStocks: (q: string, exchange?: string) => {
    const qs = new URLSearchParams({ q, limit: '30' });
    if (exchange) qs.set('exchange', exchange);
    return req<Stock[]>(`/api/stocks/search?${qs.toString()}`);
  },
  stockCount: () => req<{ count: number }>('/api/stocks/count'),

  summary: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    return req<Summary>(`/api/analytics/summary?${qs.toString()}`);
  },
  heatmap: (from?: string, to?: string) => {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    return req<Array<{ date: string; pnl: number }>>(`/api/analytics/heatmap?${qs.toString()}`);
  },
  monthly: () => req<Array<{ month: string; pnl: number }>>('/api/analytics/monthly'),
  byStrategy: () => req<StrategyStat[]>('/api/analytics/by-strategy'),
  bySetup: () => req<SetupStat[]>('/api/analytics/by-setup'),

  exportCsv: (filePath: string) =>
    req<{ exported: number }>('/api/io/export', { method: 'POST', body: JSON.stringify({ filePath }) }),
  importCsv: (filePath: string, broker = 'generic') =>
    req<{ imported: number }>('/api/io/import', { method: 'POST', body: JSON.stringify({ filePath, broker }) }),

  getSettings: () => req<Record<string, string>>('/api/settings'),
  setSetting: (key: string, value: string) =>
    req<{ ok: boolean }>(`/api/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  setPassword: (password: string) =>
    req<{ ok: boolean }>('/api/settings/password/set', { method: 'POST', body: JSON.stringify({ password }) }),
  verifyPassword: (password: string) =>
    req<{ ok: boolean; hasPassword: boolean }>('/api/settings/password/verify', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};
