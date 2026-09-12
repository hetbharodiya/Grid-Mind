/**
 * Health & Model Metadata API Services.
 * Connects to:
 * - GET /health
 * - GET /model/info
 */

import apiClient from './client';
import { HealthResponse, ModelInfoResponse } from '../types/health';

/**
 * Retrieve current microgrid system and AI service health diagnostics.
 */
export async function getSystemHealth(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
}

/**
 * Retrieve verified forecasting model metadata, architecture, and feature importances.
 */
export async function getModelInfo(): Promise<ModelInfoResponse> {
  const response = await apiClient.get<ModelInfoResponse>('/model/info');
  return response.data;
}
