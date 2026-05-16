import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, Crosshair, FolderOpen, Play, Square } from 'lucide-react';
import TopBar from '../components/layout/TopBar';
import { useSessionStore } from '../store/sessionStore';
import { useNotificationStore } from '../store/notificationStore';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const { sessions, addSession, removeSession } = useSessionStore();
  const { addNotification } = useNotificationStore();
  const [daemonStatus, setDaemonStatus] = useState<'running' | 'stopped' | 'loading'>('loading');
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({ payloads: 0, files: 0, siblings: 0 });
  const logRef = useRef<HTMLDivElement>(null);

  const handleEvent = useCallback((data: any) => {
    if (data.type === 'new_session') {
      addSession(data.data);
      addNotification({ type: 'new_session', message: `New session from ${data.data.ip_address}`, timestamp: new Date().toISOString() });
    } else if (data.type === 'session_died') {
      removeSession(data.data.session_id);
      addNotification({ type: 'session_died', message: `Session ${data.data.session_id.slice(0, 8)} died`, timestamp: new Date().toISOString() });
    } else if (data.type === 'daemon_log') {
      setLogs((prev) => [...prev.slice(-199), data.data]);
    } else if (data.type === 'daemon_status') {
      setDaemonStatus(data.data.status === 'running' ? 'running' : 'stopped');
    }
  }, [addSession, removeSession, addNotification]);

  useWebSocket({ url: '/ws/events', onMessage: handleEvent });

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [logs]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/daemon/status');
        setDaemonStatus(data.running ? 'running' : 'stopped');
        const logsRes = await api.get('/daemon/logs');
        setLogs(logsRes.data.logs || []);
      } catch {
        setDaemonStatus('stopped');
      }
    };
    fetchStatus();
  }, []);

  const toggleDaemon = async () => {
    try {
      if (daemonStatus === 'running') {
        await api.post('/daemon/stop');
        setDaemonStatus('stopped');
      } else {
        setDaemonStatus('loading');
        await api.post('/daemon/start');
        setDaemonStatus('running');
      }
    } catch (err) {
      console.error('Daemon toggle error:', err);
    }
  };

  const statCards = [
    { label: 'Active Sessions', value: sessions.filter((s) => s.alive).length, icon: Activity, color: 'text-accent-green' },
    { label: 'Siblings', value: stats.siblings, icon: Users, color: 'text-accent-purple' },
    { label: 'Payloads', value: stats.payloads, icon: Crosshair, color: 'text-blue-400' },
    { label: 'Files', value: stats.files, icon: FolderOpen, color: 'text-yellow-400' },
  ];

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="grid grid-cols-4 gap-4 flex-1 mr-4">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg bg-surface flex items-center justify-center ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{value}</p>
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={toggleDaemon}
            disabled={daemonStatus === 'loading'}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${
              daemonStatus === 'running'
                ? 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20'
                : 'btn-primary'
            }`}
          >
            {daemonStatus === 'running' ? (
              <><Square className="w-4 h-4" /> Stop Daemon</>
            ) : daemonStatus === 'loading' ? (
              'Starting...'
            ) : (
              <><Play className="w-4 h-4" /> Start Daemon</>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Live Sessions</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sessions.filter((s) => s.alive).length === 0 ? (
                <p className="text-text-muted text-sm py-4 text-center">No active sessions</p>
              ) : (
                sessions.filter((s) => s.alive).map((s) => (
                  <div
                    key={s.session_id}
                    onClick={() => navigate(`/terminal/${s.session_id}`)}
                    className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-border/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-accent-green" style={{ animation: 'pulse-green 2s infinite' }} />
                      <div>
                        <p className="text-sm font-medium text-text-primary">{s.alias || s.session_id.slice(0, 12)}</p>
                        <p className="text-xs text-text-muted font-mono">{s.ip_address}</p>
                      </div>
                    </div>
                    <span className="text-xs text-text-muted">{s.os_type} / {s.shell_type}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-text-primary mb-3">Daemon Log</h3>
            <div
              ref={logRef}
              className="bg-background rounded-lg p-3 h-80 overflow-y-auto font-mono text-xs leading-5 text-text-muted"
            >
              {logs.length === 0 ? (
                <p className="text-center py-4">Daemon not started. Click "Start Daemon" to begin.</p>
              ) : (
                logs.map((line, i) => (
                  <div key={i} className={`${
                    line.includes('[ERROR]') || line.includes('[STDERR]')
                      ? 'text-danger'
                      : line.includes('[EVENT]')
                      ? 'text-accent-green'
                      : line.includes('[WARN]')
                      ? 'text-yellow-400'
                      : ''
                  }`}>
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
