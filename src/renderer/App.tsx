import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { DashboardPage } from './pages/DashboardPage';
import { OptimizerPage } from './pages/OptimizerPage';
import { AlertsPage } from './pages/AlertsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CostPage } from './pages/CostPage';
import { SimulatorPage } from './pages/SimulatorPage';

const pageNames: Record<string, string> = {
  dashboard: 'Dashboard',
  optimizer: 'Fallback Optimizer',
  cost: 'Cost Analytics',
  alerts: 'Alerts',
  simulator: 'Fallback Simulator',
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
        return <OptimizerPage />;
      case 'cost':
        return <CostPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'simulator':
        return <SimulatorPage />;
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
