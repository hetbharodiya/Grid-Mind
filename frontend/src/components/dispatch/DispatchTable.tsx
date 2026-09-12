import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { HourlyDispatchStep } from '../../types/dispatch';
import { SectionCard } from '../common/SectionCard';

interface DispatchTableProps {
  hourlySteps: HourlyDispatchStep[];
}

export const DispatchTable: React.FC<DispatchTableProps> = ({ hourlySteps }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <SectionCard
      title="Chronological 24-Hour Dispatch Schedule"
      subtitle="Comprehensive hourly energy allocation, battery SoC evolution, costs, and solver diagnostics"
      badge={
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
          {hourlySteps.length} Hourly Intervals
        </span>
      }
      actions={
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-xs md:text-sm font-semibold text-gray-700 border border-gray-300 transition-colors shadow-xs"
        >
          <span>{isExpanded ? 'Hide Schedule' : 'Show Schedule'}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-1 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
          )}
        </button>
      }
    >
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 uppercase text-xs md:text-[13px] tracking-wider font-bold">
                <th className="py-3 px-3.5 font-bold">Hour</th>
                <th className="py-3 px-3.5 font-bold">Time</th>
                <th className="py-3 px-3.5 font-bold text-right">Demand</th>
                <th className="py-3 px-3.5 font-bold text-right text-amber-700">Solar</th>
                <th className="py-3 px-3.5 font-bold text-right text-cyan-700">Wind</th>
                <th className="py-3 px-3.5 font-bold text-right text-emerald-700">Battery</th>
                <th className="py-3 px-3.5 font-bold text-right text-blue-700">Grid</th>
                <th className="py-3 px-3.5 font-bold text-right text-slate-700">Diesel</th>
                <th className="py-3 px-3.5 font-bold text-right text-emerald-700">SoC</th>
                <th className="py-3 px-3.5 font-bold text-right text-amber-700">Cost ($)</th>
                <th className="py-3 px-3.5 font-bold text-right text-teal-700">CO₂ (kg)</th>
                <th className="py-3 px-3.5 font-bold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hourlySteps.map((step) => {
                let displayTime = `H${step.hour_number}`;
                if (step.timestamp && step.timestamp.includes('T')) {
                  displayTime = step.timestamp.split('T')[1].substring(0, 5);
                }

                const socPct = (step.battery_soc_after_dispatch * 100).toFixed(1);

                return (
                  <tr
                    key={step.hour_number}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    {/* Hour Number */}
                    <td className="py-2.5 px-3.5 text-gray-900 font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        #{step.hour_number}
                      </span>
                    </td>

                    {/* Time */}
                    <td className="py-2.5 px-3.5 text-gray-700 whitespace-nowrap font-medium">
                      {displayTime}
                    </td>

                    {/* Predicted Demand */}
                    <td className="py-2.5 px-3.5 text-right font-bold text-sky-700 font-mono">
                      {step.predicted_demand_kwh.toFixed(2)}
                    </td>

                    {/* Solar Used */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={
                          step.solar_used_kwh > 0 ? 'text-amber-700 font-bold' : 'text-gray-400'
                        }
                      >
                        {step.solar_used_kwh.toFixed(2)}
                      </span>
                    </td>

                    {/* Wind Used */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={
                          step.wind_used_kwh > 0 ? 'text-cyan-700 font-bold' : 'text-gray-400'
                        }
                      >
                        {step.wind_used_kwh.toFixed(2)}
                      </span>
                    </td>

                    {/* Battery Used */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={
                          step.battery_used_kwh > 0 ? 'text-emerald-700 font-bold' : 'text-gray-400'
                        }
                      >
                        {step.battery_used_kwh.toFixed(2)}
                      </span>
                    </td>

                    {/* Grid Used */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={
                          step.grid_used_kwh > 0 ? 'text-blue-700 font-bold' : 'text-gray-400'
                        }
                      >
                        {step.grid_used_kwh.toFixed(2)}
                      </span>
                    </td>

                    {/* Diesel Used */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={
                          step.diesel_used_kwh > 0 ? 'text-slate-700 font-bold' : 'text-gray-400'
                        }
                      >
                        {step.diesel_used_kwh.toFixed(2)}
                      </span>
                    </td>

                    {/* Battery SoC */}
                    <td className="py-2.5 px-3.5 text-right text-emerald-700 font-bold font-mono">
                      {socPct}%
                    </td>

                    {/* Cost */}
                    <td className="py-2.5 px-3.5 text-right text-amber-700 font-semibold font-mono">
                      ${step.hourly_cost_usd.toFixed(2)}
                    </td>

                    {/* Carbon */}
                    <td className="py-2.5 px-3.5 text-right text-teal-700 font-semibold font-mono">
                      {step.hourly_carbon_kg.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Sparkles className="w-3 h-3 mr-1" />
                        {step.solver_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
};

export default DispatchTable;
