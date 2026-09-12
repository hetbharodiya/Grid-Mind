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
import { HourlyDispatchStep } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';
import { Calendar, Zap } from 'lucide-react';

interface DemandOutlookCardProps {
  hourlySteps: HourlyDispatchStep[];
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
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-lg font-sans text-xs text-gray-900 space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
        <span className="font-bold text-sky-700 text-sm">Hour {data.hourNumber} / 24</span>
        <span className="text-xs text-gray-600 font-semibold px-2 py-0.5 rounded bg-gray-100">
          {data.displayTime}
        </span>
      </div>

      <div className="space-y-1.5 text-gray-600 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            Time:
          </span>
          <span className="text-gray-700 font-mono text-xs">{data.timestamp}</span>
        </div>

        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-gray-900 font-semibold flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
            Demand:
          </span>
          <span className="text-base font-bold text-sky-700 font-mono">
            {data.demand.toFixed(2)} <span className="text-xs text-gray-500 font-normal">kWh</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const DemandOutlookCard: React.FC<DemandOutlookCardProps> = ({ hourlySteps }) => {
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
        demand: step.predicted_demand_kwh,
      };
    });
  }, [hourlySteps]);

  // Derive mathematical average and peak demand strictly from real response steps
  const { averageDemand, peakDemand, peakHour } = useMemo(() => {
    if (!hourlySteps.length) return { averageDemand: 0, peakDemand: 0, peakHour: '' };

    let sum = 0;
    let peak = hourlySteps[0].predicted_demand_kwh;
    let peakTime = `H${hourlySteps[0].hour_number}`;

    for (const step of hourlySteps) {
      sum += step.predicted_demand_kwh;
      if (step.predicted_demand_kwh > peak) {
        peak = step.predicted_demand_kwh;
        peakTime = step.timestamp.includes('T')
          ? step.timestamp.split('T')[1].substring(0, 5)
          : `H${step.hour_number}`;
      }
    }

    return {
      averageDemand: Number((sum / hourlySteps.length).toFixed(2)),
      peakDemand: Number(peak.toFixed(2)),
      peakHour: peakTime,
    };
  }, [hourlySteps]);

  return (
    <SectionCard
      title="24-Hour Electricity Demand Outlook"
      subtitle="AI multi-step load forecast trajectory driving optimal dispatch decisions"
      badge={
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 uppercase">
            Load Profile
          </span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-50 text-gray-700 border border-gray-200">
            Avg: {averageDemand} kWh
          </span>
        </div>
      }
    >
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="dashboardDemandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={1.0}
              vertical={false}
            />

            <XAxis
              dataKey="displayTime"
              stroke="#94a3b8"
              tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#e2e8f0' }}
            />

            <YAxis
              stroke="#94a3b8"
              tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#e2e8f0' }}
              unit=" kWh"
              width={60}
            />

            <Tooltip content={<CustomDemandTooltip />} />

            {/* 24h Average Demand Line */}
            {averageDemand > 0 && (
              <ReferenceLine
                y={averageDemand}
                stroke="#f59e0b"
                strokeDasharray="3 3"
                label={{
                  value: `Avg: ${averageDemand} kWh`,
                  fill: '#d97706',
                  fontSize: 12,
                  fontWeight: 600,
                  position: 'top',
                }}
              />
            )}

            {/* Peak Demand Reference Line */}
            {peakDemand > 0 && (
              <ReferenceLine
                y={peakDemand}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{
                  value: `Peak: ${peakDemand} kWh (${peakHour})`,
                  fill: '#dc2626',
                  fontSize: 12,
                  fontWeight: 600,
                  position: 'insideTopRight',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="demand"
              name="Demand Forecast"
              stroke="#0ea5e9"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#dashboardDemandGradient)"
              activeDot={{
                r: 5,
                fill: '#0ea5e9',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs md:text-[13px] text-gray-500">
        <div className="flex items-center space-x-3.5">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-1.5 bg-sky-500 rounded-full" />
            <span className="text-gray-700 font-medium">Predicted Load</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-amber-500" />
            <span className="text-amber-700 font-medium">24h Average</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-0.5 border-b-2 border-dashed border-rose-500" />
            <span className="text-rose-700 font-medium">Peak Load</span>
          </div>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Continuous 1-hour resolution
        </span>
      </div>
    </SectionCard>
  );
};

export default DemandOutlookCard;
