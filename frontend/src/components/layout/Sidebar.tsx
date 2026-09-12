import React from 'react';
import { LayoutDashboard, TrendingUp, Zap, Cpu, BarChart3, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useSystemHealth } from '../../hooks/useSystemHealth';

export type NavTabId = 'dashboard' | 'forecast' | 'dispatch' | 'model' | 'analytics';

interface NavItem {
  id: NavTabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'SCADA Command Center',
  },
  {
    id: 'forecast',
    label: 'Demand Forecast',
    icon: TrendingUp,
    description: 'AI Load Predictions',
  },
  {
    id: 'dispatch',
    label: 'Dispatch Optimization',
    icon: Zap,
    description: 'Multi-Asset PuLP LP',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Cost & Sustainability',
  },
  {
    id: 'model',
    label: 'AI Model',
    icon: Cpu,
    description: 'Architecture & Metrics',
  },
];

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen = true,
}) => {
  const { data, error } = useSystemHealth();

  const isOnline = Boolean(data && !error);
  const isDegraded = data?.status === 'degraded' || (data && (!data.model_loaded || !data.dataset_available));

  const guardStatusText = !isOnline ? 'Offline' : isDegraded ? 'Degraded' : 'Active';
  const guardStatusColor = !isOnline
    ? 'text-rose-700 border-rose-200 bg-rose-50'
    : isDegraded
    ? 'text-amber-700 border-amber-200 bg-amber-50'
    : 'text-emerald-700 border-emerald-200 bg-emerald-50';

  return (
    <aside
      className={`fixed md:static inset-y-0 left-0 z-40 w-[270px] shrink-0 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-16 px-6 flex items-center space-x-3 border-b border-gray-200 bg-white">
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-gray-900 tracking-tight text-lg">GridMind</span>
              <span className="text-emerald-700 font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                AI
              </span>
            </div>
            <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">
              Microgrid SCADA
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
            Navigation
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 shadow-xs'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-emerald-600' : 'text-gray-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="truncate text-[15px] font-semibold leading-snug">{item.label}</div>
                  <div className={`text-[13px] truncate leading-normal mt-0.5 ${isActive ? 'text-emerald-700/90 font-medium' : 'text-gray-500'}`}>{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footnote with live health data */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/70 space-y-2.5">
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-700">
            {isOnline ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            )}
            <span className="font-semibold text-xs text-gray-800">System Guard</span>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${guardStatusColor}`}>
            {guardStatusText}
          </span>
        </div>
        <div className="px-1 text-xs text-gray-500 flex items-center justify-between">
          <span>GridMind v{data?.version || '0.1.0'}</span>
          <span className="font-medium">{isOnline ? 'API Connected' : 'API Offline'}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
