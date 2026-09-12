import React from 'react';
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Database, Zap } from 'lucide-react';
import { ModelInfoResponse } from '../../types/health';

interface ModelHeaderProps {
  data: ModelInfoResponse | null;
  isBackendConnected: boolean;
  isModelLoaded: boolean;
  isDatasetAvailable: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const ModelHeader: React.FC<ModelHeaderProps> = ({
  data,
  isBackendConnected,
  isModelLoaded,
  isDatasetAvailable,
  onRefresh,
  isRefreshing,
}) => {
  const isInferenceReady = isBackendConnected && isModelLoaded && isDatasetAvailable && data !== null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm hover:shadow transition-all duration-200 space-y-4 w-full min-w-0">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        {/* Title & Subtitle */}
        <div className="flex items-start sm:items-center space-x-3.5 min-w-0 flex-1">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
            <Cpu className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 font-sans">
                AI Model Intelligence & Explainability
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wide shrink-0 whitespace-nowrap">
                SCADA ML Layer
              </span>
            </div>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed font-sans">
              Model telemetry, chronological validation benchmarks, feature explainability & inference readiness
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center shrink-0 self-start lg:self-center">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-sm font-semibold transition-all duration-200 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow active:scale-[0.98] whitespace-nowrap"
            title="Re-fetch live ML model telemetry and evaluation benchmarks"
          >
            <RefreshCw className={`w-4 h-4 mr-2 shrink-0 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-gray-500'}`} />
            <span>{isRefreshing ? 'Refreshing Telemetry...' : 'Refresh Model Info'}</span>
          </button>
        </div>
      </div>

      {/* Live Operational Status Ribbon */}
      <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs md:text-sm font-mono min-w-0">
        {/* Gateway Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[36px] ${
            isBackendConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          <span className={`w-2 h-2 rounded-full shrink-0 ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className="whitespace-nowrap">Gateway: {isBackendConnected ? 'Connected (8000)' : 'Disconnected'}</span>
        </div>

        {/* Model Artifact Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[36px] max-w-full ${
            isModelLoaded
              ? 'bg-sky-50 text-sky-700 border-sky-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={`Artifact: ${isModelLoaded ? data?.algorithm || data?.model_type || 'HistGradientBoostingRegressor' : 'Unloaded'}`}
        >
          {isModelLoaded ? <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
          <span className="truncate max-w-[240px] sm:max-w-[280px]">
            Artifact: {isModelLoaded ? data?.algorithm || data?.model_type || 'HistGradientBoostingRegressor' : 'Unloaded'}
          </span>
        </div>

        {/* Dataset Availability Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[36px] max-w-full ${
            isDatasetAvailable
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={`Dataset: ${isDatasetAvailable ? data?.dataset_used || 'processed_energy_demand.csv' : 'Unavailable'}`}
        >
          <Database className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="truncate max-w-[240px] sm:max-w-[280px]">
            Dataset: {isDatasetAvailable ? data?.dataset_used || 'processed_energy_demand.csv' : 'Unavailable'}
          </span>
        </div>

        {/* Inference Readiness Badge */}
        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold min-h-[36px] ${
            isInferenceReady
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
              : 'bg-gray-100 text-gray-600 border-gray-200'
          }`}
        >
          {isInferenceReady ? <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" /> : <Zap className="w-4 h-4 text-gray-500 shrink-0" />}
          <span className="whitespace-nowrap">Inference: {isInferenceReady ? 'Online & Operational' : 'Standby'}</span>
        </div>
      </div>
    </div>
  );
};

export default ModelHeader;
