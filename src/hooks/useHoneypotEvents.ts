import { useCallback, useEffect, useState } from 'react';
import type { HoneypotEventsResponse, HoneypotSummaryResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'https://api.isbadip.com');

interface HoneypotQuery {
  q: string;
  source: string;
  page: number;
  limit: number;
}

export function useHoneypotEvents(query: HoneypotQuery) {
  const [summary, setSummary] = useState<HoneypotSummaryResponse | null>(null);
  const [events, setEvents] = useState<HoneypotEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query.q,
        source: query.source,
        page: String(query.page),
        limit: String(query.limit),
      });

      const [summaryResponse, eventsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/honeypot/summary`, { headers: { Accept: 'application/json' } }),
        fetch(`${API_BASE_URL}/api/v1/honeypot/events?${params}`, { headers: { Accept: 'application/json' } }),
      ]);

      if (!summaryResponse.ok || !eventsResponse.ok) {
        throw new Error(`API returned ${summaryResponse.status}/${eventsResponse.status}`);
      }

      const nextSummary = await summaryResponse.json() as HoneypotSummaryResponse;
      const nextEvents = await eventsResponse.json() as HoneypotEventsResponse;
      setSummary(nextSummary);
      setEvents(nextEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load honeypot data');
    } finally {
      setLoading(false);
    }
  }, [query.limit, query.page, query.q, query.source]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, events, loading, error, reload: load };
}
