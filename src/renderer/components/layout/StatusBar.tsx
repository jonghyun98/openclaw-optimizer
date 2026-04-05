import React, { useState, useEffect } from 'react';
import { useGatewayStore } from '../../stores/gateway-store';
import { useMetricsStore } from '../../stores/metrics-store';
import { cn } from '../../lib/cn';
import { formatDuration } from '../../lib/format';

export const StatusBar: React.FC = () => {
  const { connected, reconnecting, url, serverVersion, uptime } = useGatewayStore();
  const lastUpdate = useMetricsStore((s) => s.lastUpdate);
  const modelCount = useMetricsStore((s) => Object.keys(s.models).length);
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="h-6 glass border-t border-white/5 flex items-center px-3 text-[10px] text-gray-600 gap-4">
      {/* Connection */}
      <div className="flex items-center gap-1.5">
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          connected ? 'bg-emerald-500' : reconnecting ? 'bg-amber-500 pulse-dot' : 'bg-gray-700'
        )} />
        <span>{connected ? url : reconnecting ? 'Reconnecting...' : 'Disconnected'}</span>
      </div>

      {serverVersion && <span>Gateway v{serverVersion}</span>}
      {connected && uptime && <span>Uptime: {formatDuration(uptime)}</span>}
      {modelCount > 0 && <span>{modelCount} model{modelCount > 1 ? 's' : ''}</span>}
      {lastUpdate > 0 && <span>Last update: {new Date(lastUpdate).toLocaleTimeString('en-US', { hour12: false })}</span>}

      <span className="ml-auto">{clock.toLocaleTimeString('en-US', { hour12: false })}</span>
      <span className="text-gray-700">|</span>
      <span>ClawPilot v0.1.0</span>
    </footer>
  );
};
