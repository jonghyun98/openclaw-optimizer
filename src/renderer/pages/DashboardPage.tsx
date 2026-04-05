import React, { useEffect, useState, useMemo } from 'react';
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
import { cn } from '../lib/cn';
import { formatCost, formatNumber } from '../lib/format';

export const DashboardPage: React.FC = () => {
  const setModels = useModelsStore((s) => s.setModels);
  const models = useModelsStore((s) => s.models);
  const onSnapshot = useMetricsStore((s) => s.onSnapshot);
  const addRequestLog = useMetricsStore((s) => s.addRequestLog);
  const metricsModels = useMetricsStore((s) => s.models);
  const updateGateway = useGatewayStore((s) => s.updateStatus);
  const connected = useGatewayStore((s) => s.connected);
  const [chainData, setChainData] = useState<any>(null);
  const [latencyHistory, setLatencyHistory] = useState<{ time: string; value: number }[]>([]);
  const [errorHistory, setErrorHistory] = useState<{ time: string; value: number }[]>([]);

  // Aggregate stats
  const stats = useMemo(() => {
    const m = Object.values(metricsModels);
    if (m.length === 0) return { totalRpm: 0, avgLatency: 0, avgError: 0, totalCostMin: 0 };
    return {
      totalRpm: m.reduce((s, v) => s + (v.rpm || 0), 0),
      avgLatency: m.reduce((s, v) => s + (v.latencyAvg || 0), 0) / m.length,
      avgError: m.reduce((s, v) => s + (v.errorRate || 0), 0) / m.length,
      totalCostMin: m.reduce((s, v) => s + (v.costPerMin || 0), 0),
    };
  }, [metricsModels]);

  useIpcEvent('clawpilot:metrics-snapshot', (data: any) => {
    onSnapshot(data);
    const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const mods = data.models;
    const vals = Object.values(mods) as any[];
    const avgLat = vals.length > 0 ? vals.reduce((s: number, m: any) => s + (m.latencyAvg || 0), 0) / vals.length : 0;
    const avgErr = vals.length > 0 ? vals.reduce((s: number, m: any) => s + (m.errorRate || 0), 0) / vals.length : 0;
    setLatencyHistory((prev) => [...prev.slice(-60), { time: now, value: Math.round(avgLat) }]);
    setErrorHistory((prev) => [...prev.slice(-60), { time: now, value: avgErr }]);
  });

  useIpcEvent('clawpilot:gateway-connection', (status: any) => updateGateway(status));
  useIpcEvent('clawpilot:request-log', (entry: any) => addRequestLog(entry));
  useIpcEvent('clawpilot:model-state-change', () => {
    ipc.invoke('clawpilot:models-list').then((m: any) => setModels(m ?? []));
  });

  useEffect(() => {
    if (connected) {
      ipc.invoke('clawpilot:models-list').then((m: any) => setModels(m ?? []));
      ipc.invoke('clawpilot:chain-get').then((c: any) => setChainData(c));
    }
  }, [connected, setModels]);

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-4 gap-3 fade-in">
        <StatCard label="Requests/min" value={stats.totalRpm.toFixed(1)} icon="↑" color="claw" />
        <StatCard label="Avg Latency" value={`${Math.round(stats.avgLatency)}ms`} icon="⚡" color="violet" />
        <StatCard label="Error Rate" value={`${(stats.avgError * 100).toFixed(1)}%`} icon="⚠" color={stats.avgError > 0.1 ? 'red' : 'emerald'} />
        <StatCard label="Cost/min" value={formatCost(stats.totalCostMin)} icon="$" color="amber" />
      </div>

      {/* Connection banner when disconnected */}
      {!connected && (
        <div className="glass-card rounded-xl p-6 text-center slide-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-claw-500/20 to-violet-600/20 flex items-center justify-center">
            <span className="text-3xl">🦞</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Connect to OpenClaw Gateway</h3>
          <p className="text-sm text-gray-500 mb-4">Start monitoring your AI models in real-time</p>
          <button
            onClick={() => ipc.invoke('clawpilot:gateway-connect')}
            className="px-5 py-2 bg-gradient-to-r from-claw-600 to-violet-600 hover:from-claw-500 hover:to-violet-500 text-white text-sm rounded-lg transition-all duration-300 font-medium glow-claw"
          >
            Connect
          </button>
        </div>
      )}

      {/* Model Health Grid */}
      {connected && (
        <>
          <div className="slide-up">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Model Health</h3>
              <span className="text-[10px] text-gray-600">{models.length} model{models.length !== 1 ? 's' : ''} monitored</span>
            </div>
            <ModelGrid />
          </div>

          {/* Fallback Chain */}
          <div className="slide-up">
            <FallbackChain chain={chainData?.current} recommended={chainData?.recommended} />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 slide-up">
            <LatencyChart data={latencyHistory} />
            <ErrorRateChart data={errorHistory} />
          </div>

          {/* Request Log */}
          <div className="slide-up">
            <RequestLog />
          </div>
        </>
      )}
    </div>
  );
};

const colorMap: Record<string, string> = {
  claw: 'from-claw-500/10 to-claw-600/5 border-claw-800/30',
  violet: 'from-violet-500/10 to-violet-600/5 border-violet-800/30',
  emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-800/30',
  red: 'from-red-500/10 to-red-600/5 border-red-800/30',
  amber: 'from-amber-500/10 to-amber-600/5 border-amber-800/30',
};

const textColorMap: Record<string, string> = {
  claw: 'text-claw-400',
  violet: 'text-violet-400',
  emerald: 'text-emerald-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string }> = ({ label, value, icon, color }) => (
  <div className={cn('rounded-xl border p-3 bg-gradient-to-br transition-all duration-300 hover:scale-[1.02]', colorMap[color])}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={cn('text-xs', textColorMap[color])}>{icon}</span>
    </div>
    <p className={cn('text-lg font-bold', textColorMap[color])}>{value}</p>
  </div>
);
