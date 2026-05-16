import { Terminal, Trash2, Upload, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { Session } from '../../types/session';
import SessionBadge from './SessionBadge';

interface SessionTableProps {
  sessions: Session[];
  onOpenTerminal: (id: string) => void;
  onKill: (id: string) => void;
  onUpload: (id: string) => void;
}

export default function SessionTable({ sessions, onOpenTerminal, onKill, onUpload }: SessionTableProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-text-muted text-left">
            <th className="pb-3 pl-4 font-medium">Status</th>
            <th className="pb-3 font-medium">Session ID</th>
            <th className="pb-3 font-medium">Alias</th>
            <th className="pb-3 font-medium">IP Address</th>
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Uptime</th>
            <th className="pb-3 pr-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr
              key={s.session_id}
              className={`border-b border-border/50 hover:bg-border/20 transition-colors fade-in ${
                !s.alive ? 'opacity-50' : ''
              }`}
            >
              <td className="py-3 pl-4">
                <span className={`w-2.5 h-2.5 rounded-full inline-block ${
                  s.alive ? 'bg-accent-green' : 'bg-danger'
                }`} style={s.alive ? { animation: 'pulse-green 2s infinite' } : {}} />
              </td>
              <td className="py-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs text-text-primary">{s.session_id.slice(0, 12)}...</span>
                  <button onClick={() => copyId(s.session_id)} className="text-text-muted hover:text-text-primary">
                    {copied === s.session_id ? <Check className="w-3 h-3 text-accent-green" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </td>
              <td className="py-3 text-text-primary">{s.alias || '—'}</td>
              <td className="py-3 font-mono text-xs text-text-primary">{s.ip_address}</td>
              <td className="py-3"><SessionBadge osType={s.os_type} shellType={s.shell_type} /></td>
              <td className="py-3 text-xs text-text-muted">
                {formatDistanceToNow(new Date(s.connected_at))}
              </td>
              <td className="py-3 pr-4">
                <div className="flex items-center gap-1 justify-end">
                  <button
                    onClick={() => onOpenTerminal(s.session_id)}
                    className="p-1.5 rounded hover:bg-accent-green/10 text-accent-green transition-colors"
                    title="Open Terminal"
                  >
                    <Terminal className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpload(s.session_id)}
                    className="p-1.5 rounded hover:bg-accent-purple/10 text-accent-purple transition-colors"
                    title="Upload File"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onKill(s.session_id)}
                    className="p-1.5 rounded hover:bg-danger/10 text-danger transition-colors"
                    title="Kill Session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {sessions.length === 0 && (
            <tr>
              <td colSpan={7} className="py-12 text-center text-text-muted">
                No active sessions. Generate a payload and execute it on a target.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
