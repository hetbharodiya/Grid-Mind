import React from 'react';
import { Zap, DollarSign, Leaf, Activity } from 'lucide-react';
import { DailyDispatchSummary } from '../../types/dispatch';
import { MetricCard } from '../dashboard/MetricCard';

interface AnalyticsOverviewCardsProps {
  summary: DailyDispatchSummary;
}

export const AnalyticsOverviewCards: React.FC<AnalyticsOverviewCardsProps> = ({ summary }) => {
  const totalSupplied = summary.total_supplied_energy_kwh || 0;
  const totalPredicted = summary.total_predicted_demand_kwh || 0;
  const totalCost = summary.total_operational_cost_usd || 0;
  const totalCarbon = summary.total_carbon_emissions_kg || 0;
  const cleanEnergyPct = summary.average_clean_energy_percentage || 0;

  // Deterministic fulfillment rate with safe guard against division by zero
  const fulfillmentRate = totalPredicted > 0
    ? Math.min(100, Math.max(0, (totalSupplied / totalPredicted) * 100))
    : 0;

  // Deterministic effective unit cost ($/kWh)
  const unitCost = totalSupplied > 0 ? totalCost / totalSupplied : 0;

  // Deterministic carbon intensity (kg CO2/kWh)
  const carbonIntensity = totalSupplied > 0 ? totalCarbon / totalSupplied : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Delivered Energy */}
      <MetricCard
        title="24h Delivered Energy"
        value={totalSupplied.toFixed(2)}
        unit="kWh"
        icon={Zap}
        colorTheme="sky"
        statusText={`Fulfillment: ${fulfillmentRate.toFixed(1)}% of projected load`}
      />

      {/* 2. Total Operational Cost */}
      <MetricCard
        title="Total Operational Cost"
        value={`$${totalCost.toFixed(2)}`}
        unit="USD"
        icon={DollarSign}
        colorTheme="amber"
        statusText={`Effective Unit Cost: $${unitCost.toFixed(4)}/kWh`}
      />

      {/* 3. Clean Energy Share */}
      <MetricCard
        title="Clean Energy Share"
        value={`${cleanEnergyPct.toFixed(1)}%`}
        icon={Leaf}
        colorTheme="emerald"
        statusText="Authoritative backend sustainability rating"
      />

      {/* 4. Total Carbon Emissions */}
      <MetricCard
        title="Carbon Emissions"
        value={totalCarbon.toFixed(2)}
        unit="kg CO₂"
        icon={Activity}
        colorTheme="rose"
        statusText={`Carbon Intensity: ${carbonIntensity.toFixed(4)} kg/kWh`}
      />
    </div>
  );
};

export default AnalyticsOverviewCards;
