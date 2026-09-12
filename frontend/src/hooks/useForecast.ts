import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Horizon24hForecastResponse,
  NextHourForecastResponse,
} from '../types/forecast';
import { NormalizedApiError } from '../types/error';
import {
  get24HourForecast,
  getNextHourForecast,
} from '../api/forecastService';

export interface UseForecastResult {
  horizon24hData: Horizon24hForecastResponse | null;
  nextHourData: NextHourForecastResponse | null;

  loading24h: boolean;
  loadingNextHour: boolean;

  error24h: NormalizedApiError | null;
  errorNextHour: NormalizedApiError | null;

  generate24HourForecast: () => Promise<void>;
  generateNextHourForecast: () => Promise<void>;

  retry24HourForecast: () => Promise<void>;
  retryNextHourForecast: () => Promise<void>;
}

interface UseForecastOptions {
  autoFetch24h?: boolean;
}

/**
 * Custom React hook managing live 24-hour and next-hour demand forecasts.
 * Integrates directly with POST /api/v1/forecast/24h and POST /api/v1/forecast/next-hour.
 * Maintains independent loading and error lifecycles, and guarantees component unmount safety.
 */
export function useForecast(options: UseForecastOptions = { autoFetch24h: true }): UseForecastResult {
  const { autoFetch24h = true } = options;

  const [horizon24hData, setHorizon24hData] = useState<Horizon24hForecastResponse | null>(null);
  const [nextHourData, setNextHourData] = useState<NextHourForecastResponse | null>(null);

  const [loading24h, setLoading24h] = useState<boolean>(false);
  const [loadingNextHour, setLoadingNextHour] = useState<boolean>(false);

  const [error24h, setError24h] = useState<NormalizedApiError | null>(null);
  const [errorNextHour, setErrorNextHour] = useState<NormalizedApiError | null>(null);

  const isMountedRef = useRef<boolean>(true);

  // 1. Fetch 24-Hour Horizon Multi-Step Forecast
  const generate24HourForecast = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoading24h(true);
    setError24h(null);

    try {
      // Backend automatically resolves default 200h telemetry when payload is {}
      const response = await get24HourForecast({});
      if (isMountedRef.current) {
        setHorizon24hData(response);
        setError24h(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const normError = err as NormalizedApiError;
        setError24h(normError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading24h(false);
      }
    }
  }, []);

  // 2. Fetch Single-Step Next-Hour Forecast
  const generateNextHourForecast = useCallback(async () => {
    if (!isMountedRef.current) return;
    setLoadingNextHour(true);
    setErrorNextHour(null);

    try {
      // Backend automatically resolves default telemetry when payload is {}
      const response = await getNextHourForecast({});
      if (isMountedRef.current) {
        setNextHourData(response);
        setErrorNextHour(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        const normError = err as NormalizedApiError;
        setErrorNextHour(normError);
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingNextHour(false);
      }
    }
  }, []);

  // 3. Retry helpers
  const retry24HourForecast = useCallback(async () => {
    await generate24HourForecast();
  }, [generate24HourForecast]);

  const retryNextHourForecast = useCallback(async () => {
    await generateNextHourForecast();
  }, [generateNextHourForecast]);

  // 4. Initial load on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (autoFetch24h) {
      generate24HourForecast();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoFetch24h, generate24HourForecast]);

  return {
    horizon24hData,
    nextHourData,
    loading24h,
    loadingNextHour,
    error24h,
    errorNextHour,
    generate24HourForecast,
    generateNextHourForecast,
    retry24HourForecast,
    retryNextHourForecast,
  };
}

export default useForecast;
