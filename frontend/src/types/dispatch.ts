/**
 * Microgrid Dispatch Optimization TypeScript Contracts.
 * Exactly maps to backend/app/schemas/api.py and domain models in app.optimization / app.integration:
 * BatteryState, CostConfig, CarbonConfig, OptimizationWeights, OptimizationResult,
 * HourlyDispatchStep, DailyDispatchSummary, NextHourDispatchRequest/Response, Horizon24hDispatchRequest/Response.
 */

import { HistoricalDataPoint } from './forecast';

export enum OptimizationMode {
  ECONOMY = 'economy',
  GREEN = 'green',
  BALANCED = 'balanced',
}

export interface BatteryState {
  capacity_kwh?: number;
  current_soc?: number;
  minimum_soc?: number;
  discharge_efficiency?: number;
  maximum_discharge_kw?: number;
}

export interface CostConfig {
  solar?: number;
  wind?: number;
  battery?: number;
  grid?: number;
  diesel?: number;
}

export interface CarbonConfig {
  solar?: number;
  wind?: number;
  battery?: number;
  grid?: number;
  diesel?: number;
}

export interface OptimizationWeights {
  cost_weight?: number;
  carbon_weight?: number;
}

export interface EnergyAllocation {
  solar_used_kwh: number;
  wind_used_kwh: number;
  battery_used_kwh: number;
  grid_used_kwh: number;
  diesel_used_kwh: number;
}

export interface OptimizationResult {
  allocations: EnergyAllocation;
  demand_kwh: number;
  total_supplied_kwh: number;
  unmet_demand_kwh: number;
  is_demand_fully_met: boolean;
  unused_solar_kwh: number;
  unused_wind_kwh: number;
  total_unused_renewable_kwh: number;
  total_cost_usd: number;
  total_carbon_kg: number;
  normalized_cost_score?: number | null;
  normalized_carbon_score?: number | null;
  solver_status: string;
  objective_value: number;
  mode_applied: OptimizationMode;
  solve_time_ms: number;
}

export interface ForecastInfo {
  predicted_demand_kwh: number;
  forecast_timestamp: string;
  horizon_step: number;
  hour: number;
  day_of_week: number;
  model_type: string;
}

export interface HourlyAssetAvailability {
  hour_number: number;
  solar_available_kwh?: number;
  wind_available_kwh?: number;
  grid_available_kwh?: number;
  diesel_available_kwh?: number;
}

export interface HourlyDispatchStep {
  hour_number: number;
  timestamp: string;
  predicted_demand_kwh: number;
  solar_used_kwh: number;
  wind_used_kwh: number;
  battery_used_kwh: number;
  grid_used_kwh: number;
  diesel_used_kwh: number;
  unmet_demand_kwh: number;
  battery_soc_after_dispatch: number;
  hourly_cost_usd: number;
  hourly_carbon_kg: number;
  solver_status: string;
}

export interface DailyDispatchSummary {
  total_predicted_demand_kwh: number;
  total_supplied_energy_kwh: number;
  total_solar_used_kwh: number;
  total_wind_used_kwh: number;
  total_battery_used_kwh: number;
  total_grid_used_kwh: number;
  total_diesel_used_kwh: number;
  total_unmet_demand_kwh: number;
  total_operational_cost_usd: number;
  total_carbon_emissions_kg: number;
  starting_battery_soc: number;
  ending_battery_soc: number;
  average_clean_energy_percentage: number;
  optimization_mode: OptimizationMode;
}

export interface NextHourDispatchRequest {
  historical_data?: HistoricalDataPoint[] | null;
  solar_available_kwh?: number;
  wind_available_kwh?: number;
  battery?: BatteryState;
  grid_available_kwh?: number;
  diesel_available_kwh?: number;
  mode?: OptimizationMode;
  costs?: CostConfig;
  carbon?: CarbonConfig;
  weights?: OptimizationWeights;
}

export interface NextHourDispatchResponse {
  forecast: ForecastInfo;
  optimization: OptimizationResult;
  clean_energy_percentage: number;
  history_source: string;
  history_records_used: number;
  latency_ms: number;
}

export interface Horizon24hDispatchRequest {
  historical_data?: HistoricalDataPoint[] | null;
  battery?: BatteryState;
  mode?: OptimizationMode;
  costs?: CostConfig;
  carbon?: CarbonConfig;
  weights?: OptimizationWeights;
  hourly_availability?: HourlyAssetAvailability[] | null;
  solar_profile_kwh?: number[] | null;
  wind_profile_kwh?: number[] | null;
  grid_available_kwh?: number;
  diesel_available_kwh?: number;
}

export interface Horizon24hDispatchResponse {
  hourly_steps: HourlyDispatchStep[];
  daily_summary: DailyDispatchSummary;
  battery_soc_trajectory: number[];
  history_source: string;
  history_records_used: number;
  latency_ms: number;
}
