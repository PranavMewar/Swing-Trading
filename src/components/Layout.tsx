import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  BarChart3,
  Settings as SettingsIcon,
  TrendingUp,
} from 'lucide-react';

export default function Layout() {
  const nav = useNavigate();

  return (
    <div className="h-screen flex bg-bg text-slate-100">
      <aside className="w-60 bg-bg-panel border-r border-bg-border flex flex-col">
        <div className="px-5 py-5 flex items-center gap-2 border-b border-bg-border">
          <TrendingUp className="text-accent" size={22} />
          <div>
            <div className="font-semibold leading-tight">Swing Journal</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">NSE / BSE</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" end />
          <NavItem to="/trades" icon={<ListOrdered size={18} />} label="Trades" />
          <NavItem to="/trades/new" icon={<PlusCircle size={18} />} label="New Trade" />
          <NavItem to="/analytics" icon={<BarChart3 size={18} />} label="Analytics" />
          <NavItem to="/settings" icon={<SettingsIcon size={18} />} label="Settings" />
        </nav>
        <div className="p-3 border-t border-bg-border text-[11px] text-slate-500">
          <div>Ctrl+N — New Trade</div>
          <button
            onClick={() => nav('/trades/new')}
            className="btn-primary w-full mt-3 justify-center text-sm"
          >
            <PlusCircle size={16} /> Quick Add
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  end,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </NavLink>
  );
}
