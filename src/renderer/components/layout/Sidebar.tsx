import React from 'react';
import { cn } from '../../lib/cn';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'optimizer', label: 'Optimizer', icon: '⚡' },
  { id: 'cost', label: 'Cost Analytics', icon: '💰' },
  { id: 'simulator', label: 'Simulator', icon: '🧪' },
  { id: 'alerts', label: 'Alerts', icon: '🔔' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <aside className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 gap-2">
      <div className="text-2xl mb-4" title="ClawPilot">🦞</div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onTabChange(item.id)}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors',
            activeTab === item.id
              ? 'bg-claw-600 text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
          )}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </aside>
  );
};
