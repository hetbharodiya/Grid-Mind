import React from 'react';
import {
  Play,
  Zap,
  RefreshCw,
  Database,
  Clock,
  Activity,
  Sparkles,
  Scale,
  DollarSign,
  Leaf,
} from 'lucide-react';
import { Horizon24hDispatchResponse, OptimizationMode } from '../../types/dispatch';

interface DispatchControlsProps {
  onGenerate24h: () => void;
  onGenerateNextHour: () => void;
  selectedMode: OptimizationMode;
  onSelectMode: (mode: OptimizationMode) => void;
  loading24h: boolean;
  loadingNextHour: boolean;
  horizon24hData: Horizon24hDispatchResponse | null;
}

const MODE_CONFIGS = [
  {
    mode: OptimizationMode.BALANCED,
    label: 'Balanced Mode',
    shortLabel: 'Balanced',
    icon: Scale,
    desc: 'Cost & CO₂ trade-off',
    activeClass:
      'bg-blue-50 text-blue-800 border-blue-200 shadow-xs',
    dotColor: 'bg-blue-500',
  },
  {
    mode: OptimizationMode.ECONOMY,
    label: 'Economy Mode',
    shortLabel: 'Economy ($)',
    icon: DollarSign,
    desc: 'Lowest monetary cost',
    activeClass:
      'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-xs',
    dotColor: 'bg-emerald-500',
  },
  {
    mode: OptimizationMode.GREEN,
    label: 'Green Mode',
    shortLabel: 'Green (CO₂)',
    icon: Leaf,
    desc: 'Lowest carbon footprint',
    activeClass:
      'bg-teal-50 text-teal-800 border-teal-200 shadow-xs',
    dotColor: 'bg-teal-500',
  },
];

export const DispatchControls: React.FC<DispatchControlsProps> = ({
  onGenerate24h,
  onGenerateNextHour,
  selectedMode,
  onSelectMode,
  loading24h,
  loadingNextHour,
  horizon24hData,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Primary Action: 24h Horizon */}
          <button
            type="button"
            onClick={onGenerate24h}
            disabled={loading24h}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm md:text-[15px] font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            {loading24h ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{loading24h ? 'Optimizing 24H Horizon...' : 'Generate 24-Hour Dispatch Plan'}</span>
          </button>

          {/* Secondary Action: Next Hour Single-Step */}
          <button
            type="button"
            onClick={onGenerateNextHour}
            disabled={loadingNextHour}
            className="inline-flex items-center space-x-2 px-4.5 py-2.5 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 hover:text-gray-900 border border-gray-300 text-sm font-semibold transition-colors shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            {loadingNextHour ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <Zap className="w-4 h-4 text-emerald-600" />
            )}
            <span>{loadingNextHour ? 'Running PuLP Solver...' : 'Optimize Next Hour'}</span>
          </button>
        </div>

        {/* Right: Operational Preset Selector */}
        <div className="flex items-center space-x-2.5">
          <span className="text-xs md:text-sm font-bold font-mono text-gray-700 uppercase hidden sm:inline">
            Preset:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
            {MODE_CONFIGS.map((config) => {
              const Icon = config.icon;
              const isSelected = selectedMode === config.mode;
              return (
                <button
                  key={config.mode}
                  type="button"
                  onClick={() => onSelectMode(config.mode)}
                  disabled={loading24h}
                  className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                    isSelected
                      ? `${config.activeClass} border shadow-xs font-bold`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 border border-transparent'
                  }`}
                  title={config.desc}
                >
                  <Icon className="w-4 h-4" />
                  <span>{config.shortLabel}</span>
                  {isSelected && (
                    <span
                      className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse ml-0.5`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Telemetry & Solver Metadata Strip */}
      {horizon24hData && (
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs md:text-[13px] font-mono">
          <div className="flex flex-wrap items-center gap-2">
            {/* Solver Status Badge */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
              <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
              <span className="text-gray-500 mr-1.5 font-medium">Solver:</span>
              <span className="font-bold text-emerald-700 uppercase">
                {horizon24hData.hourly_steps[0]?.solver_status || 'Optimal'} (PuLP COIN-OR CBC)
              </span>
            </div>

            {/* History Source */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
              <Database className="w-4 h-4 mr-1.5 text-sky-600" />
              <span className="text-gray-500 mr-1.5 font-medium">Telemetry:</span>
              <span className="font-bold text-sky-700 uppercase">
                {horizon24hData.history_source === 'default'
                  ? 'Default Telemetry'
                  : horizon24hData.history_source}
              </span>
            </div>

            {/* Ingested Records */}
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
              <Activity className="w-4 h-4 mr-1.5 text-blue-600" />
              <span className="text-gray-500 mr-1.5 font-medium">Context:</span>
              <span className="font-bold text-blue-700">
                {horizon24hData.history_records_used} Records
              </span>
            </div>
          </div>

          {/* Solve Latency */}
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
            <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
            <span className="text-gray-500 mr-1.5 font-medium">LP Solve Latency:</span>
            <span className="font-bold text-amber-700">
              {horizon24hData.latency_ms} ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchControls;
