import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, markAllRead, clearNotification } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;

  const typeColors: Record<string, string> = {
    new_session: 'text-accent-green',
    session_died: 'text-danger',
    sibling_joined: 'text-accent-purple',
    info: 'text-blue-400',
    error: 'text-danger',
    file_received: 'text-yellow-400',
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) markAllRead();
        }}
        className="relative p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-border/50 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-surface border border-border rounded-lg shadow-2xl max-h-96 overflow-y-auto z-50">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            <span className="text-xs text-text-muted">{notifications.length} total</span>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-text-muted text-sm">No notifications</div>
          ) : (
            notifications.slice(0, 20).map((notif) => (
              <div
                key={notif.id}
                className="p-3 border-b border-border/50 hover:bg-border/30 transition-colors cursor-pointer"
                onClick={() => clearNotification(notif.id)}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-medium ${typeColors[notif.type] || 'text-text-muted'}`}>
                    {notif.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-text-primary mt-1">{notif.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
