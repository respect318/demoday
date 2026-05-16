import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'new_session' | 'session_died' | 'sibling_joined' | 'file_received' | 'info' | 'error';
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notif: Omit<Notification, 'id' | 'read'>) => void;
  clearNotification: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: (notif) =>
    set((state) => {
      const newNotif: Notification = {
        ...notif,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        read: false,
      };
      const updated = [newNotif, ...state.notifications].slice(0, 50);
      return { notifications: updated };
    }),

  clearNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
