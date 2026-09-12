import { useState, useEffect, useCallback, useRef } from 'react';
import { ModelInfoResponse } from '../types/health';
import { NormalizedApiError } from '../types/error';
import { getModelInfo } from '../api/healthService';

export interface UseModelInfoResult {
  data: ModelInfoResponse | null;
  loading: boolean;
  error: NormalizedApiError | null;
  refresh: () => Promise<void>;
  isRetrying: boolean;
}

/**
 * Custom React hook to fetch and manage verified AI model metadata.
 */
export function useModelInfo(): UseModelInfoResult {
  const [data, setData] = useState<ModelInfoResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<NormalizedApiError | null>(null);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);

  const fetchModel = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRetrying(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getModelInfo();
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
    await fetchModel(true);
  }, [fetchModel]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchModel(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchModel]);

  return {
    data,
    loading,
    error,
    refresh,
    isRetrying,
  };
}

export default useModelInfo;
