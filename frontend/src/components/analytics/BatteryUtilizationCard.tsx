import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BatteryCharging, AlertCircle, Activity } from 'lucide-react';
import { DailyDispatchSummary } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface BatteryUtilizationCardProps {
  socTrajectory: number[];
  summary: DailyDispatchSummary;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: {
      stepLabel: string;
      socPct: number;
    };
  }>;
}

const CustomSocTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm text-gray-900 space-y-1.5 min-w-[180px]">
      <div className="flex items-center justify-between pb-1 border-b border-gray-100">
        <span className="font-bold text-emerald-700 text-sm">{data.stepLabel}</span>
        <span className="text-xs text-gray-600 px-2 py-0.5 rounded bg-gray-100 font-mono font-semibold">
          Telemetry
        </span>
      </div>

      <div className="pt-1.5 flex items-center justify-between text-xs md:text-[13px]">
        <span className="text-gray-600 font-medium">State of Charge:</span>
        <span className="text-sm md:text-base font-bold text-emerald-700 font-mono">
          {data.socPct.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export const BatteryUtilizationCard: React.FC<BatteryUtilizationCardProps> = ({
  socTrajectory,
  summary,
}) => {
  // Chart points mapping
  const chartData = useMemo(() => {
    if (!socTrajectory || socTrajectory.length === 0) return [];

    return socTrajectory.map((val, idx) => {
      // If 25 points, index 0 is Start, index 1-24 are hours 1-24
      const stepLabel = idx === 0 ? 'Start' : `H${idx}`;
      const socPct = val <= 1.0 ? val * 100 : val;

      return {
        stepLabel,
        socPct: Number(socPct.toFixed(1)),
      };
    });
  }, [socTrajectory]);

  // Battery metrics derived strictly from genuine telemetry
  const batteryStats = useMemo(() => {
    const startingSoc = (summary.starting_battery_soc <= 1.0
      ? summary.starting_battery_soc * 100
      : summary.starting_battery_soc) || 0;

    const endingSoc = (summary.ending_battery_soc <= 1.0
      ? summary.ending_battery_soc * 100
      : summary.ending_battery_soc) || 0;

    const netChange = endingSoc - startingSoc;
    const totalDispatched = summary.total_battery_used_kwh || 0;

    // Minimum and Maximum SoC across horizon
    let minSoc = startingSoc;
    let maxSoc = startingSoc;

    if (socTrajectory && socTrajectory.length > 0) {
      const pcts = socTrajectory.map((v) => (v <= 1.0 ? v * 100 : v));
      minSoc = Math.min(...pcts);
      maxSoc = Math.max(...pcts);
    }

    return {
      startingSoc: Number(startingSoc.toFixed(1)),
      endingSoc: Number(endingSoc.toFixed(1)),
      minSoc: Number(minSoc.toFixed(1)),
      maxSoc: Number(maxSoc.toFixed(1)),
      netChange: Number(netChange.toFixed(1)),
      totalDispatched: Number(totalDispatched.toFixed(2)),
    };
  }, [socTrajectory, summary]);

  if (!socTrajectory || socTrajectory.length === 0) {
    return (
      <SectionCard
        title="Battery Energy Storage System (BESS) Dynamics"
        subtitle="Chronological State of Charge trajectory and electrochemical cycling"
      >
        <div className="p-8 text-center text-gray-500 font-mono text-sm flex items-center justify-center space-x-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span>Battery SoC telemetry is currently unavailable.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Battery Storage Dynamics & State of Charge"
      subtitle="Chronological electrochemical storage cycling across the 24-hour dispatch horizon"
      badge={
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono font-bold uppercase">
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>{batteryStats.totalDispatched} kWh Dispatched</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Battery Telemetry Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
          {/* Starting SoC */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Starting SoC</span>
            <p className="text-lg font-bold text-gray-900">{batteryStats.startingSoc}%</p>
            <p className="text-xs text-gray-500 font-sans font-medium">Initial reservoir</p>
          </div>

          {/* Ending SoC */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Ending SoC</span>
            <p className="text-lg font-bold text-emerald-700">{batteryStats.endingSoc}%</p>
            <p className="text-xs text-gray-500 font-sans font-medium">Final reservoir</p>
          </div>

          {/* Horizon SoC Bounds */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operating Bounds</span>
            <p className="text-lg font-bold text-gray-900">
              {batteryStats.minSoc}% – {batteryStats.maxSoc}%
            </p>
            <p className="text-xs text-gray-500 font-sans font-medium">Min / Max observed</p>
          </div>

          {/* Net SoC Change */}
          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span>Net SoC Delta</span>
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-emerald-700">
              {batteryStats.netChange > 0 ? `+${batteryStats.netChange}%` : `${batteryStats.netChange}%`}
            </p>
            <p className="text-xs text-gray-500 font-sans font-medium">Cycle throughput</p>
          </div>
        </div>

        {/* Recharts Area Chart for SoC */}
        <div className="w-full h-60 pt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -5, bottom: 0 }}>
              <defs>
                <linearGradient id="analyticsSocGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.8} vertical={false} />

              <XAxis
                dataKey="stepLabel"
                stroke="#9CA3AF"
                tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
                height={26}
              />

              <YAxis
                domain={[0, 100]}
                stroke="#9CA3AF"
                tick={{ fill: '#475467', fontSize: 12, fontWeight: 500 }}
                tickLine={{ stroke: '#E5E7EB' }}
                axisLine={{ stroke: '#E5E7EB' }}
                unit="%"
                width={52}
              />

              <Tooltip content={<CustomSocTooltip />} />

              <Area
                type="monotone"
                dataKey="socPct"
                name="Battery SoC"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#analyticsSocGrad)"
                activeDot={{ r: 5, fill: '#10B981', stroke: '#059669', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </SectionCard>
  );
};

export default BatteryUtilizationCard;
