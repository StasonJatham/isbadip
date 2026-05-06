import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useReputationCheck } from '@/hooks/useReputationCheck';
import { ShieldIcon, CheckIcon, AlertIcon, LoadingDots } from '@/components/icons';

interface SearchCardProps {
  onHostChange?: (host: string) => void;
  initialHost?: string;
}

const SearchCard: React.FC<SearchCardProps> = ({ onHostChange, initialHost = '' }) => {
  const [query, setQuery] = useState(initialHost);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const { check, status, result, error } = useReputationCheck();
  const didAutoSearch = useRef(false);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-search if host param present on mount
  useEffect(() => {
    if (initialHost && !didAutoSearch.current) {
      didAutoSearch.current = true;
      setShowResult(true);
      check(initialHost);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to result when it appears
  useEffect(() => {
    if (status === 'success' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed || status === 'loading') return;

      setShowResult(true);
      onHostChange?.(trimmed);
      await check(trimmed);
    },
    [query, status, check, onHostChange]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (status === 'error' || status === 'success') {
      setShowResult(false);
    }
  }, [status]);

  const isLoading = status === 'loading';
  const hasResult = status === 'success' && result !== null;
  const hasError = status === 'error';

  return (
    <div
      className="w-full max-w-[640px] mx-auto animate-fade-up"
      style={{ animationDelay: '150ms', opacity: 0 }}
    >
      <div className="glass-card p-8 sm:p-10 md:p-10">
        {/* Shield Icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="text-accent-blue animate-float" aria-hidden="true">
            <ShieldIcon size={48} />
          </div>
          <span className="mt-3 text-xs font-medium tracking-[0.2em] uppercase text-text-muted">
            isbadip.com
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-center text-text-primary font-medium tracking-tight mb-3 animate-fade-up"
          style={{
            fontSize: 'clamp(28px, 5vw, 48px)',
            lineHeight: 1.15,
            animationDelay: '200ms',
            opacity: 0,
          }}
        >
          Check any IP or Domain
        </h1>

        {/* Subtitle */}
        <p
          className="text-center text-text-secondary text-base sm:text-lg mb-8 animate-fade-up"
          style={{ animationDelay: '250ms', opacity: 0 }}
        >
          Instant reputation lookup. Free, fast, no account required.
        </p>

        {/* Search Form */}
        <form
          onSubmit={handleSubmit}
          role="search"
          aria-label="Reputation checker"
          aria-busy={isLoading}
          className="animate-fade-up"
          style={{ animationDelay: '300ms', opacity: 0 }}
        >
          <div
            className={`
              relative flex items-center rounded-xl border transition-all duration-200
              ${
                isLoading
                  ? 'border-accent-blue/50'
                  : 'border-border-subtle hover:border-accent-blue/30 focus-within:border-accent-blue focus-within:shadow-focus'
              }
            `}
            style={{
              background: 'var(--surface-input)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder="Enter IP address or domain..."
              aria-label="Enter IP address or domain to check"
              disabled={isLoading}
              className="
                flex-1 min-w-0 bg-transparent py-4 pl-5 pr-28 sm:pr-32
                text-text-primary placeholder:text-muted
                text-base sm:text-lg
                rounded-xl border-0 outline-none
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              aria-label="Check reputation"
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                bg-accent-blue hover:bg-accent-blue-hover
                text-white font-medium
                px-5 sm:px-6 py-2.5 rounded-lg
                transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-accent-blue
                focus-visible:shadow-focus
                text-sm sm:text-base
              "
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <LoadingDots />
                </span>
              ) : (
                'Check'
              )}
            </button>
          </div>
        </form>

        {/* Result Area */}
        {showResult && (
          <div
            ref={resultRef}
            className="mt-6 overflow-hidden"
            aria-live="polite"
            aria-atomic="true"
          >
            {isLoading && (
              <div className="text-center py-6 text-text-muted animate-fade-up">
                <p>Looking up reputation data...</p>
              </div>
            )}

            {hasError && error && (
              <div
                className="animate-fade-up rounded-xl bg-danger-coral/8 border border-danger-coral/20 p-4 text-danger-coral"
                role="alert"
              >
                <div className="flex items-center gap-2">
                  <AlertIcon size={18} />
                  <span className="font-medium">Something went wrong</span>
                </div>
                <p className="mt-1 text-sm opacity-80">{error.message}</p>
              </div>
            )}

            {hasResult && result && (
              <div className="animate-fade-up">
                {/* Status Badge */}
                <div
                  className="animate-slide-in-left"
                  style={{ animationDelay: '60ms', opacity: 0 }}
                >
                  <div
                    className={`
                      inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                      ${
                        result.bad
                          ? 'bg-danger-coral/10 text-danger-coral border border-danger-coral/20'
                          : 'bg-success-green/10 text-success-green border border-success-green/20'
                      }
                    `}
                  >
                    {result.bad ? (
                      <>
                        <AlertIcon size={16} />
                        <span>Flagged</span>
                      </>
                    ) : (
                      <>
                        <CheckIcon size={16} />
                        <span>Clean</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Score Bar */}
                <div className="mt-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-text-secondary">Reputation score</span>
                    <span className="text-sm font-medium font-mono text-text-primary">
                      {result.score}/100
                    </span>
                  </div>
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{ background: 'rgba(59, 91, 123, 0.08)' }}
                    role="progressbar"
                    aria-valuenow={result.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Reputation score: ${result.score} out of 100`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${result.score}%`,
                        background: `linear-gradient(90deg, ${result.bad ? '#7D9B76' : '#7D9B76'} 0%, ${result.bad ? '#C67D6D' : '#7D9B76'} 100%)`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-text-muted">
                    {result.bad
                      ? 'This address has been flagged by reputation services.'
                      : 'No malicious activity detected for this address.'}
                  </p>
                </div>

                {/* Categories */}
                {result.categories && result.categories.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.categories.map((cat, i) => (
                      <span
                        key={cat}
                        className="
                          px-3 py-1 text-xs font-medium
                          bg-danger-coral/8 text-danger-coral
                          border border-danger-coral/15 rounded-lg
                          animate-fade-up
                        "
                        style={{ animationDelay: `${120 + i * 60}ms`, opacity: 0 }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Details */}
                {result.details && (
                  <div className="mt-4 pt-4 border-t border-border-subtle">
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(result.details).map(([key, value], i) => (
                        <div
                          key={key}
                          className="animate-fade-up"
                          style={{ animationDelay: `${180 + i * 60}ms`, opacity: 0 }}
                        >
                          <dt className="text-xs text-text-muted capitalize mb-0.5">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-sm text-text-primary font-mono">
                            {value === null ? '—' : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust indicator below card */}
      <p className="text-center text-text-muted text-xs sm:text-sm mt-5 animate-fade-up" style={{ animationDelay: '350ms', opacity: 0 }}>
        No data stored. No sign-up. Just results.
      </p>
    </div>
  );
};

export default SearchCard;
