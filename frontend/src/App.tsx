import React, { useState } from 'react';
import { SystemHealthProvider } from './context/SystemHealthContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { NavTabId } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ForecastPage } from './pages/ForecastPage';
import { DispatchPage } from './pages/DispatchPage';
import { ModelPage } from './pages/ModelPage';
import { AnalyticsPage } from './pages/AnalyticsPage';

export default function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NavTabId>('dashboard');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'forecast':
        return <ForecastPage />;
      case 'dispatch':
        return <DispatchPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'model':
        return <ModelPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <SystemHealthProvider>
      <DashboardLayout activeTab={activeTab} onSelectTab={setActiveTab}>
        {renderActivePage()}
      </DashboardLayout>
    </SystemHealthProvider>
  );
}
