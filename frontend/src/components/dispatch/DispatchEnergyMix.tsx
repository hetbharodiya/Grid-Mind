import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { DailyDispatchSummary } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface DispatchEnergyMixProps {
  summary: DailyDispatchSummary;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      percentage: number;
      color: string;
    };
  }>;
}

const CustomMixTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm text-gray-900 space-y-1.5 min-w-[180px]">
      <div className="flex items-center space-x-2 pb-1 border-b border-gray-100">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span className="font-bold text-gray-900">{item.name}</span>
      </div>
      <div className="flex items-baseline justify-between space-x-2 text-xs md:text-[13px] pt-1">
        <span className="text-gray-500 font-medium">Generation:</span>
        <div className="text-right">
          <span className="font-bold text-gray-900 font-mono">{item.value.toFixed(2)} kWh </span>
          <span className="text-gray-500 font-mono font-medium">({item.percentage.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};

export const DispatchEnergyMix: React.FC<DispatchEnergyMixProps> = ({ summary }) => {
  const totalSupplied = summary.total_supplied_energy_kwh || 1;

  const mixData = useMemo(() => {
    const rawItems = [
      {
        name: 'Solar PV',
        value: summary.total_solar_used_kwh,
        color: '#F59E0B',
      },
      {
        name: 'Wind Power',
        value: summary.total_wind_used_kwh,
        color: '#06B6D4',
      },
      {
        name: 'Battery Storage',
        value: summary.total_battery_used_kwh,
        color: '#10B981',
      },
      {
        name: 'Grid Import',
        value: summary.total_grid_used_kwh,
        color: '#3B82F6',
      },
      {
        name: 'Diesel Generator',
        value: summary.total_diesel_used_kwh,
        color: '#64748B',
      },
    ];

    return rawItems.map((item) => ({
      ...item,
      percentage: Math.max(0, (item.value / totalSupplied) * 100),
    }));
  }, [summary, totalSupplied]);

  const activeMixData = useMemo(() => {
    const active = mixData.filter((item) => item.value > 0);
    return active.length > 0 ? active : mixData;
  }, [mixData]);

  return (
    <SectionCard
      title="24-Hour Energy Generation Mix"
      subtitle="Total energy distributed across physical generation and storage assets"
      badge={
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold uppercase">
          Source Share
        </span>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center min-h-[224px]">
        {/* Donut Chart */}
        <div className="md:col-span-5 h-56 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomMixTooltip />} />
              <Pie
                data={activeMixData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {activeMixData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono">Clean Share</span>
            <span className="text-2xl font-bold font-mono text-emerald-600">
              {summary.average_clean_energy_percentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Breakdown Telemetry Cards */}
        <div className="md:col-span-7 space-y-2">
          {mixData.map((item) => (
            <div
              key={item.name}
              className="p-2 px-3 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between hover:bg-gray-100/80 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-800 font-semibold text-xs md:text-sm">{item.name}</span>
              </div>

              <div className="flex items-center space-x-3 font-mono">
                <span className="text-gray-600 text-xs md:text-[13px] font-medium">
                  {item.value.toFixed(2)} kWh
                </span>
                <span className="w-14 text-right font-bold text-gray-900 text-xs md:text-sm">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default DispatchEnergyMix;
