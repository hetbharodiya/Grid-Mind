import { useContext } from 'react';
import {
  SystemHealthContext,
  SystemHealthContextValue,
} from '../context/SystemHealthContext';

/**
 * Custom React hook to consume live system health telemetry.
 * Must be used within a SystemHealthProvider.
 */
export function useSystemHealth(): SystemHealthContextValue {
  const context = useContext(SystemHealthContext);

  if (!context) {
    throw new Error(
      'useSystemHealth must be used within a SystemHealthProvider. Wrap your component tree with <SystemHealthProvider>.'
    );
  }

  return context;
}

export default useSystemHealth;
