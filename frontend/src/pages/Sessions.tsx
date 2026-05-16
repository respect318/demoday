import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';
import SessionTable from '../components/sessions/SessionTable';
import { useSessions } from '../hooks/useSessions';
import { sessionService } from '../services/sessionService';

export default function Sessions() {
  const navigate = useNavigate();
  const { sessions, refresh } = useSessions();

  const handleKill = async (id: string) => {
    if (confirm('Kill this session?')) {
      try {
        await sessionService.killSession(id);
        refresh();
      } catch (err) {
        console.error('Failed to kill session:', err);
      }
    }
  };

  return (
    <div>
      <TopBar title="Sessions" />
      <div className="p-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">
              Active Sessions ({sessions.filter((s) => s.alive).length})
            </h3>
            <button onClick={refresh} className="btn-secondary text-xs">Refresh</button>
          </div>
          <SessionTable
            sessions={sessions}
            onOpenTerminal={(id) => navigate(`/terminal/${id}`)}
            onKill={handleKill}
            onUpload={(id) => navigate(`/files`)}
          />
        </div>
      </div>
    </div>
  );
}
