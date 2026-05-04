#!/usr/bin/env node
// Fetches the latest NSE & BSE equity listings and writes data/stocks.json.
// Run: node scripts/fetch-stocks.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'data', 'stocks.json');

const NSE_EQ_LIST = 'https://archives.nseindia.com/content/equities/EQUITY_L.csv';
const BSE_EQ_LIST = 'https://api.bseindia.com/BseIndiaAPI/api/ListOfScripCodes/w';

async function fetchNSE() {
  const res = await fetch(NSE_EQ_LIST, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/csv,*/*' },
  });
  if (!res.ok) throw new Error(`NSE ${res.status}`);
  const text = await res.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  const cols = header.split(',').map((s) => s.trim());
  const idx = (k) => cols.indexOf(k);
  return lines.map((line) => {
    const parts = line.split(',').map((s) => s.trim());
    return {
      symbol: parts[idx('SYMBOL')],
      exchange: 'NSE',
      name: parts[idx('NAME OF COMPANY')],
      series: parts[idx('SERIES')] || 'EQ',
      isin: parts[idx(' ISIN NUMBER')] || parts[idx('ISIN NUMBER')] || null,
    };
  }).filter((s) => s.symbol);
}

async function fetchBSE() {
  const res = await fetch(BSE_EQ_LIST, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`BSE ${res.status}`);
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((r) => ({
    symbol: String(r.SCRIP_CD || r.scrip_cd || r.code || ''),
    exchange: 'BSE',
    name: r.scrip_name || r.SCRIP_NAME || r.LONG_NAME || r.short_name || '',
    series: r.GROUP || r.scrip_grp || 'A',
    isin: r.ISIN_NUMBER || null,
  })).filter((s) => s.symbol && s.name);
}

(async () => {
  console.log('Fetching NSE & BSE listings...');
  const [nse, bse] = await Promise.allSettled([fetchNSE(), fetchBSE()]);
  const all = [];
  if (nse.status === 'fulfilled') all.push(...nse.value);
  else console.error('NSE failed:', nse.reason?.message);
  if (bse.status === 'fulfilled') all.push(...bse.value);
  else console.error('BSE failed:', bse.reason?.message);
  fs.writeFileSync(OUT, JSON.stringify(all, null, 0));
  console.log(`Wrote ${all.length} stocks to ${OUT}`);
})();
