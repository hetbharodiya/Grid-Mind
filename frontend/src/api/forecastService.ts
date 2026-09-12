/**
 * Demand Forecasting API Services.
 * Connects to:
 * - POST /forecast/next-hour
 * - POST /forecast/24h
 */

import apiClient from './client';
import {
  NextHourForecastRequest,
  NextHourForecastResponse,
  Horizon24hForecastRequest,
  Horizon24hForecastResponse,
} from '../types/forecast';

/**
 * Request single-step forward electricity demand forecast for the next hour.
 */
export async function getNextHourForecast(
  payload?: NextHourForecastRequest
): Promise<NextHourForecastResponse> {
  const response = await apiClient.post<NextHourForecastResponse>(
    '/forecast/next-hour',
    payload || {}
  );
  return response.data;
}

/**
 * Request multi-step 24-hour forward electricity demand forecast trajectory.
 */
export async function get24HourForecast(
  payload?: Horizon24hForecastRequest
): Promise<Horizon24hForecastResponse> {
  const response = await apiClient.post<Horizon24hForecastResponse>(
    '/forecast/24h',
    payload || {}
  );
  return response.data;
}
