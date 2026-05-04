# Swing Journal

A professional, offline-first **trade journaling desktop app** for Indian stock market traders (NSE & BSE).

Built with **React + TypeScript + TailwindCSS + Electron + Express + SQLite**.

## Features

- **Full NSE/BSE stock universe** with searchable, keyboard-navigable autosuggest
- **Comprehensive trade entry**: side, prices, quantity, dates, strategy tags, setup type, SL/target, screenshots, notes
- **Auto calculations**: P&L (₹ + %), risk-reward, position size, risk amount
- **Analytics dashboard**: equity curve, monthly returns bar chart, daily P&L heatmap (calendar), strategy & setup breakdowns
- **Win rate · Avg R:R · Max drawdown · Expectancy**
- **Psychology tracking**: mood, discipline score (1–10), rule adherence, post-trade reflection
- **Filters**: date range, symbol, strategy, setup, win/loss/open
- **CSV import/export** with broker-agnostic mapping (Zerodha / Upstox / generic)
- **Optional password lock** (SHA-256 hash, local only)
- **Dark mode by default**, trader-focused minimal UI
- **Keyboard shortcut**: `Ctrl/Cmd + N` to add a trade
- **SQLite WAL** — designed to handle 10,000+ trades smoothly
- **Cross-platform installers**: Windows `.exe`, macOS `.dmg`, Linux AppImage

## Project Structure

```
Swing-Trading/
├── electron/            Electron main + preload
│   ├── main.ts
│   ├── preload.ts
│   └── tsconfig.json
├── server/              Embedded Express + SQLite backend (runs in main process)
│   ├── index.ts
│   ├── db.ts
│   └── routes/
│       ├── trades.ts
│       ├── stocks.ts
│       ├── analytics.ts
│       ├── importExport.ts
│       └── settings.ts
├── src/                 React renderer
│   ├── components/      Layout, StockSearch, TradeForm, charts, heatmap, etc.
│   ├── pages/           Dashboard, Trades, NewTrade, EditTrade, Analytics, Settings, Lock
│   ├── store/           Zustand store
│   ├── lib/             api client + calculations
│   ├── App.tsx
│   ├── main.tsx
│   └── styles.css
├── data/
│   └── stocks.json      Seed of NSE + BSE listings
├── scripts/
│   └── fetch-stocks.mjs Fetch full NSE/BSE listings into data/stocks.json
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) refresh full NSE+BSE listings (~5000+ symbols)
node scripts/fetch-stocks.mjs
```

Requires Node 20+. `better-sqlite3` is a native module and is rebuilt automatically by Electron at install time.

## Run (development)

```bash
npm run dev
```

This launches Vite (renderer at `http://localhost:5173`) and Electron in parallel. Hot-reload works for both. The Express backend binds to `127.0.0.1:43117` inside the Electron main process and the renderer talks to it via `fetch`.

## Build

```bash
# Build renderer and electron bundles
npm run build

# Generate platform installers into ./release
npm run package           # current platform
npm run package:win       # Windows .exe (NSIS)
npm run package:mac       # macOS .dmg (x64 + arm64)
```

## Where is my data?

The SQLite database `journal.db` is stored in Electron's per-user `userData` directory:

| OS      | Path                                                  |
|---------|-------------------------------------------------------|
| Windows | `%APPDATA%/Swing Journal/journal.db`                  |
| macOS   | `~/Library/Application Support/Swing Journal/`        |
| Linux   | `~/.config/Swing Journal/journal.db`                  |

## Keyboard Shortcuts

- `Ctrl/Cmd + N` — New trade
- Stock search supports `↑ ↓ Enter Esc`

## Tech Stack

| Layer           | Library                                       |
|-----------------|-----------------------------------------------|
| UI              | React 18, TailwindCSS, lucide-react           |
| Routing / State | react-router-dom, Zustand                     |
| Charts          | Recharts                                      |
| Backend         | Express 4 (in-process)                        |
| Storage         | better-sqlite3 (WAL mode)                     |
| Desktop shell   | Electron 32, electron-builder                 |
| Build           | Vite 5, TypeScript 5                          |

## Roadmap / Bonus Ideas

- Trade replay mode (step through entries on a chart)
- Tag-based correlation insights (which mood + setup wins most?)
- AI feedback on trades using local model or Anthropic API
- Live price quotes via Kite Connect (with API key)
- Cloud sync via Supabase

## License

MIT
