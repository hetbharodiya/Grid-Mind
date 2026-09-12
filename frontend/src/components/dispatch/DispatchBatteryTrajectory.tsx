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
import { SectionCard } from '../common/SectionCard';
import { BatteryCharging, ShieldAlert, ArrowRight, Activity } from 'lucide-react';
import { HourlyDispatchStep } from '../../types/dispatch';

interface DispatchBatteryTrajectoryProps {
  socTrajectory: number[];
  startingSoc: number;
  endingSoc: number;
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
      socFraction: number;
      batteryDischarged: number;
    };
  }>;
}

const CustomBatteryTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-lg text-sm text-gray-900 space-y-2 min-w-[200px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
        <span className="font-bold text-emerald-700 text-sm">Hour {data.hourNumber} SoC</span>
        <span className="text-xs font-semibold text-gray-500 font-mono">{data.displayTime}</span>
      </div>

      <div className="space-y-1.5 text-gray-600">
        <div className="flex items-center justify-between text-xs md:text-[13px]">
          <span className="text-gray-500 font-medium">State of Charge:</span>
          <span className="text-sm md:text-base font-bold text-emerald-700 font-mono">
            {data.socPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between text-xs md:text-[13px]">
          <span className="text-gray-500 font-medium">Fraction:</span>
          <span className="font-bold text-gray-800 font-mono">
            {data.socFraction.toFixed(4)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs md:text-[13px] pt-1.5 border-t border-gray-100">
          <span className="text-gray-500 font-medium">Discharge This Hour:</span>
          <span className="font-bold text-amber-700 font-mono">
            {data.batteryDischarged.toFixed(2)} kWh
          </span>
        </div>
      </div>
    </div>
  );
};

export const DispatchBatteryTrajectory: React.FC<DispatchBatteryTrajectoryProps> = ({
  socTrajectory,
  startingSoc,
  endingSoc,
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
        socFraction: soc,
        socPercentage: Math.round(soc * 1000) / 10,
        batteryDischarged: step?.battery_used_kwh || 0,
      };
    });
  }, [socTrajectory, hourlySteps]);

  const totalBatteryDelivered = useMemo(() => {
    return hourlySteps.reduce((acc, s) => acc + s.battery_used_kwh, 0);
  }, [hourlySteps]);

  return (
    <SectionCard
      title="Electrochemical Battery SoC Trajectory"
      subtitle="24-hour State of Charge curve enforcing 20% minimum safety floor and 95% ceiling"
      badge={
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
          Physics-Constrained
        </span>
      }
      actions={
        <div className="hidden sm:flex items-center space-x-3 text-xs md:text-sm font-mono text-gray-600">
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500">Start:</span>
            <span className="font-bold text-gray-900">{(startingSoc * 100).toFixed(0)}%</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500">End:</span>
            <span className="font-bold text-emerald-700">{(endingSoc * 100).toFixed(1)}%</span>
          </div>
        </div>
      }
    >
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height={230}>
          <AreaChart
            data={chartData}
            margin={{ top: 15, right: 25, left: -5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="batterySocGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
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
              width={52}
            />

            <Tooltip content={<CustomBatteryTooltip />} />

            {/* Minimum Safety Floor (20%) */}
            <ReferenceLine
              y={20}
              stroke="#EF4444"
              strokeDasharray="3 3"
              label={{
                value: 'Min Safety Floor (20%)',
                fill: '#DC2626',
                fontSize: 12,
                fontWeight: 600,
                position: 'insideBottomRight',
              }}
            />

            {/* Maximum Ceiling (95%) */}
            <ReferenceLine
              y={95}
              stroke="#10B981"
              strokeDasharray="3 3"
              label={{
                value: 'Max Ceiling (95%)',
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
              fill="url(#batterySocGradient)"
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

      {/* Battery State Metadata Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs md:text-sm font-mono text-gray-600">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-bold uppercase tracking-wider">TOTAL DISCHARGE</span>
            <span className="text-gray-900 font-bold text-sm md:text-base">
              {totalBatteryDelivered.toFixed(2)} kWh
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-bold uppercase tracking-wider">RESERVE MARGIN</span>
            <span className="text-gray-900 font-bold text-sm md:text-base">
              {((endingSoc - 0.20) * 200).toFixed(1)} kWh Available
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-200">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <span className="text-gray-500 block text-xs font-bold uppercase tracking-wider">INVERTER EFFICIENCY</span>
            <span className="text-gray-900 font-bold text-sm md:text-base">95.0% One-Way</span>
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default DispatchBatteryTrajectory;
