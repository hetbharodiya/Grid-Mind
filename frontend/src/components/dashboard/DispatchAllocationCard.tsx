import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { HourlyDispatchStep } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';
import { DollarSign, Zap } from 'lucide-react';

interface DispatchAllocationCardProps {
  hourlySteps: HourlyDispatchStep[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: {
      hourNumber: number;
      displayTime: string;
      demand: number;
      solar: number;
      wind: number;
      battery: number;
      grid: number;
      diesel: number;
      cost: number;
      soc: number;
    };
  }>;
}

const CustomAllocationTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-lg font-sans text-xs text-gray-900 space-y-2 min-w-[220px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
        <span className="font-bold text-emerald-800 text-sm">Hour {data.hourNumber} / 24</span>
        <span className="text-xs text-gray-600 font-semibold px-2 py-0.5 rounded bg-gray-100">{data.displayTime}</span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 font-semibold flex items-center">
          <Zap className="w-3.5 h-3.5 mr-1.5 text-sky-600" />
          Demand:
        </span>
        <span className="font-bold text-sky-700 font-mono text-sm">{data.demand.toFixed(2)} kWh</span>
      </div>

      <div className="pt-1.5 border-t border-gray-100 space-y-1 text-xs">
        <div className="flex items-center justify-between text-amber-800 font-medium">
          <span>Solar PV:</span>
          <span className="font-bold text-gray-900 font-mono">{data.solar.toFixed(2)} kWh</span>
        </div>
        <div className="flex items-center justify-between text-cyan-800 font-medium">
          <span>Wind Power:</span>
          <span className="font-bold text-gray-900 font-mono">{data.wind.toFixed(2)} kWh</span>
        </div>
        <div className="flex items-center justify-between text-emerald-800 font-medium">
          <span>Battery Storage:</span>
          <span className="font-bold text-gray-900 font-mono">{data.battery.toFixed(2)} kWh</span>
        </div>
        <div className="flex items-center justify-between text-blue-800 font-medium">
          <span>Grid Import:</span>
          <span className="font-bold text-gray-900 font-mono">{data.grid.toFixed(2)} kWh</span>
        </div>
        <div className="flex items-center justify-between text-slate-800 font-medium">
          <span>Diesel Gen:</span>
          <span className="font-bold text-gray-900 font-mono">{data.diesel.toFixed(2)} kWh</span>
        </div>
      </div>

      <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
        <span className="flex items-center text-amber-800 font-semibold">
          <DollarSign className="w-3.5 h-3.5 mr-0.5" />${data.cost.toFixed(2)}
        </span>
        <span className="text-emerald-800 font-semibold">SoC: {(data.soc * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

export const DispatchAllocationCard: React.FC<DispatchAllocationCardProps> = ({ hourlySteps }) => {
  const chartData = useMemo(() => {
    return hourlySteps.map((step) => {
      let displayTime = `H${step.hour_number}`;
      if (step.timestamp && step.timestamp.includes('T')) {
        displayTime = step.timestamp.split('T')[1].substring(0, 5);
      }

      return {
        hourNumber: step.hour_number,
        displayTime,
        demand: step.predicted_demand_kwh,
        solar: step.solar_used_kwh,
        wind: step.wind_used_kwh,
        battery: step.battery_used_kwh,
        grid: step.grid_used_kwh,
        diesel: step.diesel_used_kwh,
        cost: step.hourly_cost_usd,
        soc: step.battery_soc_after_dispatch,
      };
    });
  }, [hourlySteps]);

  return (
    <SectionCard
      title="24-Hour Horizon Multi-Asset Dispatch Allocation"
      subtitle="Optimal hourly power generation and storage draw across microgrid assets"
      badge={
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
          PuLP LP Stacked
        </span>
      }
    >
      <div className="w-full h-64 pt-2">
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -5, bottom: 5 }}
          >
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

            <Tooltip content={<CustomAllocationTooltip />} />

            <Legend
              wrapperStyle={{
                paddingTop: 10,
                fontSize: 12,
                fontFamily: 'sans-serif',
              }}
              formatter={(value: string) => (
                <span className="text-gray-800 text-xs md:text-[13px] font-semibold mr-3">{value}</span>
              )}
            />

            <Bar dataKey="solar" stackId="mixStack" name="Solar PV" fill="#f59e0b" />
            <Bar dataKey="wind" stackId="mixStack" name="Wind Power" fill="#06b6d4" />
            <Bar dataKey="battery" stackId="mixStack" name="Battery ESS" fill="#10b981" />
            <Bar dataKey="grid" stackId="mixStack" name="Grid Import" fill="#3b82f6" />
            <Bar
              dataKey="diesel"
              stackId="mixStack"
              name="Diesel Gen"
              fill="#64748b"
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs md:text-[13px] text-gray-500">
        <span className="text-gray-600 font-medium">
          Renewables & ESS prioritized before utility tariffs & diesel fuel
        </span>
        <span className="text-emerald-700 font-semibold">
          100% Demand Balanced
        </span>
      </div>
    </SectionCard>
  );
};

export default DispatchAllocationCard;
