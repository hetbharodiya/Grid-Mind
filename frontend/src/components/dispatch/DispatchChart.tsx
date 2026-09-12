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
import { Clock, Calendar, Zap, DollarSign, CloudRain } from 'lucide-react';

interface DispatchChartProps {
  hourlySteps: HourlyDispatchStep[];
  latencyMs?: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  payload: {
    hourNumber: number;
    displayTime: string;
    timestamp: string;
    predictedDemand: number;
    solar: number;
    wind: number;
    battery: number;
    grid: number;
    diesel: number;
    totalSupplied: number;
    hourlyCost: number;
    hourlyCarbon: number;
    batterySoc: number;
    solverStatus: string;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomDispatchTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3.5 shadow-lg text-sm text-gray-900 space-y-2 min-w-[240px]">
      <div className="flex items-center justify-between pb-1.5 border-b border-gray-100">
        <span className="font-bold text-emerald-700 text-sm">Hour {data.hourNumber} of 24</span>
        <span className="text-xs text-gray-700 font-mono font-semibold px-2 py-0.5 rounded bg-gray-100">
          {data.displayTime}
        </span>
      </div>

      <div className="space-y-1.5 text-gray-600">
        <div className="flex items-center justify-between text-xs md:text-[13px]">
          <span className="text-gray-500 font-medium flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-gray-400" />
            Timestamp:
          </span>
          <span className="text-gray-700 font-mono font-medium text-xs">{data.timestamp}</span>
        </div>

        <div className="flex items-center justify-between text-xs md:text-[13px] pt-1.5 border-t border-gray-100">
          <span className="text-sky-700 font-bold flex items-center">
            <Zap className="w-4 h-4 mr-1 text-sky-600" />
            Demand:
          </span>
          <span className="text-sm md:text-base font-bold text-sky-600 font-mono">
            {data.predictedDemand.toFixed(2)}{' '}
            <span className="text-xs text-gray-500 font-normal">kWh</span>
          </span>
        </div>

        {/* Source breakdown list */}
        <div className="pt-1.5 border-t border-gray-100 space-y-1 text-xs md:text-[13px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center text-amber-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-2" />
              Solar PV:
            </span>
            <span className="font-bold text-gray-900 font-mono">{data.solar.toFixed(2)} kWh</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-cyan-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mr-2" />
              Wind:
            </span>
            <span className="font-bold text-gray-900 font-mono">{data.wind.toFixed(2)} kWh</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
              Battery:
            </span>
            <span className="font-bold text-gray-900 font-mono">{data.battery.toFixed(2)} kWh</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-blue-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2" />
              Grid Import:
            </span>
            <span className="font-bold text-gray-900 font-mono">{data.grid.toFixed(2)} kWh</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500 mr-2" />
              Diesel Gen:
            </span>
            <span className="font-bold text-gray-900 font-mono">{data.diesel.toFixed(2)} kWh</span>
          </div>
        </div>

        {/* Financial & Environmental footer */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-mono">
          <span className="flex items-center text-amber-700 font-bold">
            <DollarSign className="w-3.5 h-3.5 mr-0.5" />${data.hourlyCost.toFixed(2)}
          </span>
          <span className="flex items-center text-teal-700 font-bold">
            <CloudRain className="w-3.5 h-3.5 mr-0.5" />
            {data.hourlyCarbon.toFixed(2)} kg CO₂
          </span>
          <span className="text-emerald-700 font-bold">SoC: {(data.batterySoc * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export const DispatchChart: React.FC<DispatchChartProps> = ({ hourlySteps, latencyMs }) => {
  const chartData = useMemo(() => {
    return hourlySteps.map((step) => {
      // Extract hour from timestamp or fall back to step hour_number
      let displayTime = `H${step.hour_number}`;
      try {
        if (step.timestamp.includes('T')) {
          const timePart = step.timestamp.split('T')[1];
          displayTime = timePart.substring(0, 5);
        }
      } catch {
        displayTime = `H${step.hour_number}`;
      }

      const totalSupplied =
        step.solar_used_kwh +
        step.wind_used_kwh +
        step.battery_used_kwh +
        step.grid_used_kwh +
        step.diesel_used_kwh;

      return {
        hourNumber: step.hour_number,
        displayTime,
        timestamp: step.timestamp,
        predictedDemand: step.predicted_demand_kwh,
        solar: step.solar_used_kwh,
        wind: step.wind_used_kwh,
        battery: step.battery_used_kwh,
        grid: step.grid_used_kwh,
        diesel: step.diesel_used_kwh,
        totalSupplied,
        hourlyCost: step.hourly_cost_usd,
        hourlyCarbon: step.hourly_carbon_kg,
        batterySoc: step.battery_soc_after_dispatch,
        solverStatus: step.solver_status,
      };
    });
  }, [hourlySteps]);

  return (
    <SectionCard
      title="24-Hour Horizon Multi-Asset Energy Dispatch Allocation"
      subtitle="Stacked hourly energy generation across solar, wind, battery, grid, and diesel assets"
      badge={
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
            PuLP LP Optimal
          </span>
          {latencyMs !== undefined && (
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-gray-100 text-gray-700 border border-gray-200 font-semibold">
              {latencyMs}ms
            </span>
          )}
        </div>
      }
    >
      <div className="w-full h-84 pt-2">
        <ResponsiveContainer width="100%" height={340}>
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 20, left: -5, bottom: 5 }}
          >
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
              unit=" kWh"
              width={72}
            />

            <Tooltip content={<CustomDispatchTooltip />} />

            <Legend
              wrapperStyle={{
                paddingTop: 16,
                fontSize: 13,
              }}
              formatter={(value: string) => (
                <span className="text-gray-800 font-semibold mr-3 text-xs md:text-sm">{value}</span>
              )}
            />

            {/* Stacked Energy Sources */}
            <Bar
              dataKey="solar"
              stackId="dispatchStack"
              name="Solar PV"
              fill="#F59E0B"
            />
            <Bar
              dataKey="wind"
              stackId="dispatchStack"
              name="Wind Power"
              fill="#06B6D4"
            />
            <Bar
              dataKey="battery"
              stackId="dispatchStack"
              name="Battery Storage"
              fill="#10B981"
            />
            <Bar
              dataKey="grid"
              stackId="dispatchStack"
              name="Grid Import"
              fill="#3B82F6"
            />
            <Bar
              dataKey="diesel"
              stackId="dispatchStack"
              name="Diesel Generator"
              fill="#64748B"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Operational Legend Strip */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm text-gray-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span className="text-gray-800 font-medium">Zero-Carbon Renewables (Solar/Wind)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-gray-800 font-medium">Clean Storage (Battery)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-sm bg-blue-500" />
            <span className="text-gray-800 font-medium">Utility Grid Import</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-sm bg-slate-500" />
            <span className="text-gray-800 font-medium">Backup Diesel Gen</span>
          </div>
        </div>
        <div className="text-xs md:text-[13px] text-gray-500 font-mono font-medium flex items-center">
          <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
          24 sequential hourly intervals
        </div>
      </div>
    </SectionCard>
  );
};

export default DispatchChart;
