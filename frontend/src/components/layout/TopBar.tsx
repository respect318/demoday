import { useAuthStore } from '../../store/authStore';
import NotificationBell from './NotificationBell';
import { User } from 'lucide-react';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { user } = useAuthStore();

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <User className="w-4 h-4" />
          <span>{user?.username || 'Operator'}</span>
          <span className="badge-purple">{user?.role || 'operator'}</span>
        </div>
      </div>
    </header>
  );
}
