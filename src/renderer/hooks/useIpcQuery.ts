import { useState, useEffect, useCallback } from 'react';

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useIpcQuery<T>(channel: string, params?: unknown): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.clawpilot.invoke(channel, params);
      setData(result as T);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [channel, JSON.stringify(params)]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
