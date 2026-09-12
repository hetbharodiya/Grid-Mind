import React from 'react';
import { Play, Zap, RefreshCw, Database, Clock, Activity } from 'lucide-react';
import { Horizon24hForecastResponse } from '../../types/forecast';

interface ForecastControlsProps {
  onGenerate24h: () => void;
  onGenerateNextHour: () => void;
  loading24h: boolean;
  loadingNextHour: boolean;
  horizon24hData: Horizon24hForecastResponse | null;
}

export const ForecastControls: React.FC<ForecastControlsProps> = ({
  onGenerate24h,
  onGenerateNextHour,
  loading24h,
  loadingNextHour,
  horizon24hData,
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Action Buttons */}
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
          <span>{loading24h ? 'Generating 24H Horizon...' : 'Generate 24-Hour Forecast'}</span>
        </button>

        {/* Secondary Action: Next Hour */}
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
          <span>{loadingNextHour ? 'Inference Running...' : 'Predict Next Hour'}</span>
        </button>
      </div>

      {/* Telemetry Metadata Chips */}
      {horizon24hData ? (
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-[13px] font-mono">
          {/* History Source */}
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
            <Database className="w-4 h-4 mr-1.5 text-emerald-600" />
            <span className="text-gray-500 mr-1.5 font-medium">Source:</span>
            <span className="font-bold text-emerald-700 uppercase">
              {horizon24hData.history_source === 'default' ? 'Default Telemetry' : horizon24hData.history_source}
            </span>
          </div>

          {/* Records Ingested */}
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
            <Activity className="w-4 h-4 mr-1.5 text-sky-600" />
            <span className="text-gray-500 mr-1.5 font-medium">Context:</span>
            <span className="font-bold text-sky-700">
              {horizon24hData.history_records_used} Records
            </span>
          </div>

          {/* Inference Latency */}
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700">
            <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
            <span className="text-gray-500 mr-1.5 font-medium">Latency:</span>
            <span className="font-bold text-amber-700">
              {horizon24hData.latency_ms} ms
            </span>
          </div>
        </div>
      ) : (
        <div className="text-xs md:text-sm font-mono text-gray-500 flex items-center font-medium">
          <span className="w-2 h-2 rounded-full bg-gray-400 mr-2" />
          Awaiting telemetry trigger
        </div>
      )}
    </div>
  );
};

export default ForecastControls;
