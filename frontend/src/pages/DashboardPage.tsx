import React from 'react';
import { useOperationsDashboard } from '../hooks/useOperationsDashboard';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { OperationsKPIs } from '../components/dashboard/OperationsKPIs';
import { DemandOutlookCard } from '../components/dashboard/DemandOutlookCard';
import { DispatchAllocationCard } from '../components/dashboard/DispatchAllocationCard';
import { BatteryDynamicsCard } from '../components/dashboard/BatteryDynamicsCard';
import { EnergyMixCard } from '../components/dashboard/EnergyMixCard';
import { LiveEnergySourceGrid } from '../components/dashboard/LiveEnergySourceGrid';
import { SystemStatusCard } from '../components/dashboard/SystemStatusCard';
import { OperationsEventStream } from '../components/dashboard/OperationsEventStream';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const DashboardPage: React.FC = () => {
  const { data: healthData, refresh: refreshHealth } = useSystemHealth();
  const {
    horizon24hData,
    nextHourData,
    loading,
    isRefreshing,
    error24h,
    errorNextHour,
    refresh: refreshOperations,
    retry24Hour,
    retryNextHour,
  } = useOperationsDashboard();

  const handleRefreshAll = async () => {
    await Promise.allSettled([refreshOperations(), refreshHealth()]);
  };

  const dailySummary = horizon24hData?.daily_summary || null;
  const activeMode = dailySummary
    ? `${dailySummary.optimization_mode.charAt(0).toUpperCase() + dailySummary.optimization_mode.slice(1)} Mode`
    : 'Balanced Mode';

  const solverStatus = horizon24hData?.hourly_steps[0]?.solver_status || 'Optimal';

  return (
    <div className="space-y-6">
      {/* 1. Header Section with Supervisory Status & Refresh Control */}
      <DashboardHeader
        title="System Operations Center"
        subtitle="Real-time supervisory telemetry, forward load intelligence, and autonomous microgrid dispatch"
        mode={activeMode}
        solverStatus={solverStatus}
        isModelReady={healthData?.model_loaded ?? true}
        isBackendConnected={healthData?.status === 'healthy'}
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
      />

      {/* 2. Initial Full Loading State */}
      {loading && !horizon24hData && (
        <LoadingState
          size="lg"
          message="Aggregating microgrid telemetry and solving optimal dispatch..."
          className="py-20"
        />
      )}

      {/* 3. Initial Full Failure State with Retry */}
      {error24h && !horizon24hData && (
        <ErrorState
          title="System Operations Communication Error"
          error={error24h}
          onRetry={retry24Hour}
          isRetrying={loading}
          className="my-6"
        />
      )}

      {/* 4. Live Operational Command Center (Rendered when 24h data is available) */}
      {horizon24hData && (
        <div className="space-y-6">
          {/* Top-Level Executive KPI Grid */}
          <OperationsKPIs
            nextHourData={nextHourData}
            dailySummary={dailySummary}
            nextHourError={errorNextHour}
            onRetryNextHour={retryNextHour}
          />

          {/* Live 24-Hour Operations Horizon (Dual Visualization Canvas) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DemandOutlookCard hourlySteps={horizon24hData.hourly_steps} />
            <DispatchAllocationCard hourlySteps={horizon24hData.hourly_steps} />
          </div>

          {/* Asset Generation & Storage Dynamics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <BatteryDynamicsCard
                socTrajectory={horizon24hData.battery_soc_trajectory}
                startingSoc={horizon24hData.daily_summary.starting_battery_soc}
                endingSoc={horizon24hData.daily_summary.ending_battery_soc}
                totalBatteryUsedKwh={horizon24hData.daily_summary.total_battery_used_kwh}
                hourlySteps={horizon24hData.hourly_steps}
              />
            </div>

            <div className="lg:col-span-5">
              <EnergyMixCard summary={horizon24hData.daily_summary} />
            </div>
          </div>

          {/* 5 Physical Asset Generation & Storage Supply Cards */}
          <LiveEnergySourceGrid summary={horizon24hData.daily_summary} />

          {/* Supervisory Intelligence & Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemStatusCard
              solverStatus={solverStatus}
              solverLatencyMs={horizon24hData.latency_ms}
            />
            <OperationsEventStream
              dailySummary={horizon24hData.daily_summary}
              hourlySteps={horizon24hData.hourly_steps}
              latencyMs={horizon24hData.latency_ms}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
