import React from 'react';
import { BarChart3, RefreshCw, Sliders, Server, Zap } from 'lucide-react';
import { OptimizationMode } from '../../types/dispatch';

interface AnalyticsHeaderProps {
  optimizationMode?: OptimizationMode;
  isBackendConnected: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  optimizationMode = OptimizationMode.BALANCED,
  isBackendConnected,
  onRefresh,
  isRefreshing,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-card space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                  Microgrid Analytics & Sustainability Intelligence
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 font-mono uppercase">
                  Enterprise SCADA
                </span>
              </div>
              <p className="text-sm md:text-base text-gray-600 mt-1 leading-relaxed">
                Comprehensive multi-dimensional analysis: demand dynamics, cost efficiency, battery dynamics & carbon metrics
              </p>
            </div>
          </div>
        </div>

        {/* Refresh Action Control */}
        <div className="flex items-center space-x-2.5 self-start lg:self-center">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900 text-sm font-semibold transition-all duration-200 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs active:scale-[0.98]"
            title="Refresh microgrid analytics telemetry from live backend"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
            <span>{isRefreshing ? 'Refreshing Analytics...' : 'Refresh Analytics'}</span>
          </button>
        </div>
      </div>

      {/* Operational Status Ribbon */}
      <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-[13px] font-mono">
        {/* Gateway Connection Status */}
        <div
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-semibold ${
            isBackendConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span>Gateway: {isBackendConnected ? 'Connected (Port 8000)' : 'Offline'}</span>
        </div>

        {/* Optimization Mode Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 font-semibold">
          <Sliders className="w-3.5 h-3.5 text-sky-600" />
          <span>Mode: <strong className="text-gray-900 capitalize font-bold">{optimizationMode}</strong></span>
        </div>

        {/* Solver Engine Status */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 font-semibold">
          <Server className="w-3.5 h-3.5 text-emerald-600" />
          <span>Solver: <strong className="text-emerald-700 font-bold">PuLP LP (CBC)</strong></span>
        </div>

        {/* Horizon Step Resolution */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200 font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Resolution: <strong className="text-gray-900 font-bold">24 Hourly Steps</strong></span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsHeader;
