import React from 'react';
import { Sun, Wind, BatteryCharging, Network, Zap } from 'lucide-react';
import { EnergySourceCard } from './EnergySourceCard';
import { DailyDispatchSummary } from '../../types/dispatch';

interface LiveEnergySourceGridProps {
  summary: DailyDispatchSummary;
}

export const LiveEnergySourceGrid: React.FC<LiveEnergySourceGridProps> = ({ summary }) => {
  const totalSupplied = summary.total_supplied_energy_kwh || 0;

  const calcPct = (kwh: number) => {
    if (totalSupplied <= 0) return 0;
    return Math.round((kwh / totalSupplied) * 100);
  };

  const assets = [
    {
      name: 'Solar PV',
      value: summary.total_solar_used_kwh.toFixed(1),
      percentage: calcPct(summary.total_solar_used_kwh),
      icon: Sun,
      colorTheme: 'amber' as const,
      status: summary.total_solar_used_kwh > 0 ? 'Dispatched' : 'Idle',
      capacityInfo: 'Zero-Carbon Fuel',
    },
    {
      name: 'Wind Generation',
      value: summary.total_wind_used_kwh.toFixed(1),
      percentage: calcPct(summary.total_wind_used_kwh),
      icon: Wind,
      colorTheme: 'sky' as const,
      status: summary.total_wind_used_kwh > 0 ? 'Dispatched' : 'Idle',
      capacityInfo: 'Zero-Carbon Fuel',
    },
    {
      name: 'Battery Storage',
      value: summary.total_battery_used_kwh.toFixed(1),
      percentage: calcPct(summary.total_battery_used_kwh),
      icon: BatteryCharging,
      colorTheme: 'emerald' as const,
      status: summary.total_battery_used_kwh > 0 ? 'Discharging' : 'Standby',
      capacityInfo: '200 kWh / 60 kW ESS',
    },
    {
      name: 'Utility Grid',
      value: summary.total_grid_used_kwh.toFixed(1),
      percentage: calcPct(summary.total_grid_used_kwh),
      icon: Network,
      colorTheme: 'indigo' as const,
      status: summary.total_grid_used_kwh > 0 ? 'Importing' : 'Connected',
      capacityInfo: '100 kW Interconnect',
    },
    {
      name: 'Backup Diesel',
      value: summary.total_diesel_used_kwh.toFixed(1),
      percentage: calcPct(summary.total_diesel_used_kwh),
      icon: Zap,
      colorTheme: 'rose' as const,
      status: summary.total_diesel_used_kwh > 0 ? 'Generating' : 'Standby',
      capacityInfo: '75 kW Generator',
    },
  ];

  return (
    <section aria-labelledby="live-energy-sources-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <h3
            id="live-energy-sources-heading"
            className="text-sm uppercase tracking-wider font-bold text-gray-700 font-mono"
          >
            Physical Asset Generation & Storage Supply
          </h3>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
            Live PuLP Dispatched
          </span>
        </div>
        <span className="text-xs md:text-sm text-gray-600 font-mono font-medium hidden sm:inline">
          Total Supply: <strong className="text-gray-900 font-bold font-mono">{totalSupplied.toFixed(1)} kWh</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {assets.map((asset) => (
          <EnergySourceCard
            key={asset.name}
            name={asset.name}
            value={asset.value}
            unit="kWh"
            percentage={asset.percentage}
            icon={asset.icon}
            colorTheme={asset.colorTheme}
            status={asset.status}
            capacityInfo={asset.capacityInfo}
          />
        ))}
      </div>
    </section>
  );
};

export default LiveEnergySourceGrid;
