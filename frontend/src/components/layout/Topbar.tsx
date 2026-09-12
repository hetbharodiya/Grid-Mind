import React, { useState, useEffect } from 'react';
import { Menu, Activity, Globe } from 'lucide-react';
import { NavTabId } from './Sidebar';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { ApiStatus } from '../common/ApiStatus';

interface TopbarProps {
  activeTab: NavTabId;
  onToggleSidebar?: () => void;
}

const pageTitles: Record<NavTabId, { title: string; breadcrumb: string }> = {
  dashboard: {
    title: 'Microgrid Command Center',
    breadcrumb: 'Operations / Overview',
  },
  forecast: {
    title: 'Demand Forecasting',
    breadcrumb: 'Analytics / 24-Hour Horizon',
  },
  dispatch: {
    title: 'Dispatch Optimization',
    breadcrumb: 'Optimization / Multi-Asset Solver',
  },
  analytics: {
    title: 'Microgrid Analytics & Sustainability',
    breadcrumb: 'Analytics / Cost & Sustainability',
  },
  model: {
    title: 'AI Model Intelligence',
    breadcrumb: 'Machine Learning / HistGradientBoosting',
  },
};

export const Topbar: React.FC<TopbarProps> = ({ activeTab, onToggleSidebar }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const { data, loading, error, refresh, isRetrying } = useSystemHealth();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const pageInfo = pageTitles[activeTab] || {
    title: 'Command Center',
    breadcrumb: 'Operations',
  };

  return (
    <header className="h-16 px-6 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 md:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <div className="text-xs md:text-[13px] font-semibold uppercase text-gray-500 tracking-wide">
            {pageInfo.breadcrumb}
          </div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: Telemetry, System Health & API Indicators */}
      <div className="flex items-center space-x-3">
        {/* Clock */}
        <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 font-mono text-xs md:text-sm shadow-xs">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{timeStr || '00:00:00'}</span>
        </div>

        {/* API Connection Indicator */}
        <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-xs md:text-[13px] font-mono shadow-xs">
          <Globe className="w-4 h-4 text-blue-600" />
          <span className="font-medium">API: 8000/api/v1</span>
        </div>

        {/* Live System Health Status Pill with Retry */}
        <ApiStatus
          data={data}
          loading={loading}
          error={error}
          onRetry={refresh}
          isRetrying={isRetrying}
        />
      </div>
    </header>
  );
};

export default Topbar;
