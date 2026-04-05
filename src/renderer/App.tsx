import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { DashboardPage } from './pages/DashboardPage';
import { SettingsPage } from './pages/SettingsPage';

const pageNames: Record<string, string> = {
  dashboard: 'Dashboard',
  optimizer: 'Fallback Optimizer',
  alerts: 'Alerts',
  settings: 'Settings',
};

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'settings':
        return <SettingsPage />;
      case 'optimizer':
        return (
          <div className="p-6 text-gray-500 text-sm">
            Fallback Optimizer — coming in Phase 2
          </div>
        );
      case 'alerts':
        return (
          <div className="p-6 text-gray-500 text-sm">
            Alerts — coming in Phase 2
          </div>
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <Header title={pageNames[activeTab] ?? 'ClawPilot'} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-hidden">{renderPage()}</main>
      </div>
      <StatusBar />
    </div>
  );
};
