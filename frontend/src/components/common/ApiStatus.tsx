import React from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { HealthResponse } from '../../types/health';
import { NormalizedApiError } from '../../types/error';

interface ApiStatusProps {
  data: HealthResponse | null;
  loading: boolean;
  error: NormalizedApiError | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({
  data,
  loading,
  error,
  onRetry,
  isRetrying = false,
  compact = false,
}) => {
  // 1. Loading State
  if (loading && !data && !error) {
    return (
      <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs md:text-[13px] font-semibold shadow-sm">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
        <span className="font-mono tracking-wide">CONNECTING...</span>
      </div>
    );
  }

  // 2. Disconnected / Error State
  if (error || !data) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-[13px] font-semibold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="font-mono tracking-wide">API DISCONNECTED</span>
        </div>

        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isRetrying || loading}
            title={error?.message || 'Retry connection to backend'}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying || loading ? 'animate-spin' : ''}`} />
            {!compact && <span>Retry</span>}
          </button>
        )}
      </div>
    );
  }

  // 3. Degraded Status (Backend answered, but model or dataset missing)
  if (data.status === 'degraded' || !data.model_loaded || !data.dataset_available) {
    return (
      <div
        className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs md:text-[13px] font-semibold shadow-sm"
        title={`Model: ${data.model_loaded ? 'Ready' : 'Missing'}, Dataset: ${
          data.dataset_available ? 'Available' : 'Missing'
        }`}
      >
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="font-mono tracking-wide">SYSTEM DEGRADED</span>
      </div>
    );
  }

  // 4. Healthy Online Status
  return (
    <div
      className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs md:text-[13px] font-semibold shadow-sm"
      title={`GridMind Backend v${data.version} (${data.app_name})`}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
      </span>
      <span className="font-mono tracking-wide">SYSTEM ONLINE</span>
    </div>
  );
};

export default ApiStatus;
