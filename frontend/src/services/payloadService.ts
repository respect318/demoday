import api from './api';
import type { PayloadTemplate, PayloadGenerate, PayloadResponse, PayloadHistoryEntry } from '../types/payload';

export const payloadService = {
  async getTemplates(osType?: string, shellType?: string): Promise<PayloadTemplate[]> {
    const params: Record<string, string> = {};
    if (osType) params.os_type = osType;
    if (shellType) params.shell_type = shellType;
    const { data } = await api.get('/payloads/templates', { params });
    return data;
  },

  async generate(payload: PayloadGenerate): Promise<PayloadResponse> {
    const { data } = await api.post('/payloads/generate', payload);
    return data;
  },

  async getHistory(): Promise<PayloadHistoryEntry[]> {
    const { data } = await api.get('/payloads/history');
    return data;
  },
};
