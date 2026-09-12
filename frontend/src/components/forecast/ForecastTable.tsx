import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ForecastStepItem } from '../../types/forecast';
import { SectionCard } from '../common/SectionCard';

interface ForecastTableProps {
  forecasts: ForecastStepItem[];
}

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const ForecastTable: React.FC<ForecastTableProps> = ({ forecasts }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Derive maximum demand for proportional relative load indicator
  const maxDemand = useMemo(() => {
    if (!forecasts.length) return 1.0;
    return Math.max(...forecasts.map((f) => f.predicted_demand_kwh), 0.0001);
  }, [forecasts]);

  return (
    <SectionCard
      title="Chronological Step Breakdown"
      subtitle="Detailed 24-hour hourly load trajectory with relative load proportion"
      badge={
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
          {forecasts.length} Hourly Steps
        </span>
      }
      actions={
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-xs md:text-sm font-semibold text-gray-700 border border-gray-300 transition-colors shadow-xs"
        >
          <span>{isExpanded ? 'Hide Steps' : 'Show Steps'}</span>
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
                <th className="py-3 px-3.5 font-bold">Step</th>
                <th className="py-3 px-3.5 font-bold">Timestamp</th>
                <th className="py-3 px-3.5 font-bold">Hour</th>
                <th className="py-3 px-3.5 font-bold">Day</th>
                <th className="py-3 px-3.5 font-bold text-right">Predicted Demand</th>
                <th className="py-3 px-3.5 font-bold w-44">Relative Load</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forecasts.map((item) => {
                const loadPercentage = Math.min(
                  100,
                  Math.max(0, (item.predicted_demand_kwh / maxDemand) * 100)
                );
                const isPeak = item.predicted_demand_kwh === maxDemand;

                return (
                  <tr
                    key={item.step}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      isPeak ? 'bg-rose-50/40' : ''
                    }`}
                  >
                    {/* Step */}
                    <td className="py-2.5 px-3.5 text-gray-900 font-bold">
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
                        #{item.step}
                      </span>
                    </td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3.5 text-gray-700 whitespace-nowrap font-medium">
                      {item.timestamp}
                    </td>

                    {/* Hour */}
                    <td className="py-2.5 px-3.5 text-gray-900 font-bold">
                      {String(item.hour).padStart(2, '0')}:00
                    </td>

                    {/* Day */}
                    <td className="py-2.5 px-3.5 text-gray-600 font-sans font-medium">
                      {DAY_NAMES[item.day_of_week] || `Day ${item.day_of_week}`}
                    </td>

                    {/* Predicted Demand */}
                    <td className="py-2.5 px-3.5 text-right font-mono">
                      <span
                        className={`font-bold text-xs md:text-sm ${
                          isPeak ? 'text-rose-600 font-extrabold' : 'text-sky-700'
                        }`}
                      >
                        {item.predicted_demand_kwh.toFixed(4)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1 font-medium">kWh</span>
                    </td>

                    {/* Load Indicator Micro-bar */}
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPeak
                                ? 'bg-rose-500'
                                : loadPercentage > 75
                                ? 'bg-amber-500'
                                : 'bg-sky-500'
                            }`}
                            style={{ width: `${loadPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-10 text-right font-mono">
                          {loadPercentage.toFixed(0)}%
                        </span>
                      </div>
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

export default ForecastTable;
