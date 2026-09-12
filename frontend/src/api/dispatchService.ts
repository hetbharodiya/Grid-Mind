/**
 * Microgrid Dispatch Optimization API Services.
 * Connects to:
 * - POST /dispatch/next-hour
 * - POST /dispatch/24h
 */

import apiClient from './client';
import {
  NextHourDispatchRequest,
  NextHourDispatchResponse,
  Horizon24hDispatchRequest,
  Horizon24hDispatchResponse,
} from '../types/dispatch';

/**
 * Execute live single-hour AI forecast and optimal microgrid energy dispatch.
 */
export async function getNextHourDispatch(
  payload?: NextHourDispatchRequest
): Promise<NextHourDispatchResponse> {
  const response = await apiClient.post<NextHourDispatchResponse>(
    '/dispatch/next-hour',
    payload || {}
  );
  return response.data;
}

/**
 * Execute 24-hour forward forecast and sequential microgrid dispatch simulation.
 */
export async function get24HourDispatch(
  payload?: Horizon24hDispatchRequest
): Promise<Horizon24hDispatchResponse> {
  const response = await apiClient.post<Horizon24hDispatchResponse>(
    '/dispatch/24h',
    payload || {}
  );
  return response.data;
}
