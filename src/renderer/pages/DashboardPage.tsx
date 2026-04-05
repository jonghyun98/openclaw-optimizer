import React, { useEffect, useState } from 'react';
import { ModelGrid } from '../components/dashboard/ModelGrid';
import { FallbackChain } from '../components/dashboard/FallbackChain';
import { RequestLog } from '../components/dashboard/RequestLog';
import { LatencyChart } from '../components/charts/LatencyChart';
import { ErrorRateChart } from '../components/charts/ErrorRateChart';
import { useModelsStore } from '../stores/models-store';
import { useMetricsStore } from '../stores/metrics-store';
import { useGatewayStore } from '../stores/gateway-store';
import { useIpcEvent } from '../hooks/useIpcEvent';
import { ipc } from '../lib/ipc-client';

export const DashboardPage: React.FC = () => {
  const setModels = useModelsStore((s) => s.setModels);
  const onSnapshot = useMetricsStore((s) => s.onSnapshot);
  const addRequestLog = useMetricsStore((s) => s.addRequestLog);
  const updateGateway = useGatewayStore((s) => s.updateStatus);
  const connected = useGatewayStore((s) => s.connected);
  const [chainData, setChainData] = useState<any>(null);
  const [latencyHistory, setLatencyHistory] = useState<{ time: string; value: number }[]>([]);
  const [errorHistory, setErrorHistory] = useState<{ time: string; value: number }[]>([]);

  // Subscribe to IPC events
  useIpcEvent('clawpilot:metrics-snapshot', (data: any) => {
    onSnapshot(data);

    // Update chart history
    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const models = data.models;
    const avgLatency = Object.values(models).reduce((sum: number, m: any) => sum + (m.latencyAvg || 0), 0) / Math.max(Object.keys(models).length, 1);
    const avgError = Object.values(models).reduce((sum: number, m: any) => sum + (m.errorRate || 0), 0) / Math.max(Object.keys(models).length, 1);

    setLatencyHistory((prev) => [...prev.slice(-60), { time: now, value: Math.round(avgLatency) }]);
    setErrorHistory((prev) => [...prev.slice(-60), { time: now, value: avgError }]);
  });

  useIpcEvent('clawpilot:gateway-connection', (status: any) => {
    updateGateway(status);
  });

  useIpcEvent('clawpilot:request-log', (entry: any) => {
    addRequestLog(entry);
  });

  useIpcEvent('clawpilot:model-state-change', () => {
    // Refresh model list on state change
    ipc.invoke('clawpilot:models-list').then((models: any) => setModels(models ?? []));
  });

  // Initial data fetch
  useEffect(() => {
    if (connected) {
      ipc.invoke('clawpilot:models-list').then((models: any) => setModels(models ?? []));
      ipc.invoke('clawpilot:chain-get').then((chain: any) => setChainData(chain));
    }
  }, [connected, setModels]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Model Health Overview</h2>
        {!connected && (
          <button
            onClick={() => ipc.invoke('clawpilot:gateway-connect')}
            className="px-3 py-1.5 bg-claw-600 hover:bg-claw-700 text-white text-sm rounded-lg transition-colors"
          >
            Connect to Gateway
          </button>
        )}
      </div>

      <ModelGrid />

      <FallbackChain
        chain={chainData?.current}
        recommended={chainData?.recommended}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LatencyChart data={latencyHistory} />
        <ErrorRateChart data={errorHistory} />
      </div>

      <RequestLog />
    </div>
  );
};
