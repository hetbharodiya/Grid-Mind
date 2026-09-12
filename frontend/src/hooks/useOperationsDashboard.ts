import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Horizon24hDispatchResponse,
  NextHourDispatchResponse,
} from '../types/dispatch';
import { NormalizedApiError } from '../types/error';
import {
  get24HourDispatch,
  getNextHourDispatch,
} from '../api/dispatchService';

export interface UseOperationsDashboardResult {
  horizon24hData: Horizon24hDispatchResponse | null;
  nextHourData: NextHourDispatchResponse | null;

  loading: boolean;
  isRefreshing: boolean;

  error24h: NormalizedApiError | null;
  errorNextHour: NormalizedApiError | null;

  refresh: () => Promise<void>;
  retry24Hour: () => Promise<void>;
  retryNextHour: () => Promise<void>;
}

/**
 * Custom React hook centralizing live operational data for the System Operations Center.
 * Uses Promise.allSettled() to concurrently execute 24-hour horizon dispatch and
 * single-hour live optimization while isolating failures.
 * Guarantees that partial API failure does not crash the operational console.
 */
export function useOperationsDashboard(): UseOperationsDashboardResult {
  const [horizon24hData, setHorizon24hData] = useState<Horizon24hDispatchResponse | null>(null);
  const [nextHourData, setNextHourData] = useState<NextHourDispatchResponse | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const [error24h, setError24h] = useState<NormalizedApiError | null>(null);
  const [errorNextHour, setErrorNextHour] = useState<NormalizedApiError | null>(null);

  const isMountedRef = useRef<boolean>(true);

  const fetchOperationsData = useCallback(async (isManualRefresh = false) => {
    if (!isMountedRef.current) return;

    if (isManualRefresh) {
      setIsRefreshing(true);
    } else if (!horizon24hData && !nextHourData) {
      setLoading(true);
    }

    try {
      // Execute 24-hour horizon and next-hour dispatch concurrently with failure isolation
      const [res24h, resNextHour] = await Promise.allSettled([
        get24HourDispatch({}),
        getNextHourDispatch({}),
      ]);

      if (!isMountedRef.current) return;

      // Handle 24-Hour Horizon Dispatch Result
      if (res24h.status === 'fulfilled') {
        setHorizon24hData(res24h.value);
        setError24h(null);
      } else {
        const normErr = res24h.reason as NormalizedApiError;
        setError24h(normErr);
      }

      // Handle Next-Hour Single-Step Dispatch Result
      if (resNextHour.status === 'fulfilled') {
        setNextHourData(resNextHour.value);
        setErrorNextHour(null);
      } else {
        const normErr = resNextHour.reason as NormalizedApiError;
        setErrorNextHour(normErr);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [horizon24hData, nextHourData]);

  // Dedicated retry for 24-hour horizon dispatch
  const retry24Hour = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const data = await get24HourDispatch({});
      if (isMountedRef.current) {
        setHorizon24hData(data);
        setError24h(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError24h(err as NormalizedApiError);
      }
    }
  }, []);

  // Dedicated retry for next-hour dispatch
  const retryNextHour = useCallback(async () => {
    if (!isMountedRef.current) return;
    try {
      const data = await getNextHourDispatch({});
      if (isMountedRef.current) {
        setNextHourData(data);
        setErrorNextHour(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setErrorNextHour(err as NormalizedApiError);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchOperationsData(true);
  }, [fetchOperationsData]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchOperationsData(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchOperationsData]);

  return {
    horizon24hData,
    nextHourData,
    loading,
    isRefreshing,
    error24h,
    errorNextHour,
    refresh,
    retry24Hour,
    retryNextHour,
  };
}

export default useOperationsDashboard;
