import React from 'react';
import { useGatewayStore } from '../../stores/gateway-store';
import { useAlertsStore } from '../../stores/alerts-store';
import { cn } from '../../lib/cn';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const connected = useGatewayStore((s) => s.connected);
  const unreadCount = useAlertsStore((s) => s.unreadCount);

  return (
    <header className="h-11 glass border-b border-white/5 flex items-center justify-between px-4 app-drag">
      <div className="flex items-center gap-3">
        <div className="w-[60px]" /> {/* Spacer for sidebar alignment */}
        <h1 className="text-sm font-medium text-gray-300 app-no-drag">{title}</h1>
      </div>

      <div className="flex items-center gap-3 app-no-drag">
        {/* Connection indicator */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-800/50 border border-white/5">
          <span className={cn(
            'w-1.5 h-1.5 rounded-full',
            connected ? 'bg-emerald-400 pulse-dot' : 'bg-gray-600'
          )} />
          <span className="text-[10px] text-gray-400">
            {connected ? 'Live' : 'Offline'}
          </span>
        </div>

        {/* Alert badge */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/30 border border-red-800/50">
            <span className="text-[10px] text-red-400 font-medium">{unreadCount} alert{unreadCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
    </header>
  );
};
