import React from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(16,24,40,0.06)] hover:shadow-[0_4px_6px_-1px_rgba(16,24,40,0.08)] transition-shadow duration-200 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4 border-b border-gray-100 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3 flex-wrap gap-y-1.5">
            <h3 className="text-base md:text-lg font-bold tracking-tight text-gray-900">
              {title}
            </h3>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default SectionCard;
