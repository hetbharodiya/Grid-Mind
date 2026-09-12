import { useState, useEffect, useCallback, useRef } from 'react';
import { Horizon24hDispatchResponse } from '../types/dispatch';
import { NormalizedApiError } from '../types/error';
import { get24HourDispatch } from '../api/dispatchService';

export interface UseAnalyticsResult {
  data: Horizon24hDispatchResponse | null;
  loading: boolean;
  isRefreshing: boolean;
  error: NormalizedApiError | null;
  refresh: () => Promise<void>;
}

/**
 * Custom React hook for retrieving and managing 24-hour microgrid operations analytics.
 * Reuses the existing dispatchService get24HourDispatch({}) contract.
 * Preserves loaded telemetry during refresh and ensures unmount lifecycle safety.
 */
export function useAnalytics(): UseAnalyticsResult {
  const [data, setData] = useState<Horizon24hDispatchResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<NormalizedApiError | null>(null);

  const isMountedRef = useRef<boolean>(true);
  const hasLoadedRef = useRef<boolean>(false);

  const fetchAnalytics = useCallback(async (isManualRefresh = false) => {
    if (!isMountedRef.current) return;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!hasLoadedRef.current) {
      setLoading(true);
    }

    try {
      const response = await get24HourDispatch({});
      if (isMountedRef.current) {
        setData(response);
        hasLoadedRef.current = true;
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err as NormalizedApiError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchAnalytics(true);
  }, [fetchAnalytics]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAnalytics(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    isRefreshing,
    error,
    refresh,
  };
}

export default useAnalytics;
