import api from './api';
import type { Session, CommandLogEntry, ExecResult } from '../types/session';

export const sessionService = {
  async getAll(): Promise<Session[]> {
    const { data } = await api.get('/sessions');
    return data;
  },

  async getById(id: string): Promise<Session> {
    const { data } = await api.get(`/sessions/${id}`);
    return data;
  },

  async killSession(id: string): Promise<void> {
    await api.delete(`/sessions/${id}`);
  },

  async execCommand(id: string, command: string): Promise<ExecResult> {
    const { data } = await api.post(`/sessions/${id}/exec`, { command });
    return data;
  },

  async execCommandForce(id: string, command: string): Promise<ExecResult> {
    const { data } = await api.post(`/sessions/${id}/exec/force`, { command });
    return data;
  },

  async getHistory(id: string): Promise<CommandLogEntry[]> {
    const { data } = await api.get(`/sessions/${id}/history`);
    return data;
  },

  async setAlias(id: string, alias: string): Promise<void> {
    await api.post(`/sessions/${id}/alias`, { alias });
  },

  async triggerConpty(id: string): Promise<void> {
    await api.post(`/sessions/${id}/conpty`);
  },
};
