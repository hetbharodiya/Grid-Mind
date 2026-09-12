import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: {
    spinner: 'w-4 h-4',
    text: 'text-xs md:text-sm',
    container: 'p-3',
  },
  md: {
    spinner: 'w-6 h-6',
    text: 'text-sm md:text-base',
    container: 'p-6',
  },
  lg: {
    spinner: 'w-8 h-8',
    text: 'text-base md:text-lg',
    container: 'p-12',
  },
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading system telemetry...',
  size = 'md',
  className = '',
}) => {
  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-xl bg-white border border-gray-200 shadow-sm ${config.container} ${className}`}
    >
      <div className="relative flex items-center justify-center text-emerald-600">
        <Loader2 className={`${config.spinner} animate-spin`} />
      </div>
      {message && (
        <p className={`mt-3 font-medium text-gray-500 ${config.text}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingState;
