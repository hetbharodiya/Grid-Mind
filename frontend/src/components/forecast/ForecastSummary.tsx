import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Zap,
  Clock,
  Sparkles,
  Cpu,
  Database,
  Activity,
  AlertCircle,
} from 'lucide-react';
import {
  Horizon24hForecastResponse,
  NextHourForecastResponse,
} from '../../types/forecast';
import { NormalizedApiError } from '../../types/error';

interface ForecastSummaryProps {
  horizon24hData: Horizon24hForecastResponse;
  nextHourData: NextHourForecastResponse | null;
  nextHourError?: NormalizedApiError | null;
  onRetryNextHour?: () => void;
  loadingNextHour?: boolean;
}

export const ForecastSummary: React.FC<ForecastSummaryProps> = ({
  horizon24hData,
  nextHourData,
  nextHourError,
  onRetryNextHour,
  loadingNextHour = false,
}) => {
  const forecasts = horizon24hData.forecasts;

  // Derive mathematical summary metrics strictly from real response data
  const metrics = useMemo(() => {
    if (!forecasts || forecasts.length === 0) {
      return {
        peakItem: null,
        minItem: null,
        averageDemand: 0,
        totalDemand: horizon24hData.total_predicted_demand_kwh || 0,
      };
    }

    let peak = forecasts[0];
    let min = forecasts[0];
    let sum = 0;

    for (const item of forecasts) {
      if (item.predicted_demand_kwh > peak.predicted_demand_kwh) {
        peak = item;
      }
      if (item.predicted_demand_kwh < min.predicted_demand_kwh) {
        min = item;
      }
      sum += item.predicted_demand_kwh;
    }

    const averageDemand = sum / forecasts.length;

    return {
      peakItem: peak,
      minItem: min,
      averageDemand: Number(averageDemand.toFixed(4)),
      totalDemand: horizon24hData.total_predicted_demand_kwh,
    };
  }, [forecasts, horizon24hData.total_predicted_demand_kwh]);

  return (
    <div className="space-y-4">
      {/* 24-Hour Horizon Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Peak Demand */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-rose-600 font-mono">
              Peak Demand
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {metrics.peakItem ? metrics.peakItem.predicted_demand_kwh.toFixed(4) : '--'}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">kWh</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span>
              {metrics.peakItem ? metrics.peakItem.timestamp : 'N/A'} (Hour {metrics.peakItem?.hour}:00)
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500" />
        </div>

        {/* Metric 2: Minimum Demand */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Minimum Demand
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {metrics.minItem ? metrics.minItem.predicted_demand_kwh.toFixed(4) : '--'}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">kWh</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span>
              {metrics.minItem ? metrics.minItem.timestamp : 'N/A'} (Hour {metrics.minItem?.hour}:00)
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
        </div>

        {/* Metric 3: Average Hourly Demand */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-sky-700 font-mono">
              Average Hourly Load
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
              <Gauge className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {metrics.averageDemand.toFixed(4)}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">kWh</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span>Mean across 24 predicted steps</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
        </div>

        {/* Metric 4: Total 24h Demand */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-amber-700 font-mono">
              24-Hour Total Demand
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {metrics.totalDemand.toFixed(4)}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">kWh</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center">
            <Database className="w-3.5 h-3.5 mr-1 text-gray-400" />
            <span>Cumulative multi-step load</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
        </div>
      </div>

      {/* Next-Hour Live AI Forecast Banner */}
      {nextHourData && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-sky-50 via-white to-blue-50 border border-sky-200 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200 uppercase">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
                  Next Hour Forecast (t+1)
                </span>
                <span className="text-xs md:text-sm font-mono text-gray-600 font-medium">
                  Target: <strong className="text-gray-900">{nextHourData.forecast_timestamp}</strong>
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-sm text-gray-700 font-semibold font-mono">
                  Predicted Demand:
                </span>
                <span className="text-2xl md:text-3xl font-bold font-mono text-gray-900">
                  {nextHourData.predicted_demand_kwh.toFixed(4)}
                </span>
                <span className="text-sm font-mono text-sky-600 font-bold">kWh</span>
              </div>
            </div>

            {/* Next Hour Metadata Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-[13px] font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <Cpu className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Model:</span>
                <span className="text-emerald-700 font-bold">{nextHourData.model_type}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Context:</span>
                <span className="text-emerald-700 font-bold">
                  {nextHourData.history_records_used} records ({nextHourData.history_source})
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-amber-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Latency:</span>
                <span className="text-amber-700 font-bold">{nextHourData.latency_ms} ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Hour Inline Error (does not break 24h view) */}
      {nextHourError && !nextHourData && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs md:text-sm font-mono text-rose-800">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              Next-hour inference failed: {nextHourError.message} ({nextHourError.errorCode})
            </span>
          </div>
          {onRetryNextHour && (
            <button
              type="button"
              onClick={onRetryNextHour}
              disabled={loadingNextHour}
              className="ml-3 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase disabled:opacity-50 transition-colors"
            >
              {loadingNextHour ? 'Retrying...' : 'Retry Next-Hour'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ForecastSummary;
