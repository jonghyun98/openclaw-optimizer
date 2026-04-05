import React, { useEffect } from 'react';
import { useAlertsStore } from '../stores/alerts-store';
import { useIpcEvent } from '../hooks/useIpcEvent';
import { ipc } from '../lib/ipc-client';
import { cn } from '../lib/cn';
import { formatTime } from '../lib/format';

const severityStyles: Record<string, string> = {
  critical: 'border-red-800 bg-red-950/30',
  warning: 'border-amber-800 bg-amber-950/20',
  info: 'border-blue-800 bg-blue-950/20',
};

const severityBadge: Record<string, string> = {
  critical: 'bg-red-900 text-red-300',
  warning: 'bg-amber-900 text-amber-300',
  info: 'bg-blue-900 text-blue-300',
};

export const AlertsPage: React.FC = () => {
  const { alerts, setAlerts, addAlert, acknowledgeAlert } = useAlertsStore();

  useIpcEvent('clawpilot:alert-new', (alert: any) => {
    addAlert(alert);
  });

  useEffect(() => {
    ipc.invoke<any[]>('clawpilot:alerts-list', { limit: 100, offset: 0 }).then((data) => {
      if (data) setAlerts(data);
    });
  }, [setAlerts]);

  const handleAck = (id?: number) => {
    if (id === undefined) return;
    ipc.invoke('clawpilot:alerts-ack', { id });
    acknowledgeAlert(id);
  };

  return (
    <div className="p-6 space-y-4 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold text-gray-100">Alerts</h2>

      {alerts.length === 0 ? (
        <div className="text-gray-500 text-sm py-8 text-center">No alerts yet. Alerts will appear when models go down or fallbacks occur.</div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={alert.id ?? i}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-opacity',
                severityStyles[alert.severity] ?? severityStyles.info,
                alert.acknowledged && 'opacity-50'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded uppercase', severityBadge[alert.severity])}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase">{alert.type.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-gray-600">{formatTime(alert.ts)}</span>
                </div>
                <p className="text-sm text-gray-200">{alert.message}</p>
                {alert.modelId && <p className="text-xs text-gray-500 mt-0.5">{alert.modelId}</p>}
              </div>
              {!alert.acknowledged && (
                <button
                  onClick={() => handleAck(alert.id)}
                  className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-800 transition-colors shrink-0"
                >
                  Dismiss
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
