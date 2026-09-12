import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Horizon24hDispatchResponse,
  NextHourDispatchResponse,
  OptimizationMode,
} from '../types/dispatch';
import { NormalizedApiError } from '../types/error';
import {
  get24HourDispatch,
  getNextHourDispatch,
} from '../api/dispatchService';

export interface UseDispatchResult {
  horizon24hData: Horizon24hDispatchResponse | null;
  nextHourData: NextHourDispatchResponse | null;

  loading24h: boolean;
  loadingNextHour: boolean;

  error24h: NormalizedApiError | null;
  errorNextHour: NormalizedApiError | null;

  selectedMode: OptimizationMode;
  setOptimizationMode: (mode: OptimizationMode) => void;

  generate24HourDispatch: (overrideMode?: OptimizationMode) => Promise<void>;
  generateNextHourDispatch: (overrideMode?: OptimizationMode) => Promise<void>;

  retry24HourDispatch: () => Promise<void>;
  retryNextHourDispatch: () => Promise<void>;
}

export interface UseDispatchOptions {
  autoFetch24h?: boolean;
  initialMode?: OptimizationMode;
}

/**
 * Custom React hook managing live 24-hour horizon dispatch and single-hour live optimization.
 * Integrates directly with POST /api/v1/dispatch/24h and POST /api/v1/dispatch/next-hour.
 * Maintains independent loading and error lifecycles, and guarantees component unmount safety.
 */
export function useDispatch(options: UseDispatchOptions = {}): UseDispatchResult {
  const { autoFetch24h = true, initialMode = OptimizationMode.BALANCED } = options;

  const [horizon24hData, setHorizon24hData] = useState<Horizon24hDispatchResponse | null>(null);
  const [nextHourData, setNextHourData] = useState<NextHourDispatchResponse | null>(null);

  const [loading24h, setLoading24h] = useState<boolean>(false);
  const [loadingNextHour, setLoadingNextHour] = useState<boolean>(false);

  const [error24h, setError24h] = useState<NormalizedApiError | null>(null);
  const [errorNextHour, setErrorNextHour] = useState<NormalizedApiError | null>(null);

  const [selectedMode, setSelectedMode] = useState<OptimizationMode>(initialMode);

  const isMountedRef = useRef<boolean>(true);
  const selectedModeRef = useRef<OptimizationMode>(selectedMode);

  useEffect(() => {
    selectedModeRef.current = selectedMode;
  }, [selectedMode]);

  // 1. Fetch 24-Hour Horizon Multi-Asset Dispatch Simulation
  const generate24HourDispatch = useCallback(async (overrideMode?: OptimizationMode) => {
    if (!isMountedRef.current) return;
    const modeToUse = overrideMode || selectedModeRef.current;
    setLoading24h(true);
    setError24h(null);

    try {
      // Backend automatically applies defaults: 200h telemetry, 200kWh battery, standard tariffs
      const response = await get24HourDispatch({
        mode: modeToUse,
      });
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

  // 2. Fetch Live Next-Hour Single-Step Microgrid Optimization Dispatch
  const generateNextHourDispatch = useCallback(async (overrideMode?: OptimizationMode) => {
    if (!isMountedRef.current) return;
    const modeToUse = overrideMode || selectedModeRef.current;
    setLoadingNextHour(true);
    setErrorNextHour(null);

    try {
      const response = await getNextHourDispatch({
        mode: modeToUse,
      });
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

  // 3. Mode Switcher (re-runs dispatch with new preset)
  const handleSetOptimizationMode = useCallback((newMode: OptimizationMode) => {
    setSelectedMode(newMode);
    selectedModeRef.current = newMode;
    // Re-trigger active dispatch schedules under new optimization preset
    generate24HourDispatch(newMode);
    setNextHourData((prev) => {
      if (prev) {
        generateNextHourDispatch(newMode);
      }
      return prev;
    });
  }, [generate24HourDispatch, generateNextHourDispatch]);

  // 4. Retry helpers
  const retry24HourDispatch = useCallback(async () => {
    await generate24HourDispatch();
  }, [generate24HourDispatch]);

  const retryNextHourDispatch = useCallback(async () => {
    await generateNextHourDispatch();
  }, [generateNextHourDispatch]);

  // 5. Initial load on mount
  useEffect(() => {
    isMountedRef.current = true;

    if (autoFetch24h) {
      generate24HourDispatch();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoFetch24h, generate24HourDispatch]);

  return {
    horizon24hData,
    nextHourData,
    loading24h,
    loadingNextHour,
    error24h,
    errorNextHour,
    selectedMode,
    setOptimizationMode: handleSetOptimizationMode,
    generate24HourDispatch,
    generateNextHourDispatch,
    retry24HourDispatch,
    retryNextHourDispatch,
  };
}

export default useDispatch;
