import { create } from 'zustand';
import type { Session } from '../types/session';

interface SessionState {
  sessions: Session[];
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<Session>) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],

  setSessions: (sessions: Session[]) => set({ sessions }),

  addSession: (session: Session) =>
    set((state) => {
      const exists = state.sessions.find((s) => s.session_id === session.session_id);
      if (exists) return state;
      return { sessions: [session, ...state.sessions] };
    }),

  removeSession: (sessionId: string) =>
    set((state) => ({
      sessions: state.sessions.filter((s) => s.session_id !== sessionId),
    })),

  updateSession: (sessionId: string, updates: Partial<Session>) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.session_id === sessionId ? { ...s, ...updates } : s
      ),
    })),
}));
