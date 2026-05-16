export interface Sibling {
  id: string;
  hostname: string;
  ip_address: string;
  port: number;
  session_count: number;
}

export interface SiblingConnect {
  host: string;
  port: number;
}
