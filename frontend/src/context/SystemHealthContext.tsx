import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { HealthResponse } from '../types/health';
import { NormalizedApiError } from '../types/error';
import { getSystemHealth } from '../api/healthService';

export interface SystemHealthContextValue {
  data: HealthResponse | null;
  loading: boolean;
  error: NormalizedApiError | null;
  refresh: () => Promise<void>;
  isRetrying: boolean;
}

export const SystemHealthContext = createContext<SystemHealthContextValue | undefined>(
  undefined
);

const POLLING_INTERVAL_MS = 30000; // 30 seconds controlled polling

interface SystemHealthProviderProps {
  children: React.ReactNode;
}

export const SystemHealthProvider: React.FC<SystemHealthProviderProps> = ({ children }) => {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Ref to track component mount status and avoid state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  const intervalRef = useRef<number | null>(null);

  const fetchHealth = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRetrying(true);
    }

    try {
      const response = await getSystemHealth();
      if (isMountedRef.current) {
        setData(response);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const normError = err as NormalizedApiError;
        setError(normError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsRetrying(false);
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchHealth(true);
  }, [fetchHealth]);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Initial health fetch
    fetchHealth(false);

    // 2. Setup single 30-second interval
    intervalRef.current = window.setInterval(() => {
      fetchHealth(false);
    }, POLLING_INTERVAL_MS);

    // 3. Clean up timer and prevent leaks on unmount
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchHealth]);

  const value: SystemHealthContextValue = {
    data,
    loading,
    error,
    refresh,
    isRetrying,
  };

  return (
    <SystemHealthContext.Provider value={value}>
      {children}
    </SystemHealthContext.Provider>
  );
};
