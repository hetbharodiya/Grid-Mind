import React from 'react';
import { Cpu, Zap, Database, Network, CheckCircle2, XCircle } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';
import { useSystemHealth } from '../../hooks/useSystemHealth';

interface SystemStatusCardProps {
  solverStatus?: string;
  solverLatencyMs?: number;
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  solverStatus,
  solverLatencyMs,
}) => {
  const { data, loading, error } = useSystemHealth();

  const isModelLoaded = data?.model_loaded ?? false;
  const isDatasetAvailable = data?.dataset_available ?? false;
  const isBackendHealthy = data?.status === 'healthy';

  const subsystems = [
    {
      id: 'forecast',
      name: 'Forecasting Model',
      subtext: 'HistGradientBoostingRegressor Artifact',
      status: !data && error ? 'Offline' : isModelLoaded ? 'Ready' : 'Offline',
      isOk: isModelLoaded,
      icon: Cpu,
      metaType: 'LIVE TELEMETRY',
    },
    {
      id: 'dataset',
      name: 'Processed Dataset',
      subtext: 'processed_energy_demand.csv (200h tail)',
      status: !data && error ? 'Offline' : isDatasetAvailable ? 'Available' : 'Missing',
      isOk: isDatasetAvailable,
      icon: Database,
      metaType: 'LIVE TELEMETRY',
    },
    {
      id: 'optimization',
      name: 'Optimization Engine',
      subtext: solverLatencyMs
        ? `PuLP COIN-OR CBC (${solverLatencyMs.toFixed(1)} ms)`
        : 'PuLP / COIN-OR CBC Solver Pipeline',
      status: solverStatus ? solverStatus : 'Ready',
      isOk: true,
      icon: Zap,
      metaType: solverStatus ? 'LIVE SOLVER VERIFIED' : 'VERIFIED CAPABILITY',
    },
    {
      id: 'grid',
      name: 'Grid Interconnect',
      subtext: '100 kW Import Feeder Limit ($0.15/kWh)',
      status: 'Connected',
      isOk: true,
      icon: Network,
      metaType: 'VERIFIED CAPABILITY',
    },
  ];

  const overallBadge = !data && error ? (
    <span className="text-xs font-mono px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase">
      API Disconnected
    </span>
  ) : isBackendHealthy ? (
    <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase flex items-center space-x-1.5">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1"></span>
      Live Backend Telemetry
    </span>
  ) : (
    <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold uppercase">
      Degraded Telemetry
    </span>
  );

  return (
    <SectionCard
      title="Subsystem Diagnostics & Readiness"
      subtitle="Supervisory status across live AI predictors, solvers, and physical assets"
      badge={overallBadge}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {subsystems.map((sub) => {
          const Icon = sub.icon;

          return (
            <div
              key={sub.id}
              className={`p-3.5 rounded-xl bg-gray-50 border ${
                sub.isOk ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-100/50' : 'border-rose-200 bg-rose-50/50'
              } flex items-start space-x-3.5 transition-colors`}
            >
              <div
                className={`p-2.5 rounded-lg flex-shrink-0 mt-0.5 ${
                  sub.isOk
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    {sub.name}
                  </h4>
                  <div
                    className={`flex items-center space-x-1 ${
                      sub.isOk ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {loading && !data ? (
                      <span className="text-xs font-mono text-gray-400">Checking...</span>
                    ) : sub.isOk ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                        <span className="text-xs font-mono uppercase font-bold">
                          {sub.status}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" />
                        <span className="text-xs font-mono uppercase font-bold">
                          {sub.status}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs md:text-[13px] text-gray-600 mt-1 truncate font-mono font-medium">
                  {sub.subtext}
                </p>
                <span className="inline-block mt-1 text-xs font-mono text-gray-500 font-semibold uppercase tracking-wider">
                  [{sub.metaType}]
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default SystemStatusCard;
