export interface Session {
  session_id: string;
  alias: string | null;
  ip_address: string;
  os_type: 'windows' | 'linux';
  shell_type: 'tcp' | 'hoaxshell' | 'netcat' | 'powershell';
  sibling_id: string | null;
  connected_at: string;
  alive: boolean;
}

export interface CommandLogEntry {
  id: number;
  session_id: string;
  command: string;
  output: string | null;
  flagged: boolean;
  executed_at: string;
}

export interface ExecResult {
  success: boolean;
  flagged: boolean;
  warning: string | null;
  message?: string;
}
