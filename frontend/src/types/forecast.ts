/**
 * Demand Forecasting TypeScript Contracts.
 * Exactly maps to backend/app/schemas/api.py:
 * HistoricalDataPoint, ForecastStepItem, NextHourForecastRequest/Response, Horizon24hForecastRequest/Response.
 */

export interface HistoricalDataPoint {
  timestamp: string;
  energy_demand_kwh: number;
}

export interface ForecastStepItem {
  step: number;
  timestamp: string;
  hour: number;
  day_of_week: number;
  predicted_demand_kwh: number;
}

export interface NextHourForecastRequest {
  historical_data?: HistoricalDataPoint[] | null;
}

export interface NextHourForecastResponse {
  predicted_demand_kwh: number;
  forecast_timestamp: string;
  hour: number;
  day_of_week: number;
  model_type: string;
  history_source: string;
  history_records_used: number;
  latency_ms: number;
}

export interface Horizon24hForecastRequest {
  historical_data?: HistoricalDataPoint[] | null;
}

export interface Horizon24hForecastResponse {
  horizon_hours: number;
  forecasts: ForecastStepItem[];
  total_predicted_demand_kwh: number;
  history_source: string;
  history_records_used: number;
  latency_ms: number;
}
