import React from 'react';
import { useGatewayStore } from '../../stores/gateway-store';
import { cn } from '../../lib/cn';

export const StatusBar: React.FC = () => {
  const { connected, reconnecting, url, serverVersion, lastError } = useGatewayStore();

  const statusText = connected
    ? `Connected to ${url}`
    : reconnecting
      ? 'Reconnecting...'
      : 'Disconnected';

  const statusColor = connected
    ? 'bg-emerald-400'
    : reconnecting
      ? 'bg-amber-400'
      : 'bg-red-400';

  return (
    <footer className="h-7 bg-gray-900 border-t border-gray-800 flex items-center px-3 text-xs text-gray-500 gap-3">
      <div className="flex items-center gap-1.5">
        <span className={cn('w-2 h-2 rounded-full', statusColor)} />
        <span>{statusText}</span>
      </div>
      {serverVersion && <span>Gateway v{serverVersion}</span>}
      {lastError && !connected && (
        <span className="text-red-400 ml-auto">{lastError}</span>
      )}
      <span className="ml-auto">ClawPilot v0.1.0</span>
    </footer>
  );
};
