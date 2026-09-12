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
import { ForecastStepItem } from '../../types/forecast';
import { SectionCard } from '../common/SectionCard';
import { Calendar, Clock, Zap } from 'lucide-react';

interface ForecastChartProps {
  forecasts: ForecastStepItem[];
  latencyMs?: number;
}

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

interface TooltipPayloadItem {
  value: number;
  payload: {
    step: number;
    timestamp: string;
    hour: number;
    day_of_week: number;
    predictedDemand: number;
    displayTime: string;
    dayName: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomSCADATooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm text-gray-900 space-y-2 min-w-[210px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
        <span className="font-bold text-sky-700 text-sm">Step {data.step} / 24</span>
        <span className="text-xs font-semibold text-gray-700 px-2 py-0.5 rounded bg-gray-100 font-mono">
          {data.dayName}
        </span>
      </div>

      <div className="space-y-1.5 text-gray-600">
        <div className="flex items-center justify-between text-xs md:text-[13px]">
          <span className="text-gray-500 font-medium flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            Time:
          </span>
          <span className="font-bold text-gray-900 font-mono">{data.displayTime}</span>
        </div>

        <div className="flex items-center justify-between text-xs md:text-[13px]">
          <span className="text-gray-500 font-medium flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            Timestamp:
          </span>
          <span className="text-gray-700 font-mono font-medium text-xs">{data.timestamp}</span>
        </div>

        <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sky-700 font-bold flex items-center text-xs md:text-sm">
            <Zap className="w-4 h-4 mr-1 text-sky-600" />
            Predicted:
          </span>
          <span className="text-sm md:text-base font-bold text-sky-600 font-mono">
            {data.predictedDemand.toFixed(4)} <span className="text-xs text-gray-500 font-normal">kWh</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecasts, latencyMs }) => {
  // Map real forecast step items to chart data points (ZERO data fabrication)
  const chartData = useMemo(() => {
    return forecasts.map((item) => ({
      step: item.step,
      timestamp: item.timestamp,
      hour: item.hour,
      day_of_week: item.day_of_week,
      predictedDemand: item.predicted_demand_kwh,
      displayTime: `${String(item.hour).padStart(2, '0')}:00`,
      dayName: DAY_NAMES[item.day_of_week] || `Day ${item.day_of_week}`,
    }));
  }, [forecasts]);

  // Derived statistics for reference lines
  const { averageDemand, peakDemand } = useMemo(() => {
    if (!forecasts.length) return { averageDemand: 0, peakDemand: 0 };
    let sum = 0;
    let peak = forecasts[0].predicted_demand_kwh;

    for (const item of forecasts) {
      sum += item.predicted_demand_kwh;
      if (item.predicted_demand_kwh > peak) {
        peak = item.predicted_demand_kwh;
      }
    }
    return {
      averageDemand: Number((sum / forecasts.length).toFixed(4)),
      peakDemand: Number(peak.toFixed(4)),
    };
  }, [forecasts]);

  return (
    <SectionCard
      title="24-Hour Forward Demand Trajectory"
      subtitle="Multi-step recursive electricity load forecast with dynamic peak and average indicators"
      badge={
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold uppercase">
            Live ML Inference
          </span>
          {latencyMs !== undefined && (
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
              {latencyMs}ms
            </span>
          )}
        </div>
      }
    >
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 25, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="forecastDemandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E5E7EB"
              opacity={0.8}
              vertical={false}
            />

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
              domain={['auto', 'auto']}
              unit=" kWh"
              width={72}
            />

            <Tooltip content={<CustomSCADATooltip />} />

            {/* 24h Average Demand Reference Line */}
            {averageDemand > 0 && (
              <ReferenceLine
                y={averageDemand}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `24h Avg: ${averageDemand.toFixed(2)} kWh`,
                  fill: '#D97706',
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
                stroke="#EF4444"
                strokeDasharray="3 3"
                label={{
                  value: `Peak: ${peakDemand.toFixed(2)} kWh`,
                  fill: '#DC2626',
                  fontSize: 12,
                  fontWeight: 600,
                  position: 'insideTopRight',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="predictedDemand"
              name="Predicted Demand"
              stroke="#0ea5e9"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#forecastDemandGradient)"
              activeDot={{
                r: 6,
                fill: '#0EA5E9',
                stroke: '#0284C7',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Summary Info */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-1.5 bg-sky-500 rounded-full" />
            <span className="text-gray-800 font-semibold">Predicted Load (kWh)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-amber-500" />
            <span className="text-amber-700 font-semibold">24h Average</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-0.5 border-b-2 border-dashed border-rose-500" />
            <span className="text-rose-700 font-semibold">Peak Load</span>
          </div>
        </div>
        <div className="text-xs md:text-[13px] text-gray-500 font-mono font-medium">
          24 sequential steps • Continuous 1-hour interval
        </div>
      </div>
    </SectionCard>
  );
};

export default ForecastChart;
