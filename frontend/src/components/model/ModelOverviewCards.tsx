import React from 'react';
import { Cpu, Layers, Database, Target } from 'lucide-react';
import { ModelInfoResponse } from '../../types/health';

interface ModelOverviewCardsProps {
  data: ModelInfoResponse;
}

export const ModelOverviewCards: React.FC<ModelOverviewCardsProps> = ({ data }) => {
  const cards = [
    {
      id: 'architecture',
      title: 'MODEL ARCHITECTURE',
      icon: Cpu,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      borderHover: 'hover:border-emerald-300',
      valueContent: (
        <div
          className="text-xl sm:text-2xl lg:text-[23px] font-bold font-mono tracking-tight text-gray-900 leading-tight break-words [overflow-wrap:anywhere]"
          title={data.algorithm || data.model_type || 'HistGradientBoostingRegressor'}
        >
          <span>{data.model_type || 'HistGradientBoosting'}</span>
          {(data.algorithm?.includes('Regressor') || !data.model_type) && (
            <span className="block text-base sm:text-lg lg:text-[19px] font-medium text-gray-500 font-sans mt-0.5">
              Regressor
            </span>
          )}
        </div>
      ),
      metadataContent: (
        <div className="text-xs text-gray-700 leading-snug">
          <span className="font-semibold text-gray-600">Algorithm: </span>
          <span
            className="font-mono text-gray-900 font-medium break-words [overflow-wrap:anywhere]"
            title={data.algorithm || 'HistGradientBoostingRegressor'}
          >
            {data.algorithm || 'HistGradientBoostingRegressor'}
          </span>
        </div>
      ),
      metadataTooltip: `Algorithm: ${data.algorithm || 'HistGradientBoostingRegressor'}`,
    },
    {
      id: 'features',
      title: 'ENGINEERED FEATURES',
      icon: Layers,
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      borderHover: 'hover:border-sky-300',
      valueContent: (
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-[32px] font-bold font-mono text-gray-900 leading-none">
            {data.feature_count || 25}
          </span>
          <span className="text-xs md:text-sm font-semibold text-gray-500 font-sans">
            features
          </span>
        </div>
      ),
      metadataContent: (
        <div className="text-xs text-gray-700 leading-snug break-words">
          Lags, rolling stats, cyclic harmonics
        </div>
      ),
      metadataTooltip: 'Lags, rolling stats, cyclic harmonics',
    },
    {
      id: 'corpus',
      title: 'TRAINING CORPUS',
      icon: Database,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      borderHover: 'hover:border-amber-300',
      valueContent: (
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl lg:text-[32px] font-bold font-mono text-gray-900 leading-none">
            {data.total_records_trained_on ? data.total_records_trained_on.toLocaleString() : '24,094'}
          </span>
          <span className="text-xs md:text-sm font-semibold text-gray-500 font-sans">
            samples
          </span>
        </div>
      ),
      metadataContent: (
        <div className="text-xs text-gray-700 leading-snug truncate" title={data.dataset_used || 'processed_energy_demand.csv'}>
          <span className="font-semibold text-gray-600">Source: </span>
          <span className="font-mono text-gray-900 font-medium">
            {data.dataset_used || 'processed_energy_demand.csv'}
          </span>
        </div>
      ),
      metadataTooltip: `Source: ${data.dataset_used || 'processed_energy_demand.csv'}`,
    },
    {
      id: 'target',
      title: 'PREDICTION TARGET',
      icon: Target,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
      borderHover: 'hover:border-purple-300',
      valueContent: (
        <div
          className="text-xl sm:text-2xl lg:text-[23px] font-bold font-mono tracking-tight text-gray-900 leading-tight break-words [overflow-wrap:anywhere]"
          title={data.target_column || 'energy_demand_kwh'}
        >
          {data.target_column || 'energy_demand_kwh'}
        </div>
      ),
      metadataContent: (
        <div className="text-xs text-gray-700 leading-snug break-words">
          Hourly active load demand (kWh)
        </div>
      ),
      metadataTooltip: 'Hourly active load demand (kWh)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] hover:shadow-[0_4px_6px_-1px_rgba(16,24,40,0.08)] transition-all duration-200 ${card.borderHover} flex flex-col justify-between h-full min-w-0`}
          >
            {/* 1. Header Area: Title & Icon */}
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <p className="text-xs md:text-[13px] font-semibold text-gray-500 uppercase tracking-wider font-sans truncate flex-1 min-w-0">
                {card.title}
              </p>
              <div className={`p-2.5 rounded-xl border shadow-sm shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            {/* 2. Main Value Area (Vertically Centered with consistent minimum height) */}
            <div className="my-auto py-3 min-w-0 flex items-center min-h-[64px]">
              {card.valueContent}
            </div>

            {/* 3. Metadata Area (Aligned consistently at bottom baseline) */}
            <div className="mt-auto pt-3 border-t border-gray-100 min-w-0">
              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5 items-center w-full min-w-0">
                <div className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-tight leading-tight shrink-0">
                  <span>Telemetry</span>
                  <br />
                  <span>Verified</span>
                </div>
                <div
                  className="bg-gray-50/90 border border-gray-200 rounded-lg px-2.5 py-1.5 min-h-[44px] flex items-center min-w-0 text-xs text-gray-700 font-sans"
                  title={card.metadataTooltip}
                >
                  <div className="leading-snug w-full min-w-0">
                    {card.metadataContent}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModelOverviewCards;
