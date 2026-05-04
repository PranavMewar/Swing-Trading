import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Trades from './pages/Trades';
import NewTrade from './pages/NewTrade';
import EditTrade from './pages/EditTrade';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Lock from './pages/Lock';
import { useStore } from './store/useStore';

export default function App() {
  const loadTrades = useStore((s) => s.loadTrades);

  useEffect(() => {
    loadTrades();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        window.location.hash = '#/trades/new';
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loadTrades]);

  return (
    <Routes>
      <Route path="/lock" element={<Lock />} />
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="trades" element={<Trades />} />
        <Route path="trades/new" element={<NewTrade />} />
        <Route path="trades/:id" element={<EditTrade />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
