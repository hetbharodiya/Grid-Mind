import React from 'react';
import { Activity, Brain, DollarSign, Leaf, AlertCircle } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { NextHourDispatchResponse, DailyDispatchSummary } from '../../types/dispatch';
import { NormalizedApiError } from '../../types/error';

interface OperationsKPIsProps {
  nextHourData: NextHourDispatchResponse | null;
  dailySummary: DailyDispatchSummary | null;
  nextHourError?: NormalizedApiError | null;
  onRetryNextHour?: () => void;
}

export const OperationsKPIs: React.FC<OperationsKPIsProps> = ({
  nextHourData,
  dailySummary,
  nextHourError,
  onRetryNextHour,
}) => {
  // Extract clean energy kWh sum (Solar + Wind + Battery)
  const totalCleanKwh = dailySummary
    ? dailySummary.total_solar_used_kwh +
      dailySummary.total_wind_used_kwh +
      dailySummary.total_battery_used_kwh
    : 0;

  // Extract next-hour formatted time target
  let nextHourTarget = '';
  if (nextHourData?.forecast?.forecast_timestamp) {
    try {
      const ts = nextHourData.forecast.forecast_timestamp;
      nextHourTarget = ts.includes('T')
        ? ts.split('T')[1].substring(0, 5)
        : ts.substring(11, 16);
    } catch {
      nextHourTarget = '';
    }
  }

  const unitCostFormatted =
    dailySummary && dailySummary.total_supplied_energy_kwh > 0
      ? `$${(dailySummary.total_operational_cost_usd / dailySummary.total_supplied_energy_kwh).toFixed(4)}/kWh`
      : '$0.0000/kWh';

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Next-Hour Demand */}
        <MetricCard
          title="Next-Hour Demand"
          value={
            nextHourData
              ? nextHourData.forecast.predicted_demand_kwh.toFixed(2)
              : nextHourError
              ? 'N/A'
              : '--'
          }
          unit={nextHourData ? 'kWh' : undefined}
          icon={Activity}
          trend={
            nextHourData
              ? {
                  value: nextHourTarget ? `Target: ${nextHourTarget}` : 'Horizon t+1',
                  isPositive: true,
                  label: 'Next Step',
                }
              : undefined
          }
          statusText={
            nextHourData
              ? `Clean: ${nextHourData.clean_energy_percentage.toFixed(0)}%`
              : nextHourError
              ? 'Inference Error'
              : 'Solving LP'
          }
          colorTheme="sky"
        />

        {/* KPI 2: 24-Hour Projected Demand */}
        <MetricCard
          title="24H Projected Demand"
          value={dailySummary ? dailySummary.total_predicted_demand_kwh.toFixed(1) : '--'}
          unit="kWh"
          icon={Brain}
          trend={
            dailySummary
              ? {
                  value:
                    dailySummary.total_unmet_demand_kwh === 0
                      ? '100% Met'
                      : `${dailySummary.total_unmet_demand_kwh.toFixed(1)} kWh Unmet`,
                  isPositive: dailySummary.total_unmet_demand_kwh === 0,
                  label: 'Load Balance',
                }
              : undefined
          }
          statusText="24 Sequential Hours"
          colorTheme="white"
        />

        {/* KPI 3: Total Operational Cost */}
        <MetricCard
          title="24H Operational Cost"
          value={dailySummary ? `$${dailySummary.total_operational_cost_usd.toFixed(2)}` : '--'}
          unit="USD"
          icon={DollarSign}
          trend={
            dailySummary
              ? {
                  value: unitCostFormatted,
                  isPositive: true,
                  label: 'Effective Cost',
                }
              : undefined
          }
          statusText={
            dailySummary ? `${dailySummary.optimization_mode.toUpperCase()} MODE` : 'PuLP LP'
          }
          colorTheme="amber"
        />

        {/* KPI 4: Clean Energy Share */}
        <MetricCard
          title="Clean Energy Share"
          value={dailySummary ? dailySummary.average_clean_energy_percentage.toFixed(1) : '--'}
          unit="%"
          icon={Leaf}
          trend={
            dailySummary
              ? {
                  value: `${totalCleanKwh.toFixed(1)} kWh`,
                  isPositive: true,
                  label: 'Solar+Wind+ESS',
                }
              : undefined
          }
          statusText="Zero-Carbon Ratio"
          colorTheme="emerald"
        />
      </div>

      {/* Partial Failure Alert for Next-Hour Dispatch */}
      {nextHourError && !nextHourData && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs md:text-sm text-rose-800 font-medium">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Next-Hour forecast unavailable: {nextHourError.message}</span>
          </div>
          {onRetryNextHour && (
            <button
              type="button"
              onClick={onRetryNextHour}
              className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold uppercase transition-colors shadow-xs"
            >
              Retry Next-Hour
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationsKPIs;
