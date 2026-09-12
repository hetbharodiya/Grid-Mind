import React from 'react';
import {
  Zap,
  BatteryCharging,
  ShieldAlert,
  Sparkles,
  Layers,
  Scale,
  DollarSign,
  Leaf,
} from 'lucide-react';
import { useDispatch } from '../hooks/useDispatch';
import { OptimizationMode } from '../types/dispatch';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { DispatchControls } from '../components/dispatch/DispatchControls';
import { DispatchSummary } from '../components/dispatch/DispatchSummary';
import { DispatchChart } from '../components/dispatch/DispatchChart';
import { DispatchBatteryTrajectory } from '../components/dispatch/DispatchBatteryTrajectory';
import { DispatchEnergyMix } from '../components/dispatch/DispatchEnergyMix';
import { DispatchTable } from '../components/dispatch/DispatchTable';

export const DispatchPage: React.FC = () => {
  const {
    horizon24hData,
    nextHourData,
    loading24h,
    loadingNextHour,
    error24h,
    errorNextHour,
    selectedMode,
    setOptimizationMode,
    generate24HourDispatch,
    generateNextHourDispatch,
    retry24HourDispatch,
    retryNextHourDispatch,
  } = useDispatch({ autoFetch24h: true });

  const getModeBadge = (mode: OptimizationMode) => {
    switch (mode) {
      case OptimizationMode.ECONOMY:
        return {
          label: 'Economy Mode ($)',
          icon: DollarSign,
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case OptimizationMode.GREEN:
        return {
          label: 'Green Mode (CO₂)',
          icon: Leaf,
          className: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case OptimizationMode.BALANCED:
      default:
        return {
          label: 'Balanced Mode',
          icon: Scale,
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  const modeBadge = getModeBadge(selectedMode);
  const ModeIcon = modeBadge.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Dispatch Optimization
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1.5" />
              Live Backend
            </span>
          </div>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed">
            Mathematical optimization allocating energy across Solar, Wind, Battery, Grid, and Diesel to minimize cost and emissions.
          </p>
        </div>

        {/* Live Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 font-mono">
            <Layers className="w-4 h-4 mr-1.5 text-sky-600" />
            24-Hour Horizon
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            <Sparkles className="w-4 h-4 mr-1.5 text-emerald-600" />
            PuLP LP Solver
          </span>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border font-mono ${modeBadge.className}`}
          >
            <ModeIcon className="w-4 h-4 mr-1.5" />
            {modeBadge.label}
          </span>
        </div>
      </div>

      {/* Initial Loading State */}
      {loading24h && !horizon24hData && (
        <LoadingState
          size="lg"
          message="Executing microgrid linear programming optimization..."
          className="py-20"
        />
      )}

      {/* Initial Error State with Retry */}
      {error24h && !horizon24hData && (
        <ErrorState
          title="Dispatch Optimization Error"
          error={error24h}
          onRetry={retry24HourDispatch}
          isRetrying={loading24h}
          className="my-6"
        />
      )}

      {/* Live Dispatch Dashboard (Rendered when 24h data is available) */}
      {horizon24hData && (
        <div className="space-y-6">
          {/* Controls Panel */}
          <DispatchControls
            onGenerate24h={() => generate24HourDispatch()}
            onGenerateNextHour={() => generateNextHourDispatch()}
            selectedMode={selectedMode}
            onSelectMode={setOptimizationMode}
            loading24h={loading24h}
            loadingNextHour={loadingNextHour}
            horizon24hData={horizon24hData}
          />

          {/* Derived Operational KPIs Summary & Next-Hour Banner */}
          <DispatchSummary
            horizon24hData={horizon24hData}
            nextHourData={nextHourData}
            nextHourError={errorNextHour}
            onRetryNextHour={retryNextHourDispatch}
            loadingNextHour={loadingNextHour}
          />

          {/* 24-Hour Horizon Multi-Asset Stacked Energy Allocation Chart */}
          <DispatchChart
            hourlySteps={horizon24hData.hourly_steps}
            latencyMs={horizon24hData.latency_ms}
          />

          {/* Secondary Analytical Grid: Battery SoC Trajectory & Energy Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <DispatchBatteryTrajectory
                socTrajectory={horizon24hData.battery_soc_trajectory}
                startingSoc={horizon24hData.daily_summary.starting_battery_soc}
                endingSoc={horizon24hData.daily_summary.ending_battery_soc}
                hourlySteps={horizon24hData.hourly_steps}
              />
            </div>

            <div className="lg:col-span-5">
              <DispatchEnergyMix summary={horizon24hData.daily_summary} />
            </div>
          </div>

          {/* Chronological 24-Hour Dispatch Schedule Breakdown Table */}
          <DispatchTable hourlySteps={horizon24hData.hourly_steps} />

          {/* Educational Solver Mechanics & Constraint Physics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-2.5">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit border border-emerald-200">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Multi-Objective Presets</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                PuLP LP engine supports Economy (lowest $), Green (lowest CO₂), and Balanced modes combining normalized dimensionless trade-offs.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-2.5">
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 w-fit border border-emerald-200">
                <BatteryCharging className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Battery Physical Bounds</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                Guarantees 20% minimum safety reserve floor, 95% charge ceiling, 95% one-way inverter efficiency, and 60 kW maximum power limit.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-gray-200 shadow-card space-y-2.5">
              <div className="p-2.5 rounded-lg bg-rose-50 text-rose-600 w-fit border border-rose-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-900">Unmet Demand Penalty</h4>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed font-medium">
                Slack decision variables heavily penalize any unserved electricity load ($1000\times$) ensuring total load balancing whenever physical generation exists.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchPage;
