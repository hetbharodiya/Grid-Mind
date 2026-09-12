import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { NormalizedApiError } from '../../types/error';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: NormalizedApiError | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'System Communication Error',
  message,
  error,
  onRetry,
  isRetrying = false,
  className = '',
}) => {
  const displayMessage =
    message || error?.message || 'An unexpected error occurred while communicating with GridMind backend.';
  const errorCode = error?.errorCode;

  return (
    <div
      className={`rounded-xl bg-rose-50 border border-rose-200 p-6 text-center flex flex-col items-center justify-center space-y-4 shadow-sm ${className}`}
    >
      <div className="p-3 rounded-full bg-rose-100 text-rose-600 border border-rose-200">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <div className="max-w-md space-y-1.5">
        <div className="flex items-center justify-center space-x-2">
          <h4 className="text-base md:text-lg font-bold text-gray-900 tracking-tight">{title}</h4>
          {errorCode && (
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-700 border border-rose-200">
              {errorCode}
            </span>
          )}
        </div>
        <p className="text-sm text-rose-800 leading-relaxed font-normal">
          {displayMessage}
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Reconnecting...' : 'Retry Connection'}</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
