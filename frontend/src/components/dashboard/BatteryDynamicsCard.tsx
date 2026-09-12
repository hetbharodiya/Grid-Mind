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
import { BatteryCharging, ShieldAlert, ArrowRight } from 'lucide-react';

interface BatteryDynamicsCardProps {
  socTrajectory: number[];
  startingSoc: number;
  endingSoc: number;
  totalBatteryUsedKwh: number;
  hourlySteps: HourlyDispatchStep[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      hourNumber: number;
      displayTime: string;
      socPercentage: number;
      dischargedKwh: number;
    };
  }>;
}

const CustomBatteryTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm text-gray-900 space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
        <span className="font-bold text-emerald-700">Hour {data.hourNumber} SoC</span>
        <span className="text-xs font-semibold text-gray-500 font-mono">{data.displayTime}</span>
      </div>
      <div className="flex items-center justify-between text-xs md:text-[13px]">
        <span className="text-gray-500 font-medium">State of Charge:</span>
        <span className="font-bold text-emerald-700 font-mono">{data.socPercentage.toFixed(1)}%</span>
      </div>
      <div className="flex items-center justify-between text-xs md:text-[13px]">
        <span className="text-gray-500 font-medium">Discharge Draw:</span>
        <span className="font-semibold text-amber-700 font-mono">{data.dischargedKwh.toFixed(2)} kWh</span>
      </div>
    </div>
  );
};

export const BatteryDynamicsCard: React.FC<BatteryDynamicsCardProps> = ({
  socTrajectory,
  startingSoc,
  endingSoc,
  totalBatteryUsedKwh,
  hourlySteps,
}) => {
  const chartData = useMemo(() => {
    return socTrajectory.map((soc, idx) => {
      const step = hourlySteps[idx];
      let displayTime = `H${idx + 1}`;
      if (step?.timestamp && step.timestamp.includes('T')) {
        displayTime = step.timestamp.split('T')[1].substring(0, 5);
      }

      return {
        hourNumber: idx + 1,
        displayTime,
        socPercentage: Math.round(soc * 1000) / 10,
        dischargedKwh: step?.battery_used_kwh || 0,
      };
    });
  }, [socTrajectory, hourlySteps]);

  return (
    <SectionCard
      title="Battery State of Charge Dynamics"
      subtitle="Electrochemical storage depletion curve enforcing physical 20% safety reserve"
      badge={
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase tracking-wider text-xs">
            ESS Depletion
          </span>
        </div>
      }
      actions={
        <div className="flex items-center space-x-2 text-xs md:text-sm font-mono text-gray-600">
          <span>Start: <strong className="text-gray-900 font-bold">{(startingSoc * 100).toFixed(0)}%</strong></span>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <span>End: <strong className="text-emerald-700 font-bold">{(endingSoc * 100).toFixed(1)}%</strong></span>
        </div>
      }
    >
      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="dashboardBatteryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
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
              domain={[0, 100]}
              tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
              tickLine={{ stroke: '#E5E7EB' }}
              axisLine={{ stroke: '#E5E7EB' }}
              unit="%"
              width={48}
            />

            <Tooltip content={<CustomBatteryTooltip />} />

            {/* 20% Minimum Safety Reserve */}
            <ReferenceLine
              y={20}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{
                value: '20% Reserve Floor',
                fill: '#DC2626',
                fontSize: 12,
                fontWeight: 600,
                position: 'insideBottomRight',
              }}
            />

            {/* 95% Ceiling */}
            <ReferenceLine
              y={95}
              stroke="#10B981"
              strokeDasharray="3 3"
              label={{
                value: '95% Ceiling',
                fill: '#059669',
                fontSize: 12,
                fontWeight: 600,
                position: 'insideTopRight',
              }}
            />

            <Area
              type="monotone"
              dataKey="socPercentage"
              name="Battery SoC"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#dashboardBatteryGradient)"
              activeDot={{
                r: 5,
                fill: '#10B981',
                stroke: '#059669',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <BatteryCharging className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Total Discharged: <strong className="text-gray-900 font-bold font-mono">{totalBatteryUsedKwh.toFixed(2)} kWh</strong></span>
        </div>
        <div className="flex items-center space-x-1.5 text-xs md:text-[13px] text-gray-600 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Non-Violated 20% Safety Reserve Floor</span>
        </div>
      </div>
    </SectionCard>
  );
};

export default BatteryDynamicsCard;
