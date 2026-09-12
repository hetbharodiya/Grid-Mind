import React from 'react';
import { Sliders, Sparkles, RefreshCw, Cpu } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  mode?: string;
  solverStatus?: string;
  isModelReady?: boolean;
  isBackendConnected?: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title = 'Microgrid Command Center',
  subtitle = 'Real-time supervisory telemetry, forward load intelligence, and autonomous microgrid dispatch',
  mode = 'Balanced Mode',
  solverStatus = 'Optimal',
  isModelReady = true,
  isBackendConnected = true,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            {title}
          </h2>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs md:text-[13px] font-semibold border font-mono uppercase ${
              isBackendConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full mr-2 ${
                isBackendConnected ? 'bg-emerald-600 animate-pulse' : 'bg-rose-500'
              }`}
            />
            {isBackendConnected ? 'Live Backend' : 'Disconnected'}
          </span>
          {isModelReady && (
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs md:text-[13px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              ML Ready
            </span>
          )}
        </div>
        <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed max-w-3xl">
          {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Active Optimization Mode Badge */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-white border border-gray-200 text-xs md:text-sm text-gray-700 shadow-sm font-mono">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span className="text-gray-500">Preset:</span>
          <span className="font-bold text-gray-900">{mode}</span>
        </div>

        {/* Solver Status Badge */}
        <div className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs md:text-sm text-emerald-800 shadow-sm font-mono">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700 font-medium">Solver:</span>
          <span className="font-bold text-emerald-800 uppercase">{solverStatus}</span>
        </div>

        {/* Refresh Operations Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm font-semibold font-mono text-gray-800 border border-gray-300 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            title="Re-fetch live supervisory telemetry, load forecast, and dispatch plan"
          >
            <RefreshCw
              className={`w-4 h-4 text-emerald-600 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Operations'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardHeader;
