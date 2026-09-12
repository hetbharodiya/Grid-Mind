/**
 * System Health & AI Model Metadata TypeScript Contracts.
 * Exactly maps to backend/app/schemas/api.py: HealthResponse & ModelInfoResponse.
 */

export interface HealthResponse {
  status: string;
  app_name: string;
  version: string;
  model_loaded: boolean;
  dataset_available: boolean;
}

export interface SplitRatios {
  train: number;
  val: number;
  test: number;
}

export interface DateRangeItem {
  start: string;
  end: string;
}

export interface ModelMetrics {
  validation_metrics?: {
    mae: number;
    rmse: number;
    mape_pct: number;
    training_time_sec?: number;
  };
  final_test_metrics?: {
    mae: number;
    rmse: number;
    mape_pct: number;
  };
  baseline_naive_test?: {
    mae: number;
    rmse: number;
    mape_pct: number;
  };
  baseline_seasonal24_test?: {
    mae: number;
    rmse: number;
    mape_pct: number;
  };
  mae_improvement_pct_over_baseline?: number;
  rmse_improvement_pct_over_baseline?: number;
  [key: string]: unknown;
}

export interface ModelInfoResponse {
  model_type: string;
  algorithm: string;
  dataset_used: string;
  target_column: string;
  feature_count: number;
  feature_columns: string[];
  total_records_trained_on: number;
  split_ratios?: SplitRatios | null;
  date_ranges?: Record<string, DateRangeItem> | null;
  metrics?: ModelMetrics | null;
  top_feature_importances?: Record<string, number> | null;
}
