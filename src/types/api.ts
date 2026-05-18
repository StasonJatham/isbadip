export interface ReputationResult {
  query: string;
  bad: boolean;
  score: number;
  categories?: string[];
  checked_at?: string;
  details?: Record<string, string | number | boolean | null>;
}

export type ApiStatus = 'idle' | 'loading' | 'warming_up' | 'success' | 'error';

export interface ApiError {
  message: string;
  code?: number;
}

export interface HostApiThreat {
  categories?: string[];
  sources?: string[];
  matchType?: string;
}

export interface HostApiGeo {
  country?: string | null;
  region?: string | null;
  city?: string | null;
  timezone?: string | null;
  ll?: [number, number] | number[] | null;
  eu?: boolean | null;
}

export interface HostApiTop1m {
  rank?: number | null;
  source?: string | null;
}

export interface HostApiResponse {
  query: string;
  type: 'ip' | 'domain' | 'unknown';
  valid: boolean;
  malicious: boolean;
  confidence?: 'low' | 'medium' | 'high' | null;
  threat?: HostApiThreat | null;
  geo?: HostApiGeo | null;
  top1m?: HostApiTop1m | number | null;
  resolvedIPs?: string[];
  hostnames?: string[];
  ip_threats?: HostApiThreat[];
  domain_threats?: HostApiThreat[];
  cached?: boolean;
  listUpdated?: string;
  domListUpdated?: string;
  top1mUpdated?: string;
  cacheExpires?: string;
  error?: string;
}

export interface HoneypotSummaryResponse {
  ok: boolean;
  generated_at: string | null;
  totals: {
    network_events: number;
    network_ips: number;
    sessions: number;
    edge_events: number;
    edge_ips: number;
    edge_hosts: number;
    edge_paths: number;
  };
  top: {
    network_ips: Array<{ ip: string; count: number }>;
    network_events: Array<{ key: string; count: number }>;
    commands: Array<{ key: string; count: number }>;
    credentials: Array<{ key: string; count: number }>;
    edge_ips: Array<{ key: string; count: number }>;
    edge_events: Array<{ key: string; count: number }>;
    edge_hosts: Array<{ key: string; count: number }>;
    edge_paths: Array<{ key: string; count: number }>;
    edge_categories: Array<{ key: string; count: number }>;
  };
}

export interface HoneypotEvent {
  source: 'network' | 'edge' | 'web-trap';
  ts: string | null;
  ip: string | null;
  event: string | null;
  protocol?: string | null;
  username?: string | null;
  password?: string | null;
  command?: string | null;
  url?: string | null;
  hash?: string | null;
  file_name?: string | null;
  file_names?: string[];
  file_size?: number | null;
  file_type?: string | null;
  file_preview_mode?: string | null;
  file_preview?: string | null;
  session?: string | null;
  host?: string | null;
  path?: string | null;
  method?: string | null;
  action?: string | null;
  category?: string | null;
  country?: string | null;
  user_agent?: string | null;
}

export interface HoneypotEventsResponse {
  ok: boolean;
  generated_at: string | null;
  page: number;
  limit: number;
  total: number;
  pages: number;
  filters: {
    q: string;
    source: string;
    event: string;
    ip: string;
  };
  events: HoneypotEvent[];
}
