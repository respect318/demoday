import { useEffect, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { sessionService } from '../services/sessionService';

export function useSessions() {
  const { sessions, setSessions, addSession, removeSession, updateSession } = useSessionStore();

  const refresh = useCallback(async () => {
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    }
  }, [setSessions]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { sessions, refresh, addSession, removeSession, updateSession };
}
