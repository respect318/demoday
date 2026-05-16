import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Terminal,
  Crosshair,
  FolderOpen,
  Users,
  Settings,
  Skull,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: Terminal, label: 'Sessions' },
  { to: '/payloads', icon: Crosshair, label: 'Payloads' },
  { to: '/files', icon: FolderOpen, label: 'Files' },
  { to: '/siblings', icon: Users, label: 'Siblings' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
          <Skull className="w-6 h-6 text-accent-green" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">VillainUI</h1>
          <p className="text-xs text-text-muted">C2 Command Center</p>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-accent-green/10 text-accent-green'
                  : 'text-text-muted hover:text-text-primary hover:bg-border/50'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
