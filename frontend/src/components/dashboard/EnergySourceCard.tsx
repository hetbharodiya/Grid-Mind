import React from 'react';

export type AssetTheme = 'amber' | 'sky' | 'violet' | 'indigo' | 'emerald' | 'rose';

interface EnergySourceCardProps {
  name: string;
  value: number | string;
  unit?: string;
  percentage: number;
  icon: React.ElementType;
  colorTheme: AssetTheme;
  status: string;
  capacityInfo?: string;
}

const themeStyles: Record<
  AssetTheme,
  {
    iconBg: string;
    iconColor: string;
    barBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }
> = {
  amber: {
    iconBg: 'bg-amber-50 border-amber-200',
    iconColor: 'text-amber-600',
    barBg: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
  },
  sky: {
    iconBg: 'bg-cyan-50 border-cyan-200',
    iconColor: 'text-cyan-600',
    barBg: 'bg-cyan-500',
    badgeBg: 'bg-cyan-50',
    badgeText: 'text-cyan-700',
    badgeBorder: 'border-cyan-200',
  },
  violet: {
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    barBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  indigo: {
    iconBg: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    barBg: 'bg-blue-500',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
  },
  emerald: {
    iconBg: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    barBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
  },
  rose: {
    iconBg: 'bg-rose-50 border-rose-200',
    iconColor: 'text-rose-600',
    barBg: 'bg-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
  },
};

export const EnergySourceCard: React.FC<EnergySourceCardProps> = ({
  name,
  value,
  unit = 'kWh',
  percentage,
  icon: Icon,
  colorTheme,
  status,
  capacityInfo,
}) => {
  const styles = themeStyles[colorTheme] || themeStyles.emerald;
  const clampedPct = Math.min(100, Math.max(0, percentage));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-card flex flex-col justify-between hover:border-gray-300 hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg border ${styles.iconBg} ${styles.iconColor}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 tracking-tight">{name}</h4>
              {capacityInfo && (
                <span className="text-xs text-gray-500 font-medium font-mono block mt-0.5">{capacityInfo}</span>
              )}
            </div>
          </div>

          <span
            className={`text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md border ${styles.badgeBg} ${styles.badgeText} ${styles.badgeBorder}`}
          >
            {status}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-2xl md:text-3xl font-bold font-mono text-gray-900 tracking-tight">
              {value}
            </span>
            <span className="text-sm font-mono text-gray-500 font-medium">{unit}</span>
          </div>
          <span className="text-xs md:text-sm font-mono font-bold text-gray-800">
            {clampedPct}% <span className="text-gray-400 font-normal">of mix</span>
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${styles.barBg}`}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnergySourceCard;
