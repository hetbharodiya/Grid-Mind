import React from 'react';
import { useModelInfo } from '../hooks/useModelInfo';
import { useSystemHealth } from '../hooks/useSystemHealth';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import {
  ModelHeader,
  ModelOverviewCards,
  ModelPerformanceAnalytics,
  FeatureImportanceCard,
  FeatureInventoryCard,
  TrainingDatasetCard,
  ModelReadinessMatrix,
} from '../components/model';

export const ModelPage: React.FC = () => {
  const { data, loading, error, refresh, isRetrying } = useModelInfo();
  const { data: healthData, error: healthError, refresh: refreshHealth } = useSystemHealth();

  const isOnline = Boolean(healthData && !healthError);

  const handleRefreshAll = async () => {
    await Promise.allSettled([refresh(), refreshHealth()]);
  };

  // 1. Initial Loading State
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="pb-3 border-b border-gray-200">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-sans">
            AI Model Intelligence & Explainability
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed font-sans">
            Aggregating machine learning model telemetry and evaluation benchmarks...
          </p>
        </div>
        <LoadingState
          message="Connecting to GridMind AI model intelligence service..."
          size="lg"
        />
      </div>
    );
  }

  // 2. Full Error State (Backend Offline or Endpoint Failure)
  if (error && !data) {
    return (
      <div className="space-y-6">
        <div className="pb-3 border-b border-gray-200">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-sans">
            AI Model Intelligence & Explainability
          </h2>
          <p className="text-sm md:text-base text-gray-600 mt-1.5 leading-relaxed font-sans">
            Forecasting model specifications and evaluation telemetry
          </p>
        </div>
        <ErrorState
          title="Unable to Load AI Model Intelligence"
          error={error}
          onRetry={handleRefreshAll}
          isRetrying={isRetrying}
        />
      </div>
    );
  }

  // Fallback guard if data is somehow null
  if (!data) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12 min-w-0">
      {/* 1. SCADA Header with live operational status ribbon & non-destructive refresh */}
      <ModelHeader
        data={data}
        isBackendConnected={isOnline}
        isModelLoaded={Boolean(healthData?.model_loaded)}
        isDatasetAvailable={Boolean(healthData?.dataset_available)}
        onRefresh={handleRefreshAll}
        isRefreshing={isRetrying}
      />

      {/* 2. Model Overview KPI Cards */}
      <ModelOverviewCards data={data} />

      {/* 3. Empirical Performance Analytics & Benchmark Comparison Chart */}
      <ModelPerformanceAnalytics metrics={data.metrics} />

      {/* 4. Feature Intelligence & Feature Inventory (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0 w-full">
        <FeatureImportanceCard importances={data.top_feature_importances} />
        <FeatureInventoryCard featureColumns={data.feature_columns || []} />
      </div>

      {/* 5. Dataset Chronological Partitions & Subsystem Readiness Matrix (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0 w-full">
        <TrainingDatasetCard
          datasetUsed={data.dataset_used}
          totalRecords={data.total_records_trained_on}
          splitRatios={data.split_ratios}
          dateRanges={data.date_ranges}
        />
        <ModelReadinessMatrix
          health={healthData}
          modelInfo={data}
          isOnline={isOnline}
        />
      </div>
    </div>
  );
};

export default ModelPage;
