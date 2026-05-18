import React, { useCallback, useState } from 'react';
import ThemeToggle from '@/components/ThemeToggle';
import Footer from '@/sections/Footer';
import { useHoneypotEvents } from '@/hooks/useHoneypotEvents';
import type { HoneypotEvent } from '@/types/api';

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All sources' },
  { value: 'network', label: 'SSH/Telnet' },
  { value: 'edge', label: 'Edge' },
  { value: 'web-trap', label: 'Web trap' },
];

const QUICK_FILTERS = [
  { id: 'all', label: 'All logs', source: 'all', q: '' },
  { id: 'commands', label: 'Commands', source: 'network', q: 'command.input' },
  { id: 'files', label: 'Files', source: 'network', q: 'file' },
  { id: 'credentials', label: 'Credentials', source: 'network', q: 'login' },
  { id: 'web', label: 'Web probes', source: 'edge', q: '' },
];

function number(value: number | undefined) {
  return new Intl.NumberFormat().format(value || 0);
}

function bytes(value: number | null | undefined) {
  if (!Number.isFinite(value || NaN)) return null;
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value || 0;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size >= 10 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}

function formatTime(value: string | null) {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function sourceLabel(source: HoneypotEvent['source']) {
  if (source === 'network') return 'SSH/Telnet';
  if (source === 'edge') return 'Edge';
  return 'Web trap';
}

function eventDetail(event: HoneypotEvent) {
  if (event.source === 'network') {
    if (event.command) return event.command;
    if (event.url) return event.url;
    if (event.hash) return `sha256:${event.hash}`;
    const credentials = [event.username, event.password].filter(Boolean).join(':');
    return credentials || event.protocol || '';
  }
  return `${event.method || 'GET'} ${event.host || ''}${event.path || ''}`.trim();
}

function FileDownloadDetails({ event }: { event: HoneypotEvent }) {
  if (!event.hash && !event.file_name && !event.file_preview) return null;
  const size = bytes(event.file_size);

  return (
    <div className="mt-2 rounded-lg border border-border-subtle bg-white/80 p-3 font-mono text-xs leading-5 text-slate-900 break-words dark:bg-code-bg/95 dark:text-code-text">
      {event.file_name ? (
        <div><span className="text-text-muted dark:text-code-comment">file:</span> {event.file_name}</div>
      ) : null}
      {size || event.file_type ? (
        <div>
          <span className="text-text-muted dark:text-code-comment">type:</span> {[size, event.file_type].filter(Boolean).join(' · ')}
        </div>
      ) : null}
      {event.hash ? (
        <div><span className="text-text-muted dark:text-code-comment">sha256:</span> {event.hash}</div>
      ) : null}
      {event.file_preview ? (
        <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded-md border border-border-subtle bg-white/70 p-2 text-slate-900 dark:bg-black/25 dark:text-code-text">
          {event.file_preview}
        </pre>
      ) : null}
    </div>
  );
}

const HoneypotPage: React.FC = () => {
  const [searchDraft, setSearchDraft] = useState('');
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [quickFilter, setQuickFilter] = useState(QUICK_FILTERS[0]);
  const [page, setPage] = useState(1);
  const limit = 25;
  const combinedQuery = [quickFilter.q, query].filter(Boolean).join(' ');
  const activeSource = quickFilter.source === 'all' ? source : quickFilter.source;
  const { summary, events, loading, error, reload } = useHoneypotEvents({ q: combinedQuery, source: activeSource, page, limit });

  const submitSearch = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchDraft.trim());
  }, [searchDraft]);

  const setSourceFilter = useCallback((value: string) => {
    setPage(1);
    setSource(value);
    setQuickFilter(QUICK_FILTERS[0]);
  }, []);

  const applyQuickFilter = useCallback((filter: typeof QUICK_FILTERS[number]) => {
    setPage(1);
    setQuickFilter(filter);
    if (filter.source !== 'all') {
      setSource(filter.source);
    }
  }, []);

  return (
    <div className="min-h-screen gradient-bg animate-gradient-shift" role="main">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2 animate-fade-up" style={{ animationDelay: '250ms', opacity: 0 }}>
        <a
          href="/"
          className="rounded-full border border-border-subtle bg-white/55 px-3 py-2 text-xs font-medium text-text-secondary backdrop-blur transition-colors hover:text-text-primary dark:bg-black/20"
        >
          Lookup
        </a>
        <ThemeToggle />
      </div>

      <section className="w-full max-w-[1120px] mx-auto px-5 sm:px-6 pt-20 sm:pt-24 pb-12">
        <div className="mb-8 sm:mb-10 animate-fade-up" style={{ animationDelay: '100ms', opacity: 0 }}>
          <a href="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
            ← Reputation lookup
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          <div className="glass-card p-7 sm:p-9 animate-fade-up" style={{ animationDelay: '150ms', opacity: 0 }}>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted mb-3">
              isbadip honeypots
            </p>
            <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-text-primary mb-4">
              Real honeypot data, updated daily
            </h1>
            <p className="text-base sm:text-lg leading-7 text-text-secondary max-w-2xl">
              Search real activity observed by isbadip honeypots. The dataset is refreshed daily and
              provides practical indicators for spotting noisy scanners, probes, and automated abuse.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-text-muted">
              <span className="rounded-full border border-border-subtle px-3 py-1">Real data</span>
              <span className="rounded-full border border-border-subtle px-3 py-1">Searchable API</span>
              <span className="rounded-full border border-border-subtle px-3 py-1">Updated daily</span>
            </div>
            <div className="mt-7">
              <a
                href="https://api.isbadip.com/api/v1/honeypot/iocs"
                className="inline-flex min-h-11 items-center rounded-xl bg-accent-blue px-5 text-sm font-medium text-white transition-colors hover:bg-accent-blue-hover"
              >
                Export clean IOC JSON
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 animate-fade-up" style={{ animationDelay: '220ms', opacity: 0 }}>
            <Metric label="Network events" value={number(summary?.totals.network_events)} />
            <Metric label="Network IPs" value={number(summary?.totals.network_ips)} />
            <Metric label="Edge/Web events" value={number(summary?.totals.edge_events)} />
            <Metric label="Edge/Web IPs" value={number(summary?.totals.edge_ips)} />
          </div>
        </div>

        <div className="glass-card mt-6 p-4 sm:p-5 animate-fade-up" style={{ animationDelay: '280ms', opacity: 0 }}>
          <form onSubmit={submitSearch} className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search IPs, commands, credentials, hosts, paths..."
              className="min-h-11 rounded-xl border border-border-subtle bg-transparent px-4 text-text-primary placeholder:text-text-muted outline-none focus:border-accent-blue"
            />
            <select
              value={source}
              onChange={(event) => setSourceFilter(event.target.value)}
              className="min-h-11 rounded-xl border border-border-subtle bg-transparent px-4 text-text-primary outline-none focus:border-accent-blue"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="min-h-11 rounded-xl bg-accent-blue px-5 font-medium text-white transition-colors hover:bg-accent-blue-hover"
            >
              Search
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {QUICK_FILTERS.map((filter) => {
              const active = quickFilter.id === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => applyQuickFilter(filter)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'border-accent-blue bg-accent-blue text-white'
                      : 'border-border-subtle text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4">
            <TopList title="Top event types" rows={[...(summary?.top.network_events || []), ...(summary?.top.edge_events || [])].slice(0, 10)} />
            <TopList title="Top commands" rows={summary?.top.commands || []} />
            <TopList title="Edge hosts" rows={summary?.top.edge_hosts || []} />
          </aside>

          <section className="glass-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-medium text-text-primary">Events</h2>
                <p className="text-sm text-text-muted">
                  {loading ? 'Loading…' : `${number(events?.total)} matching rows`}
                  {summary?.generated_at ? ` · generated ${formatTime(summary.generated_at)}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={reload}
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Refresh
              </button>
              <a
                href="https://api.isbadip.com/api/v1/honeypot/iocs"
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Export JSON
              </a>
            </div>

            {error ? (
              <div className="p-6 text-danger-coral">Failed to load honeypot events: {error}</div>
            ) : (
              <div className="max-h-[68vh] min-h-[360px] divide-y divide-border-subtle/70 overflow-y-auto overscroll-contain">
                {(events?.events || []).map((event, index) => (
                  <article key={`${event.ts}-${event.ip}-${event.event}-${index}`} className="p-4 transition-colors hover:bg-accent-blue/5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue">
                            {sourceLabel(event.source)}
                          </span>
                          <span className="font-mono text-sm text-text-primary">{event.ip}</span>
                          <span className="text-xs text-text-muted">{formatTime(event.ts)}</span>
                        </div>
                        <div className="mt-2 font-mono text-sm text-text-secondary break-words">
                          {event.event}
                        </div>
                        {event.event === 'honeypot.session.file_download' ? (
                          <FileDownloadDetails event={event} />
                        ) : eventDetail(event) ? (
                          <div className="mt-2 rounded-lg border border-border-subtle bg-white/80 p-3 font-mono text-xs leading-5 text-slate-900 break-words dark:bg-code-bg/95 dark:text-code-text">
                            {eventDetail(event)}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-text-muted sm:justify-end">
                        {event.country ? <span>{event.country}</span> : null}
                        {event.action ? <span>{event.action}</span> : null}
                        {event.category ? <span>{event.category}</span> : null}
                      </div>
                    </div>
                  </article>
                ))}
                {!loading && events?.events.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">No matching events.</div>
                ) : null}
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border-subtle p-4">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-text-muted">
                Page {events?.page || page} of {events?.pages || 1}
              </span>
              <button
                type="button"
                disabled={loading || page >= (events?.pages || 1)}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-border-subtle px-3 py-2 text-sm text-text-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-5">
      <div className="font-mono text-2xl text-text-primary">{value}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">{label}</div>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: Array<{ key?: string; ip?: string; count: number }> }) {
  return (
    <div className="glass-card p-4">
      <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-text-muted">{title}</h3>
      <div className="space-y-2">
        {rows.slice(0, 8).map((row) => (
          <div key={`${row.key || row.ip}-${row.count}`} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-mono text-text-secondary">{row.key || row.ip}</span>
            <span className="shrink-0 text-text-muted">{number(row.count)}</span>
          </div>
        ))}
        {rows.length === 0 ? <p className="text-sm text-text-muted">No data yet.</p> : null}
      </div>
    </div>
  );
}

export default HoneypotPage;
