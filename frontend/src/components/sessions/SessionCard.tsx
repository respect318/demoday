import { Terminal, Trash2, Upload, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Session } from '../../types/session';
import SessionBadge from './SessionBadge';

interface SessionCardProps {
  session: Session;
  onOpenTerminal: (id: string) => void;
  onKill: (id: string) => void;
}

export default function SessionCard({ session, onOpenTerminal, onKill }: SessionCardProps) {
  return (
    <div className={`card fade-in hover:border-accent-green/30 transition-all cursor-pointer ${
      session.alive ? '' : 'opacity-50 border-danger/30'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${session.alive ? 'bg-accent-green' : 'bg-danger'}`}
              style={session.alive ? { animation: 'pulse-green 2s infinite' } : {}} />
            <span className="text-sm font-semibold text-text-primary truncate">
              {session.alias || session.session_id.slice(0, 12)}
            </span>
          </div>
          <p className="text-xs text-text-muted font-mono mb-2">{session.ip_address}</p>
          <SessionBadge osType={session.os_type} shellType={session.shell_type} />
          <div className="flex items-center gap-1 mt-2 text-[11px] text-text-muted">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(session.connected_at), { addSuffix: true })}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onOpenTerminal(session.session_id)}
            className="p-1.5 rounded hover:bg-accent-green/10 text-accent-green transition-colors"
            title="Open Terminal"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            onClick={() => onKill(session.session_id)}
            className="p-1.5 rounded hover:bg-danger/10 text-danger transition-colors"
            title="Kill Session"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
