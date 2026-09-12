import React from 'react';
import {
  Cpu,
  Layers,
} from 'lucide-react';
import { useForecast } from '../hooks/useForecast';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { ForecastControls } from '../components/forecast/ForecastControls';
import { ForecastSummary } from '../components/forecast/ForecastSummary';
import { ForecastChart } from '../components/forecast/ForecastChart';
import { ForecastTable } from '../components/forecast/ForecastTable';

export const ForecastPage: React.FC = () => {
  const {
    horizon24hData,
    nextHourData,
    loading24h,
    loadingNextHour,
    error24h,
    errorNextHour,
    generate24HourForecast,
    generateNextHourForecast,
    retry24HourForecast,
    retryNextHourForecast,
  } = useForecast({ autoFetch24h: true });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Demand Forecasting
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live Backend
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed">
            AI-powered recursive multi-step electricity demand forecasting using live backend telemetry.
          </p>
        </div>

        {/* Live Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
            <Layers className="w-4 h-4 mr-1.5 text-sky-600" />
            24-Hour Horizon
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            <Cpu className="w-4 h-4 mr-1.5 text-emerald-600" />
            HistGradientBoosting
          </span>
        </div>
      </div>

      {/* Initial Loading State */}
      {loading24h && !horizon24hData && (
        <LoadingState
          size="lg"
          message="Executing AI forward demand inference..."
          className="py-20"
        />
      )}

      {/* Initial Error State with Retry */}
      {error24h && !horizon24hData && (
        <ErrorState
          title="Demand Forecast Error"
          error={error24h}
          onRetry={retry24HourForecast}
          isRetrying={loading24h}
          className="my-6"
        />
      )}

      {/* Live Forecast Dashboard (Rendered when 24h data is available) */}
      {horizon24hData && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <ForecastControls
            onGenerate24h={generate24HourForecast}
            onGenerateNextHour={generateNextHourForecast}
            loading24h={loading24h}
            loadingNextHour={loadingNextHour}
            horizon24hData={horizon24hData}
          />

          {/* Derived Analytics Summary & Next-Hour Banner */}
          <ForecastSummary
            horizon24hData={horizon24hData}
            nextHourData={nextHourData}
            nextHourError={errorNextHour}
            onRetryNextHour={retryNextHourForecast}
            loadingNextHour={loadingNextHour}
          />

          {/* 24-Hour Forward Demand Trajectory Chart */}
          <ForecastChart
            forecasts={horizon24hData.forecasts}
            latencyMs={horizon24hData.latency_ms}
          />

          {/* Chronological Step Breakdown Table */}
          <ForecastTable forecasts={horizon24hData.forecasts} />
        </div>
      )}
    </div>
  );
};

export default ForecastPage;
