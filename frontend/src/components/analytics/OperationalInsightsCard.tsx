import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, ArrowDownRight, Layers, Leaf, DollarSign, BatteryCharging } from 'lucide-react';
import { DailyDispatchSummary, HourlyDispatchStep } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface OperationalInsightsCardProps {
  summary: DailyDispatchSummary;
  hourlySteps: HourlyDispatchStep[];
  socTrajectory: number[];
}

export const OperationalInsightsCard: React.FC<OperationalInsightsCardProps> = ({
  summary,
  hourlySteps,
  socTrajectory,
}) => {
  const insights = useMemo(() => {
    const list = [];
    const totalSupplied = summary.total_supplied_energy_kwh || 0;
    const totalPredicted = summary.total_predicted_demand_kwh || 0;
    const totalCost = summary.total_operational_cost_usd || 0;
    const totalCarbon = summary.total_carbon_emissions_kg || 0;
    const cleanPct = summary.average_clean_energy_percentage || 0;
    const unitCost = totalSupplied > 0 ? totalCost / totalSupplied : 0;
    const carbonIntensity = totalSupplied > 0 ? totalCarbon / totalSupplied : 0;

    // 1. Peak Demand Dynamic Insight
    let peakDemand = 0;
    let peakStep = hourlySteps[0] || null;
    let valleyDemand = Infinity;
    let valleyStep = hourlySteps[0] || null;

    for (const step of hourlySteps) {
      if (step.predicted_demand_kwh > peakDemand) {
        peakDemand = step.predicted_demand_kwh;
        peakStep = step;
      }
      if (step.predicted_demand_kwh < valleyDemand) {
        valleyDemand = step.predicted_demand_kwh;
        valleyStep = step;
      }
    }

    const fulfillmentPct = totalPredicted > 0
      ? Math.min(100, (totalSupplied / totalPredicted) * 100)
      : 0;

    if (peakStep) {
      list.push({
        id: 'peak-demand',
        title: 'Peak Load Profile & Satisfaction',
        icon: TrendingUp,
        color: 'text-rose-600 bg-rose-50 border-rose-200',
        content: `Peak load of ${peakDemand.toFixed(2)} kWh was recorded at Step ${peakStep.hour_number} (${peakStep.timestamp}). Total microgrid demand fulfillment achieved ${fulfillmentPct.toFixed(1)}% with ${summary.total_unmet_demand_kwh.toFixed(2)} kWh unmet demand.`,
      });
    }

    // 2. Valley Baseload Dynamic Insight
    if (valleyStep && valleyDemand !== Infinity) {
      list.push({
        id: 'valley-demand',
        title: 'Minimum Baseload Valley',
        icon: ArrowDownRight,
        color: 'text-sky-600 bg-sky-50 border-sky-200',
        content: `Minimum baseload demand of ${valleyDemand.toFixed(2)} kWh occurred at Step ${valleyStep.hour_number} (${valleyStep.timestamp}), defining the 24-hour minimum operational generation threshold.`,
      });
    }

    // 3. Dominant Dispatched Asset (Argmax)
    const assets = [
      { name: 'Solar PV', kwh: summary.total_solar_used_kwh || 0 },
      { name: 'Wind Generation', kwh: summary.total_wind_used_kwh || 0 },
      { name: 'Battery ESS', kwh: summary.total_battery_used_kwh || 0 },
      { name: 'Utility Grid', kwh: summary.total_grid_used_kwh || 0 },
      { name: 'Backup Diesel', kwh: summary.total_diesel_used_kwh || 0 },
    ];

    const dominant = assets.reduce((max, current) => (current.kwh > max.kwh ? current : max), assets[0]);
    const dominantPct = totalSupplied > 0 ? (dominant.kwh / totalSupplied) * 100 : 0;

    list.push({
      id: 'dominant-asset',
      title: 'Dominant Dispatched Generation Asset',
      icon: Layers,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      content: `${dominant.name} served as the primary energy provider, dispatching ${dominant.kwh.toFixed(2)} kWh (${dominantPct.toFixed(1)}% of total supplied energy) to meet the scheduled microgrid load.`,
    });

    // 4. Sustainability & Carbon Emissions Rating
    list.push({
      id: 'sustainability-rating',
      title: 'Sustainability & Operational Carbon Rating',
      icon: Leaf,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      content: `Microgrid operations achieved an authoritative ${cleanPct.toFixed(1)}% clean energy rating. Total operational carbon generated was ${totalCarbon.toFixed(2)} kg CO₂, yielding a carbon intensity of ${carbonIntensity.toFixed(4)} kg CO₂/kWh delivered.`,
    });

    // 5. Levelized Financial Efficiency
    list.push({
      id: 'cost-efficiency',
      title: 'Levelized Financial Dispatch Efficiency',
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      content: `Optimal multi-asset dispatch delivered a total 24-hour operational spend of $${totalCost.toFixed(2)} USD, yielding an effective levelized unit energy cost of $${unitCost.toFixed(4)}/kWh under ${summary.optimization_mode} optimization.`,
    });

    // 6. Battery Storage Telemetry & Cycling
    const startSoc = (summary.starting_battery_soc <= 1.0 ? summary.starting_battery_soc * 100 : summary.starting_battery_soc) || 0;
    const endSoc = (summary.ending_battery_soc <= 1.0 ? summary.ending_battery_soc * 100 : summary.ending_battery_soc) || 0;
    const netSocDelta = endSoc - startSoc;

    let minSoc = startSoc;
    let maxSoc = startSoc;
    if (socTrajectory && socTrajectory.length > 0) {
      const pcts = socTrajectory.map((v) => (v <= 1.0 ? v * 100 : v));
      minSoc = Math.min(...pcts);
      maxSoc = Math.max(...pcts);
    }

    list.push({
      id: 'battery-telemetry',
      title: 'Electrochemical Storage State & Cycling',
      icon: BatteryCharging,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      content: `Battery State of Charge shifted from ${startSoc.toFixed(1)}% starting SoC to ${endSoc.toFixed(1)}% ending SoC (net delta: ${netSocDelta > 0 ? `+${netSocDelta.toFixed(1)}` : netSocDelta.toFixed(1)}%), operating within an observed dynamic range of ${minSoc.toFixed(1)}% to ${maxSoc.toFixed(1)}% while dispatching ${summary.total_battery_used_kwh.toFixed(2)} kWh.`,
    });

    return list;
  }, [summary, hourlySteps, socTrajectory]);

  return (
    <SectionCard
      title="Deterministic Operations & Sustainability Intelligence"
      subtitle="Algorithmic telemetry audit statements programmatically synthesized from live optimization results"
      badge={
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>{insights.length} Verified Insights</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-white border border-gray-200 space-y-2.5 flex flex-col justify-between hover:border-gray-300 transition-colors shadow-sm"
            >
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm sm:text-base font-bold text-gray-900 tracking-tight font-sans">
                  {item.title}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 font-sans leading-relaxed">
                {item.content}
              </p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
};

export default OperationalInsightsCard;
