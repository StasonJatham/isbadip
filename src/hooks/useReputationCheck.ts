import { useState, useCallback } from 'react';
import type { ReputationResult, ApiStatus, ApiError, HostApiResponse, HostApiThreat } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'https://api.isbadip.com');

function confidenceScore(confidence: HostApiResponse['confidence'], malicious: boolean) {
  if (!malicious) return 0;
  if (confidence === 'high') return 95;
  if (confidence === 'medium') return 75;
  if (confidence === 'low') return 55;
  return 65;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function threatCategories(data: HostApiResponse) {
  const threats: HostApiThreat[] = [
    ...(data.threat ? [data.threat] : []),
    ...(data.ip_threats ?? []),
    ...(data.domain_threats ?? []),
  ];

  return unique(threats.flatMap((threat) => threat.categories ?? []));
}

function threatSources(data: HostApiResponse) {
  const threats: HostApiThreat[] = [
    ...(data.threat ? [data.threat] : []),
    ...(data.ip_threats ?? []),
    ...(data.domain_threats ?? []),
  ];

  return unique(threats.flatMap((threat) => threat.sources ?? []));
}

function topRank(top1m: HostApiResponse['top1m']) {
  if (typeof top1m === 'number') return top1m;
  return top1m?.rank ?? null;
}

function formatLocation(data: HostApiResponse) {
  const parts = [data.geo?.city, data.geo?.region, data.geo?.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function mapApiResponse(data: HostApiResponse): ReputationResult {
  if (!data.valid) {
    throw new Error(data.error ?? 'Input does not look like a valid IPv4 address or domain name.');
  }

  const sources = threatSources(data);
  const rank = topRank(data.top1m);
  const resolvedIPs = data.resolvedIPs ?? [];
  const hostnames = data.hostnames ?? [];

  return {
    query: data.query,
    bad: data.malicious,
    score: confidenceScore(data.confidence, data.malicious),
    categories: threatCategories(data),
    checked_at: new Date().toISOString(),
    details: {
      type: data.type,
      confidence: data.confidence ?? 'none',
      match_type: data.threat?.matchType ?? null,
      sources: sources.length > 0 ? sources.join(', ') : 'none',
      geo: formatLocation(data),
      top_1m_rank: rank ?? null,
      resolved_ips: resolvedIPs.length > 0 ? resolvedIPs.join(', ') : null,
      hostnames: hostnames.length > 0 ? hostnames.join(', ') : null,
      cached: data.cached ?? false,
    },
  };
}

export function useReputationCheck() {
  const [status, setStatus] = useState<ApiStatus>('idle');
  const [result, setResult] = useState<ReputationResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const check = useCallback(async (query: string) => {
    setStatus('loading');
    setError(null);
    setResult(null);

    const MAX_WARMUP_RETRIES = 4;
    const RETRY_DELAY_MS = 10_000;

    for (let attempt = 0; attempt <= MAX_WARMUP_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/host/${encodeURIComponent(query)}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        // Service is warming up — wait and retry automatically
        if (response.status === 503 && attempt < MAX_WARMUP_RETRIES) {
          setStatus('warming_up');
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
          setStatus('loading');
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: HostApiResponse = await response.json();
        setResult(mapApiResponse(data));
        setStatus('success');
        return;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError({ message: errorMessage });
        setStatus('error');
        return;
      }
    }

    // Exhausted retries — still warming up
    setError({ message: 'Service is still warming up after several retries. Please try again in a moment.' });
    setStatus('error');
  }, []);

  return { check, status, result, error };
}
