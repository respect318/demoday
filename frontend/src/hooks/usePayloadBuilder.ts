import { useState, useEffect, useCallback } from 'react';
import { payloadService } from '../services/payloadService';
import type { PayloadTemplate, PayloadResponse, PayloadHistoryEntry } from '../types/payload';

export function usePayloadBuilder() {
  const [templates, setTemplates] = useState<PayloadTemplate[]>([]);
  const [history, setHistory] = useState<PayloadHistoryEntry[]>([]);
  const [generated, setGenerated] = useState<PayloadResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async (os?: string, shellType?: string) => {
    try {
      const data = await payloadService.getTemplates(os, shellType);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const data = await payloadService.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  const generate = useCallback(async (params: {
    os_type: string;
    shell_type: string;
    lhost: string;
    lport: number;
    template?: string;
    encode: boolean;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await payloadService.generate(params);
      setGenerated(data);
      await loadHistory();
      return data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate payload');
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadHistory]);

  useEffect(() => {
    loadTemplates();
    loadHistory();
  }, [loadTemplates, loadHistory]);

  return { templates, history, generated, loading, error, generate, loadTemplates, loadHistory };
}
