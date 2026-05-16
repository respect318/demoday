export interface PayloadTemplate {
  id: string;
  name: string;
  os: string;
  shell_type: string;
  file?: string;
}

export interface PayloadGenerate {
  os_type: string;
  shell_type: string;
  lhost: string;
  lport: number;
  template?: string;
  encode: boolean;
}

export interface PayloadResponse {
  payload: string;
  template: string | null;
  os_type: string;
  shell_type: string;
  lhost: string;
  lport: number;
}

export interface PayloadHistoryEntry {
  id: number;
  template: string | null;
  os_type: string;
  shell_type: string;
  lhost: string;
  lport: number;
  payload: string;
  created_at: string;
}
