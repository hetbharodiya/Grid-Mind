import React from 'react';

export type MetricColorTheme = 'white' | 'emerald' | 'sky' | 'amber' | 'violet' | 'indigo' | 'rose';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  statusText?: string;
  colorTheme?: MetricColorTheme;
}

const colorStyles: Record<
  MetricColorTheme,
  { iconBg: string; iconColor: string; valueColor: string; borderHover: string }
> = {
  white: {
    iconBg: 'bg-gray-50 text-gray-700 border-gray-200',
    iconColor: 'text-gray-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-gray-300',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    iconColor: 'text-emerald-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-emerald-300',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
    iconColor: 'text-sky-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-sky-300',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    iconColor: 'text-amber-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-amber-300',
  },
  violet: {
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    iconColor: 'text-purple-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-purple-300',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    iconColor: 'text-indigo-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-indigo-300',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
    iconColor: 'text-rose-600',
    valueColor: 'text-gray-900',
    borderHover: 'hover:border-rose-300',
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  statusText,
  colorTheme = 'white',
}) => {
  const styles = colorStyles[colorTheme] || colorStyles.white;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] hover:shadow-[0_4px_6px_-1px_rgba(16,24,40,0.08)] transition-all duration-200 ${styles.borderHover} flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between min-w-0 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-[13px] font-semibold text-gray-500 uppercase tracking-wider font-sans truncate">
            {title}
          </p>
          <div className="mt-2 flex items-baseline space-x-1.5 min-w-0 flex-wrap">
            <span className={`text-2xl lg:text-[30px] font-bold font-mono tracking-tight leading-tight break-words [overflow-wrap:anywhere] ${styles.valueColor}`}>
              {value}
            </span>
            {unit && (
              <span className="text-xs md:text-sm font-semibold text-gray-500 font-sans ml-1 shrink-0">
                {unit}
              </span>
            )}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border shadow-sm shrink-0 ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs md:text-[13px]">
        {trend ? (
          <div className="flex items-center space-x-1.5">
            <span
              className={`font-semibold font-mono ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-gray-500 text-xs md:text-[13px]">{trend.label}</span>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-xs md:text-[13px] font-medium">Telemetry Verified</span>
        )}

        {statusText && (
          <span className="text-xs md:text-[13px] font-medium text-gray-700 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
            {statusText}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
