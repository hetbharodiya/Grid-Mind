import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Sparkles, AlertCircle, Info } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';

interface FeatureImportanceCardProps {
  importances: Record<string, number> | null | undefined;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      feature: string;
      score: number;
      relativePct: number;
    };
  }>;
}

const CustomImportanceTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg font-sans text-sm text-gray-900 space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <span className="font-bold text-emerald-700">{data.feature}</span>
        <span className="text-xs text-gray-500 px-2 py-0.5 rounded bg-gray-100 font-medium">
          Ranked Feature
        </span>
      </div>

      <div className="space-y-1.5 text-gray-600 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Importance Score:</span>
          <span className="font-bold text-gray-900 font-mono">{data.score.toFixed(4)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium">Relative Weight:</span>
          <span className="font-bold text-emerald-700 font-mono">{data.relativePct.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

const BAR_COLORS = ['#10B981', '#0EA5E9', '#06B6D4', '#6366F1', '#8B5CF6'];

export const FeatureImportanceCard: React.FC<FeatureImportanceCardProps> = ({ importances }) => {
  const chartData = useMemo(() => {
    if (!importances) return [];

    const entries = Object.entries(importances);
    if (entries.length === 0) return [];

    const totalScore = entries.reduce((sum, [, val]) => sum + Math.max(0, val), 0);

    // Sort descending by score, but reverse for vertical layout so top is at the top
    const sorted = [...entries].sort((a, b) => b[1] - a[1]);

    return sorted.map(([feature, score]) => ({
      feature,
      score: Number(score.toFixed(4)),
      relativePct: totalScore > 0 ? (Math.max(0, score) / totalScore) * 100 : 0,
    }));
  }, [importances]);

  // Derive top predictor dynamically
  const dominantFeature = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData[0];
  }, [chartData]);

  if (!importances || chartData.length === 0) {
    return (
      <SectionCard
        title="Top Feature Importances (Model Explainability)"
        subtitle="Permutation importance scores derived from holdout test partition"
      >
        <div className="p-8 text-center text-gray-500 font-sans text-sm flex items-center justify-center space-x-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span>Feature importance telemetry is not available from the current model artifact.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Top Feature Importances (Model Explainability)"
      subtitle="Permutation feature importance scores returned by FastAPI endpoint"
      badge={
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Permutation Importance</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Horizontal Bar Chart */}
        <div className="w-full h-64 pt-1 bg-gray-50/50 rounded-xl border border-gray-200 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[...chartData].reverse()}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.8} horizontal={false} />
              <XAxis
                type="number"
                stroke="#D1D5DB"
                tick={{ fill: '#475467', fontSize: 12, fontWeight: 500, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
                height={26}
              />
              <YAxis
                type="category"
                dataKey="feature"
                stroke="#D1D5DB"
                tick={{ fill: '#475467', fontSize: 12, fontWeight: 500, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
                width={95}
              />
              <Tooltip content={<CustomImportanceTooltip />} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {[...chartData].reverse().map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={BAR_COLORS[idx % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Explainability Narrative */}
        {dominantFeature && (
          <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-gray-900 font-bold font-sans text-sm">
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Operational Explainability Insight:</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
              The primary predictor is{' '}
              <code className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs">
                {dominantFeature.feature}
              </code>
              , contributing{' '}
              <strong className="text-gray-900 font-mono font-bold">
                {dominantFeature.relativePct.toFixed(1)}%
              </strong>{' '}
              of the top feature importance mass. This indicates that immediate autoregressive demand (one step lag)
              acts as the primary baseline signal, while diurnal trigonometric features (
              <code className="text-gray-700 font-mono bg-gray-200/60 px-1.5 py-0.5 rounded text-xs">sin_hour</code>,{' '}
              <code className="text-gray-700 font-mono bg-gray-200/60 px-1.5 py-0.5 rounded text-xs">cos_hour</code>
              ) capture recurrent 24-hour diurnal load cycles.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default FeatureImportanceCard;
