import { useState, useEffect } from 'react';
import { Users, Plug, Unplug } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import api from '../services/api';

interface Sibling {
  id: string;
  ip_address: string;
  port: number;
  status: string;
  connected_at: string;
}

export default function Siblings() {
  const [siblings, setSiblings] = useState<Sibling[]>([]);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(6501);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = async () => {
    try {
      const { data } = await api.get('/siblings');
      setSiblings(data);
    } catch (err) {
      console.error('Failed to fetch siblings:', err);
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleConnect = async () => {
    if (!ip) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/siblings/connect', { host: ip, port });
      setSuccess(`Connect command sent to ${ip}:${port}`);
      setIp('');
      refresh();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Connect failed';
      setError(msg);
      console.error('Connect failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (siblingId: string) => {
    try {
      await api.delete(`/siblings/${siblingId}`);
      setSuccess('Sibling disconnected');
      refresh();
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Disconnect failed';
      setError(msg);
      console.error('Disconnect failed:', err);
    }
  };

  return (
    <div>
      <TopBar title="Sibling Servers" />
      <div className="p-6 space-y-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Plug className="w-4 h-4 text-accent-purple" /> Connect to Sibling
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              className="input-field flex-1"
              placeholder="Sibling IP (e.g. 10.0.0.5)"
            />
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="input-field w-24"
              min={1} max={65535}
            />
            <button onClick={handleConnect} disabled={loading || !ip} className="btn-primary disabled:opacity-50">
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
          {error && <p className="text-danger text-sm mt-3">{error}</p>}
          {success && <p className="text-accent-green text-sm mt-3">{success}</p>}
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-purple" /> Connected Siblings ({siblings.length})
          </h3>
          {siblings.length === 0 ? (
            <div className="text-center text-text-muted py-8 text-sm">No sibling servers connected.</div>
          ) : (
            <div className="space-y-2">
              {siblings.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full ${s.status === 'active' ? 'bg-accent-green' : 'bg-yellow-400'}`} />
                    <div>
                      <p className="text-sm font-mono text-text-primary">{s.ip_address}:{s.port}</p>
                      <p className="text-xs text-text-muted capitalize">{s.status}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <Unplug className="w-3 h-3" /> Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
