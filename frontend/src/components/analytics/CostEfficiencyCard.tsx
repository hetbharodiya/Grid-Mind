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
import { DollarSign, AlertCircle, TrendingUp, Calendar, Zap } from 'lucide-react';
import { HourlyDispatchStep, DailyDispatchSummary } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface CostEfficiencyCardProps {
  hourlySteps: HourlyDispatchStep[];
  summary: DailyDispatchSummary;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      hourNumber: number;
      displayTime: string;
      timestamp: string;
      cost: number;
      demand: number;
    };
  }>;
}

const CustomCostTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm text-gray-900 space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <span className="font-bold text-emerald-700 text-sm">Hour {data.hourNumber} / 24</span>
        <span className="text-xs text-gray-700 px-2 py-0.5 rounded bg-gray-100 font-mono font-semibold">
          {data.displayTime}
        </span>
      </div>

      <div className="space-y-1 text-gray-600 text-xs md:text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
            Time:
          </span>
          <span className="text-gray-700 font-mono font-medium">{data.timestamp}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1 text-sky-600" />
            Demand:
          </span>
          <span className="font-mono text-gray-900 font-bold">{data.demand.toFixed(2)} kWh</span>
        </div>

        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-emerald-700 font-bold flex items-center">
            <DollarSign className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Operating Cost:
          </span>
          <span className="text-sm md:text-base font-bold text-emerald-700 font-mono">
            ${data.cost.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
};

export const CostEfficiencyCard: React.FC<CostEfficiencyCardProps> = ({ hourlySteps, summary }) => {
  const chartData = useMemo(() => {
    return hourlySteps.map((step) => {
      let displayTime = `H${step.hour_number}`;
      if (step.timestamp && step.timestamp.includes('T')) {
        displayTime = step.timestamp.split('T')[1].substring(0, 5);
      }

      return {
        hourNumber: step.hour_number,
        displayTime,
        timestamp: step.timestamp,
        cost: Number(step.hourly_cost_usd.toFixed(4)),
        demand: Number(step.predicted_demand_kwh.toFixed(2)),
      };
    });
  }, [hourlySteps]);

  const costStats = useMemo(() => {
    const totalCost = summary.total_operational_cost_usd || 0;
    const totalSupplied = summary.total_supplied_energy_kwh || 0;

    // Unit cost per delivered kWh
    const unitCost = totalSupplied > 0 ? totalCost / totalSupplied : 0;

    // Average hourly cost across available steps
    const stepCount = hourlySteps.length > 0 ? hourlySteps.length : 1;
    const avgHourlyCost = totalCost / stepCount;

    // Find peak cost hour dynamically
    let peakCost = 0;
    let peakStep = hourlySteps[0] || null;

    for (const step of hourlySteps) {
      if (step.hourly_cost_usd > peakCost) {
        peakCost = step.hourly_cost_usd;
        peakStep = step;
      }
    }

    return {
      totalCost: Number(totalCost.toFixed(2)),
      unitCost: Number(unitCost.toFixed(4)),
      avgHourlyCost: Number(avgHourlyCost.toFixed(4)),
      peakCost: Number(peakCost.toFixed(4)),
      peakHour: peakStep ? peakStep.hour_number : 0,
      peakTimestamp: peakStep ? peakStep.timestamp : 'N/A',
    };
  }, [hourlySteps, summary]);

  if (hourlySteps.length === 0) {
    return (
      <SectionCard
        title="Operational Cost & Financial Analytics"
        subtitle="Financial expenditure dynamics and levelized unit cost of energy"
      >
        <div className="p-8 text-center text-gray-500 font-mono text-sm flex items-center justify-center space-x-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span>Cost telemetry is currently unavailable.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Operational Cost & Financial Efficiency"
      subtitle="Hourly financial expenditure profile and levelized unit cost delivered by PuLP optimization"
      badge={
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold uppercase">
          <DollarSign className="w-3.5 h-3.5" />
          <span>${costStats.unitCost}/kWh Unit Cost</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Cost Telemetry Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* Total Cost */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total 24h Cost</span>
            <p className="text-lg font-bold text-emerald-700">${costStats.totalCost}</p>
            <p className="text-xs text-gray-500 font-sans font-medium">Total microgrid spend</p>
          </div>

          {/* Unit Cost */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Levelized Unit Cost</span>
            <p className="text-lg font-bold text-gray-900">${costStats.unitCost}</p>
            <p className="text-xs text-gray-500 font-sans font-medium">USD per delivered kWh</p>
          </div>

          {/* Average Hourly Cost */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Hourly Cost</span>
            <p className="text-lg font-bold text-gray-900">${costStats.avgHourlyCost}</p>
            <p className="text-xs text-gray-500 font-sans font-medium">Per 60-min interval</p>
          </div>

          {/* Peak Cost Hour */}
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 space-y-1">
            <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider">
              <span>Peak Cost Hour</span>
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-amber-700">${costStats.peakCost}</p>
            <p className="text-xs text-gray-500 truncate font-medium" title={costStats.peakTimestamp}>
              H{costStats.peakHour} ({costStats.peakTimestamp.split('T')[1]?.substring(0, 5) || costStats.peakTimestamp})
            </p>
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-60 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.8} vertical={false} />

              <XAxis
                dataKey="displayTime"
                stroke="#9CA3AF"
                tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
                height={26}
              />

              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickFormatter={(val) => `$${val}`}
                width={65}
              />

              <Tooltip content={<CustomCostTooltip />} />

              <Bar dataKey="cost" name="Hourly Cost ($)" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, idx) => (
                  <Cell
                    key={`cost-cell-${idx}`}
                    fill={entry.cost === costStats.peakCost && costStats.peakCost > 0 ? '#F59E0B' : '#10B981'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
};

export default CostEfficiencyCard;
