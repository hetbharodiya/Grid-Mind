import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Server, FileCode, Database, Activity } from 'lucide-react';
import { HealthResponse, ModelInfoResponse } from '../../types/health';
import { SectionCard } from '../common/SectionCard';

interface ModelReadinessMatrixProps {
  health: HealthResponse | null;
  modelInfo: ModelInfoResponse | null;
  isOnline: boolean;
}

export const ModelReadinessMatrix: React.FC<ModelReadinessMatrixProps> = ({
  health,
  modelInfo,
  isOnline,
}) => {
  const isGatewayHealthy = isOnline && health?.status === 'healthy';
  const isModelLoaded = Boolean(health?.model_loaded);
  const isDatasetAvailable = Boolean(health?.dataset_available);
  const isMetadataVerified = modelInfo !== null;

  const isInferenceReady = isGatewayHealthy && isModelLoaded && isDatasetAvailable && isMetadataVerified;

  const checks = [
    {
      name: 'API Gateway',
      target: 'GET /api/v1/health',
      isReady: isGatewayHealthy,
      readyText: 'Online (200 OK)',
      notReadyText: 'Disconnected',
      description: 'FastAPI gateway orchestrating microgrid telemetry & dispatch services',
      icon: Server,
    },
    {
      name: 'ML Model Artifact',
      target: modelInfo ? `${modelInfo.model_type}.pkl` : 'Model Artifact',
      isReady: isModelLoaded,
      readyText: 'Loaded & Warmed',
      notReadyText: 'Artifact Missing',
      description: 'Pre-trained regressor resident in server memory for zero-cold-start inference',
      icon: FileCode,
    },
    {
      name: 'Historical Dataset Tail',
      target: modelInfo?.dataset_used || 'processed_energy_demand.csv',
      isReady: isDatasetAvailable,
      readyText: 'Dataset Available',
      notReadyText: 'Unavailable',
      description: 'Historical telemetry stream accessible for autoregressive lag formation',
      icon: Database,
    },
    {
      name: 'Model Metadata Registry',
      target: 'model_metadata.json',
      isReady: isMetadataVerified,
      readyText: 'Telemetry Verified',
      notReadyText: 'Unverified',
      description: 'Validated feature specifications, split ranges, and benchmark metrics loaded',
      icon: Activity,
    },
  ];

  return (
    <SectionCard
      title="Model Operational Readiness Matrix"
      subtitle="Subsystem-level health verification governing forward-looking inference capability"
      badge={
        <div
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-bold border ${
            isInferenceReady
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isInferenceReady ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />}
          <span>{isInferenceReady ? 'Inference Ready' : 'Degraded'}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Overall Status Banner */}
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between font-mono text-xs sm:text-sm ${
            isInferenceReady
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/80 border-amber-200 text-amber-800'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isInferenceReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="font-bold font-sans text-xs sm:text-sm tracking-wide">
              {isInferenceReady
                ? 'INFERENCE PIPELINE FULLY OPERATIONAL'
                : 'INFERENCE SUBSYSTEM STANDBY / PARTIAL'}
            </span>
          </div>
          <span className="text-xs text-gray-600 hidden sm:inline font-sans">
            Deterministic readiness check
          </span>
        </div>

        {/* 4-Point Subsystem Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {checks.map((check) => {
            const Icon = check.icon;
            return (
              <div
                key={check.name}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-gray-900 font-bold font-sans text-sm">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span>{check.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {check.isReady ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span
                      className={`text-xs font-bold ${
                        check.isReady ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {check.isReady ? check.readyText : check.notReadyText}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed">
                  {check.description}
                </p>

                <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                  <span>Target:</span>
                  <code className="text-gray-800 bg-gray-200/60 px-1.5 py-0.5 rounded font-mono text-xs">{check.target}</code>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SectionCard>
  );
};

export default ModelReadinessMatrix;
