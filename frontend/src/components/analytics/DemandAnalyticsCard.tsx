import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, AlertCircle, Calendar, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { HourlyDispatchStep, DailyDispatchSummary } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface DemandAnalyticsCardProps {
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
      demand: number;
    };
  }>;
}

const CustomDemandTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm text-gray-900 space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <span className="font-bold text-sky-700 text-sm">Step {data.hourNumber} / 24</span>
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

        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sky-700 font-bold flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1 text-sky-600" />
            Demand:
          </span>
          <span className="text-sm md:text-base font-bold text-sky-600 font-mono">
            {data.demand.toFixed(2)} <span className="text-xs text-gray-500 font-normal">kWh</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const DemandAnalyticsCard: React.FC<DemandAnalyticsCardProps> = ({ hourlySteps, summary }) => {
  // Chart data mapping
  const chartData = useMemo(() => {
    return hourlySteps.map((step) => {
      let displayTime = `H${step.hour_number}`;
      if (step.timestamp && step.timestamp.includes('T')) {
        const timePart = step.timestamp.split('T')[1];
        displayTime = timePart.substring(0, 5);
      }

      return {
        hourNumber: step.hour_number,
        displayTime,
        timestamp: step.timestamp,
        demand: Number(step.predicted_demand_kwh.toFixed(2)),
      };
    });
  }, [hourlySteps]);

  // Dynamic calculations: average, peak, valley
  const stats = useMemo(() => {
    if (hourlySteps.length === 0) {
      return {
        averageDemand: 0,
        peakDemand: 0,
        peakTimestamp: 'N/A',
        peakHour: 0,
        valleyDemand: 0,
        valleyTimestamp: 'N/A',
        valleyHour: 0,
        fulfillmentRate: 0,
      };
    }

    let sum = 0;
    let peak = -Infinity;
    let peakStep = hourlySteps[0];
    let valley = Infinity;
    let valleyStep = hourlySteps[0];

    for (const step of hourlySteps) {
      const d = step.predicted_demand_kwh;
      sum += d;
      if (d > peak) {
        peak = d;
        peakStep = step;
      }
      if (d < valley) {
        valley = d;
        valleyStep = step;
      }
    }

    const totalPredicted = summary.total_predicted_demand_kwh || 0;
    const totalSupplied = summary.total_supplied_energy_kwh || 0;
    const fulfillmentRate = totalPredicted > 0
      ? Math.min(100, Math.max(0, (totalSupplied / totalPredicted) * 100))
      : 0;

    return {
      averageDemand: Number((sum / hourlySteps.length).toFixed(2)),
      peakDemand: Number(peak.toFixed(2)),
      peakTimestamp: peakStep.timestamp || `Hour ${peakStep.hour_number}`,
      peakHour: peakStep.hour_number,
      valleyDemand: Number(valley.toFixed(2)),
      valleyTimestamp: valleyStep.timestamp || `Hour ${valleyStep.hour_number}`,
      valleyHour: valleyStep.hour_number,
      fulfillmentRate: Number(fulfillmentRate.toFixed(1)),
    };
  }, [hourlySteps, summary]);

  if (hourlySteps.length === 0) {
    return (
      <SectionCard
        title="24-Hour Electricity Demand Analytics"
        subtitle="Chronological load profile and operational consumption dynamics"
      >
        <div className="p-8 text-center text-gray-500 font-mono text-sm flex items-center justify-center space-x-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span>Demand telemetry is currently unavailable.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="24-Hour Electricity Demand Dynamics"
      subtitle="Sequential load forecast profile with dynamic peak and baseload valley identification"
      badge={
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 text-xs font-mono font-bold uppercase">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Load Profile</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Dynamic Load Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* Average Load */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">24h Average</span>
            <p className="text-lg font-bold text-gray-900">{stats.averageDemand} kWh</p>
            <p className="text-xs text-gray-500 font-sans font-medium">Mean hourly load</p>
          </div>

          {/* Peak Load */}
          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 space-y-1">
            <div className="flex items-center justify-between text-rose-700 text-xs font-bold uppercase tracking-wider">
              <span>Peak Demand</span>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-rose-700">{stats.peakDemand} kWh</p>
            <p className="text-xs text-gray-500 truncate font-medium" title={stats.peakTimestamp}>
              H{stats.peakHour} ({stats.peakTimestamp.split('T')[1]?.substring(0, 5) || stats.peakTimestamp})
            </p>
          </div>

          {/* Valley Load */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span>Baseload Valley</span>
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-emerald-700">{stats.valleyDemand} kWh</p>
            <p className="text-xs text-gray-500 truncate font-medium" title={stats.valleyTimestamp}>
              H{stats.valleyHour} ({stats.valleyTimestamp.split('T')[1]?.substring(0, 5) || stats.valleyTimestamp})
            </p>
          </div>

          {/* Demand Fulfillment */}
          <div className="p-3 rounded-xl bg-sky-50/60 border border-sky-200 space-y-1">
            <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Fulfillment</span>
            <p className="text-lg font-bold text-sky-700">{stats.fulfillmentRate}%</p>
            <p className="text-xs text-gray-500 font-sans font-medium">0 unmet demand</p>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-60 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsDemandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01} />
                </linearGradient>
              </defs>

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
                unit=" kWh"
                width={68}
              />

              <Tooltip content={<CustomDemandTooltip />} />

              {/* Dynamic Reference Lines */}
              <ReferenceLine
                y={stats.averageDemand}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Avg: ${stats.averageDemand} kWh`,
                  fill: '#D97706',
                  fontSize: 12,
                  fontWeight: 600,
                  position: 'insideTopRight',
                }}
              />

              <ReferenceLine
                y={stats.peakDemand}
                stroke="#EF4444"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Peak: ${stats.peakDemand} kWh`,
                  fill: '#DC2626',
                  fontSize: 12,
                  fontWeight: 600,
                  position: 'insideTopLeft',
                }}
              />

              <Area
                type="monotone"
                dataKey="demand"
                name="Demand Load"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#analyticsDemandGrad)"
                activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#0284c7', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
};

export default DemandAnalyticsCard;
