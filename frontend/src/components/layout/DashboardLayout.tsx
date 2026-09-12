import React, { useState } from 'react';
import { Sidebar, NavTabId } from './Sidebar';
import { Topbar } from './Topbar';

interface DashboardLayoutProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const handleSelectTab = (tab: NavTabId) => {
    onSelectTab(tab);
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-[#111827] flex flex-col md:flex-row antialiased selection:bg-emerald-500 selection:text-white">
      {/* Sidebar for Desktop & Mobile Overlay */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isOpen={isMobileSidebarOpen}
      />

      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          activeTab={activeTab}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
