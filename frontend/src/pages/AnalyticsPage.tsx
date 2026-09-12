import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import {
  AnalyticsHeader,
  AnalyticsOverviewCards,
  DemandAnalyticsCard,
  CostEfficiencyCard,
  BatteryUtilizationCard,
  SustainabilityCarbonCard,
  OperationalInsightsCard,
} from '../components/analytics';

export const AnalyticsPage: React.FC = () => {
  const { data, loading, error, refresh, isRefreshing } = useAnalytics();
  const { data: healthData, error: healthError, refresh: refreshHealth } = useSystemHealth();

  const isOnline = Boolean(healthData && !healthError);

  const handleRefreshAll = async () => {
    await Promise.allSettled([refresh(), refreshHealth()]);
  };

  // 1. Initial Page Load
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="pb-3 border-b border-gray-200">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Microgrid Analytics & Sustainability Intelligence
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed">
            Synthesizing microgrid operational analytics and cost intelligence...
          </p>
        </div>
        <LoadingState
          message="Synthesizing microgrid operational analytics and cost intelligence..."
          size="lg"
        />
      </div>
    );
  }

  // 2. Full Error State (API Failure or Backend Offline)
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="pb-3 border-b border-gray-200">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Microgrid Analytics & Sustainability Intelligence
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed">
            System-wide operational analytics and sustainability intelligence
          </p>
        </div>
        <ErrorState
          title="Unable to Load Microgrid Analytics"
          error={error}
          onRetry={handleRefreshAll}
          isRetrying={isRefreshing}
        />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { hourly_steps, daily_summary, battery_soc_trajectory } = data;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. SCADA Header with live status and refresh controls */}
      <AnalyticsHeader
        optimizationMode={daily_summary?.optimization_mode}
        isBackendConnected={isOnline}
        onRefresh={handleRefreshAll}
        isRefreshing={isRefreshing}
      />

      {/* 2. Overview KPI Cards */}
      <AnalyticsOverviewCards summary={daily_summary} />

      {/* 3. Two-Column Grid: Demand vs. Cost Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemandAnalyticsCard hourlySteps={hourly_steps || []} summary={daily_summary} />
        <CostEfficiencyCard hourlySteps={hourly_steps || []} summary={daily_summary} />
      </div>

      {/* 4. Two-Column Grid: Storage Dynamics vs. Sustainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BatteryUtilizationCard
          socTrajectory={battery_soc_trajectory || []}
          summary={daily_summary}
        />
        <SustainabilityCarbonCard
          summary={daily_summary}
          hourlySteps={hourly_steps || []}
        />
      </div>

      {/* 5. Full Width: Deterministic Operational Insights */}
      <OperationalInsightsCard
        summary={daily_summary}
        hourlySteps={hourly_steps || []}
        socTrajectory={battery_soc_trajectory || []}
      />
    </div>
  );
};

export default AnalyticsPage;
