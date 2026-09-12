import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { Leaf } from 'lucide-react';
import { DailyDispatchSummary, HourlyDispatchStep } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface SustainabilityCarbonCardProps {
  summary: DailyDispatchSummary;
  hourlySteps: HourlyDispatchStep[];
}

interface CustomPieTooltipProps {
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

const CustomPieTooltip: React.FC<CustomPieTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;

  const item = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg font-sans text-sm text-gray-900 space-y-1.5">
      <div className="flex items-center space-x-2">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="font-bold text-gray-900 text-sm">{item.name}</span>
      </div>
      <div className="flex items-center space-x-2 text-xs text-gray-600">
        <span className="font-medium">Dispatched:</span>
        <span className="font-bold text-gray-900 font-mono">{item.value.toFixed(2)} kWh</span>
        <span className="text-gray-500 font-mono">({item.percentage.toFixed(1)}%)</span>
      </div>
    </div>
  );
};

export const SustainabilityCarbonCard: React.FC<SustainabilityCarbonCardProps> = ({
  summary,
  hourlySteps,
}) => {
  const totalSupplied = summary.total_supplied_energy_kwh || 0;
  const totalCarbon = summary.total_carbon_emissions_kg || 0;
  const cleanEnergyPct = summary.average_clean_energy_percentage || 0;

  // Deterministic carbon intensity (kg CO2 / kWh)
  const carbonIntensity = totalSupplied > 0 ? totalCarbon / totalSupplied : 0;

  // Find peak emissions hour
  const peakEmissions = useMemo(() => {
    if (hourlySteps.length === 0) return { peakKg: 0, peakHour: 0, peakTimestamp: 'N/A' };

    let maxKg = 0;
    let maxStep = hourlySteps[0];

    for (const step of hourlySteps) {
      if (step.hourly_carbon_kg > maxKg) {
        maxKg = step.hourly_carbon_kg;
        maxStep = step;
      }
    }

    return {
      peakKg: Number(maxKg.toFixed(4)),
      peakHour: maxStep.hour_number,
      peakTimestamp: maxStep.timestamp,
    };
  }, [hourlySteps]);

  // Operational five-asset fleet breakdown
  const fleetData = useMemo(() => {
    const rawItems = [
      {
        name: 'Solar PV',
        value: summary.total_solar_used_kwh || 0,
        color: '#F59E0B',
      },
      {
        name: 'Wind Generation',
        value: summary.total_wind_used_kwh || 0,
        color: '#06B6D4',
      },
      {
        name: 'Battery Storage',
        value: summary.total_battery_used_kwh || 0,
        color: '#10B981',
      },
      {
        name: 'Utility Grid',
        value: summary.total_grid_used_kwh || 0,
        color: '#3B82F6',
      },
      {
        name: 'Backup Diesel',
        value: summary.total_diesel_used_kwh || 0,
        color: '#64748B',
      },
    ];

    return rawItems.map((item) => ({
      ...item,
      percentage: totalSupplied > 0 ? (item.value / totalSupplied) * 100 : 0,
    }));
  }, [summary, totalSupplied]);

  const activeFleetData = useMemo(() => {
    const active = fleetData.filter((item) => item.value > 0);
    return active.length > 0 ? active : fleetData;
  }, [fleetData]);

  return (
    <SectionCard
      title="Sustainability & Carbon Emissions Analytics"
      subtitle="Authoritative clean energy rating, operational carbon intensity & fleet asset distribution"
      badge={
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>{cleanEnergyPct.toFixed(1)}% Clean Energy Rating</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Carbon & Clean Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* Clean Energy Share */}
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Clean Energy Share</span>
            <p className="text-lg sm:text-xl font-bold text-emerald-900 font-mono">{cleanEnergyPct.toFixed(1)}%</p>
            <p className="text-xs text-emerald-600">Authoritative backend</p>
          </div>

          {/* Total Carbon Emissions */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Emissions</span>
            <p className="text-lg sm:text-xl font-bold text-gray-900 font-mono">{totalCarbon.toFixed(2)} kg</p>
            <p className="text-xs text-gray-500">Total operational CO₂</p>
          </div>

          {/* Carbon Intensity */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Carbon Intensity</span>
            <p className="text-lg sm:text-xl font-bold text-gray-900 font-mono">{carbonIntensity.toFixed(4)}</p>
            <p className="text-xs text-gray-500">kg CO₂ / delivered kWh</p>
          </div>

          {/* Peak Carbon Hour */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Peak Carbon Hour</span>
            <p className="text-lg sm:text-xl font-bold text-gray-900 font-mono">
              {peakEmissions.peakKg > 0 ? `${peakEmissions.peakKg} kg` : '0.00 kg'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {peakEmissions.peakKg > 0 ? `Step ${peakEmissions.peakHour}` : 'Zero emissions'}
            </p>
          </div>
        </div>

        {/* Fleet Dispatch Donut Chart & Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
          {/* Donut Chart */}
          <div className="relative w-full h-48 flex items-center justify-center bg-gray-50/50 rounded-xl border border-gray-100 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={activeFleetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                >
                  {activeFleetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl font-bold text-gray-900 font-mono leading-none">
                {cleanEnergyPct.toFixed(0)}%
              </span>
              <span className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-wider">
                Clean
              </span>
            </div>
          </div>

          {/* Five Asset Breakdown Rows */}
          <div className="space-y-2">
            {fleetData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-800 font-semibold text-xs sm:text-sm">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2 text-xs sm:text-sm font-mono">
                  <span className="font-bold text-gray-900">{item.value.toFixed(1)} kWh</span>
                  <span className="text-gray-500 w-14 text-right">({item.percentage.toFixed(1)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default SustainabilityCarbonCard;
