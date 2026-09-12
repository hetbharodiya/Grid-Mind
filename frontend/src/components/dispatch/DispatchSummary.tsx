import React from 'react';
import {
  Zap,
  Leaf,
  DollarSign,
  CloudRain,
  Sparkles,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Battery,
  Sun,
  Wind,
} from 'lucide-react';
import { Horizon24hDispatchResponse, NextHourDispatchResponse } from '../../types/dispatch';
import { NormalizedApiError } from '../../types/error';

interface DispatchSummaryProps {
  horizon24hData: Horizon24hDispatchResponse;
  nextHourData: NextHourDispatchResponse | null;
  nextHourError?: NormalizedApiError | null;
  onRetryNextHour?: () => void;
  loadingNextHour?: boolean;
}

export const DispatchSummary: React.FC<DispatchSummaryProps> = ({
  horizon24hData,
  nextHourData,
  nextHourError,
  onRetryNextHour,
  loadingNextHour = false,
}) => {
  const summary = horizon24hData.daily_summary;

  const totalCleanKwh =
    summary.total_solar_used_kwh +
    summary.total_wind_used_kwh +
    summary.total_battery_used_kwh;

  const unitCostUsd =
    summary.total_supplied_energy_kwh > 0
      ? (summary.total_operational_cost_usd / summary.total_supplied_energy_kwh).toFixed(4)
      : '0.0000';

  const carbonIntensity =
    summary.total_supplied_energy_kwh > 0
      ? (summary.total_carbon_emissions_kg / summary.total_supplied_energy_kwh).toFixed(4)
      : '0.0000';

  return (
    <div className="space-y-4">
      {/* 24-Hour Horizon Operational KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Demand & Supply */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-sky-700 font-mono">
              Total Demand & Supply
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {summary.total_supplied_energy_kwh.toFixed(2)}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">kWh</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center justify-between">
            <span className="flex items-center text-emerald-700 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              {summary.total_unmet_demand_kwh === 0
                ? '100% Demand Met'
                : `${summary.total_unmet_demand_kwh.toFixed(2)} kWh Unmet`}
            </span>
            <span className="text-gray-500">
              Target: {summary.total_predicted_demand_kwh.toFixed(1)} kWh
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
        </div>

        {/* Metric 2: Clean Energy Share */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Clean Energy Share
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Leaf className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {summary.average_clean_energy_percentage.toFixed(1)}%
            </span>
            <span className="text-sm font-mono text-emerald-700 font-bold">clean</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center justify-between">
            <span>Solar + Wind + Battery</span>
            <span className="text-emerald-700 font-bold">{totalCleanKwh.toFixed(1)} kWh</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
        </div>

        {/* Metric 3: Total Operational Cost */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-amber-700 font-mono">
              Operational Cost
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              ${summary.total_operational_cost_usd.toFixed(2)}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">USD</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center justify-between">
            <span>Unit Cost</span>
            <span className="text-amber-700 font-bold">${unitCostUsd} / kWh</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
        </div>

        {/* Metric 4: Carbon Emissions */}
        <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-teal-700 font-mono">
              Carbon Emissions
            </span>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <CloudRain className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-tight text-gray-900">
              {summary.total_carbon_emissions_kg.toFixed(2)}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">kg CO₂</span>
          </div>
          <div className="mt-2 text-xs md:text-[13px] font-mono text-gray-600 font-medium flex items-center justify-between">
            <span>Intensity</span>
            <span className="text-teal-700 font-bold">{carbonIntensity} kg/kWh</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
        </div>
      </div>

      {/* Next-Hour Live Optimization Banner */}
      {nextHourData && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-50 via-white to-sky-50 border border-emerald-200 shadow-card space-y-3.5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Live Next-Hour Dispatch (t+1)
                </span>
                <span className="text-xs md:text-sm font-mono text-gray-600 font-medium">
                  Target: <strong className="text-gray-900">{nextHourData.forecast.forecast_timestamp}</strong>
                </span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-sm text-gray-700 font-semibold font-mono">
                  Optimized Load:
                </span>
                <span className="text-2xl md:text-3xl font-bold font-mono text-gray-900">
                  {nextHourData.forecast.predicted_demand_kwh.toFixed(2)}
                </span>
                <span className="text-sm font-mono text-emerald-600 font-bold">kWh</span>
              </div>
            </div>

            {/* Next Hour Solver Telemetry */}
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-[13px] font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <Cpu className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Solver:</span>
                <span className="text-emerald-700 font-bold">
                  {nextHourData.optimization.solver_status}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <Leaf className="w-4 h-4 mr-1.5 text-emerald-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Clean:</span>
                <span className="text-emerald-700 font-bold">
                  {nextHourData.clean_energy_percentage.toFixed(1)}%
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <DollarSign className="w-4 h-4 mr-1.5 text-amber-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Cost:</span>
                <span className="text-amber-700 font-bold">
                  ${nextHourData.optimization.total_cost_usd.toFixed(2)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 shadow-xs flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-sky-600" />
                <span className="text-gray-500 mr-1.5 font-medium">Latency:</span>
                <span className="text-sky-700 font-bold">{nextHourData.latency_ms} ms</span>
              </div>
            </div>
          </div>

          {/* Next Hour 5-Asset Allocation Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-700 uppercase">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Solar PV</span>
              </div>
              <div className="text-base font-bold text-gray-900 mt-1">
                {nextHourData.optimization.allocations.solar_used_kwh.toFixed(2)}{' '}
                <span className="text-xs text-gray-500 font-normal">kWh</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-cyan-700 uppercase">
                <Wind className="w-3.5 h-3.5 text-cyan-600" />
                <span>Wind</span>
              </div>
              <div className="text-base font-bold text-gray-900 mt-1">
                {nextHourData.optimization.allocations.wind_used_kwh.toFixed(2)}{' '}
                <span className="text-xs text-gray-500 font-normal">kWh</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 uppercase">
                <Battery className="w-3.5 h-3.5 text-emerald-600" />
                <span>Battery</span>
              </div>
              <div className="text-base font-bold text-gray-900 mt-1">
                {nextHourData.optimization.allocations.battery_used_kwh.toFixed(2)}{' '}
                <span className="text-xs text-gray-500 font-normal">kWh</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 uppercase">
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Grid Import</span>
              </div>
              <div className="text-base font-bold text-gray-900 mt-1">
                {nextHourData.optimization.allocations.grid_used_kwh.toFixed(2)}{' '}
                <span className="text-xs text-gray-500 font-normal">kWh</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 uppercase">
                <Zap className="w-3.5 h-3.5 text-slate-500" />
                <span>Diesel Gen</span>
              </div>
              <div className="text-base font-bold text-gray-900 mt-1">
                {nextHourData.optimization.allocations.diesel_used_kwh.toFixed(2)}{' '}
                <span className="text-xs text-gray-500 font-normal">kWh</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Hour Inline Error */}
      {nextHourError && !nextHourData && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs md:text-sm font-mono text-rose-800">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>
              Next-hour optimization failed: {nextHourError.message} ({nextHourError.errorCode})
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

export default DispatchSummary;
