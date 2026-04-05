import { ipcMain } from 'electron';
import { IPC } from '../shared/ipc-channels';
import type { GatewayClient } from './gateway/client';
import type { MetricsEngine } from './metrics/engine';
import type { HealthScorer } from './optimizer/health-scorer';
import type { ChainOptimizer } from './optimizer/chain-optimizer';
import type { AlertManager } from './alerts/manager';
import { CostTracker } from './metrics/cost-tracker';

interface Services {
  gatewayClient: GatewayClient;
  metricsEngine: MetricsEngine;
  healthScorer: HealthScorer;
  chainOptimizer: ChainOptimizer;
  alertManager: AlertManager;
}

export function registerIpcHandlers(services: Services): void {
  const { gatewayClient, metricsEngine, healthScorer, chainOptimizer, alertManager } = services;
  const costTracker = new CostTracker();

  ipcMain.handle(IPC.GATEWAY_CONNECT, async (_event, opts?: { url?: string; token?: string }) => {
    try {
      await gatewayClient.connect(opts?.url, opts?.token);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle(IPC.GATEWAY_DISCONNECT, async () => {
    gatewayClient.disconnect();
    return { ok: true };
  });

  ipcMain.handle(IPC.GATEWAY_STATUS, () => {
    return gatewayClient.getStatus();
  });

  ipcMain.handle(IPC.MODELS_LIST, () => {
    return healthScorer.getAllModelStates();
  });

  ipcMain.handle(IPC.METRICS_QUERY, (_event, params: { modelId?: string; from: number; to: number }) => {
    return metricsEngine.queryMetrics(params);
  });

  ipcMain.handle(IPC.CHAIN_GET, () => {
    return healthScorer.getChainRecommendation();
  });

  ipcMain.handle(IPC.ALERTS_LIST, (_event, params: { limit?: number; offset?: number }) => {
    return alertManager.getAlerts(params.limit ?? 50, params.offset ?? 0);
  });

  ipcMain.handle(IPC.ALERTS_ACK, (_event, params: { id: number }) => {
    alertManager.acknowledge(params.id);
    return { ok: true };
  });

  ipcMain.handle(IPC.SETTINGS_GET, (_event, params: { key: string }) => {
    return metricsEngine.getSetting(params.key);
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, params: { key: string; value: unknown }) => {
    metricsEngine.setSetting(params.key, params.value);
    return { ok: true };
  });

  ipcMain.handle(IPC.COST_SUMMARY, (_event, params: { from: number; to: number }) => {
    return costTracker.getSummary(params.from, params.to);
  });

  ipcMain.handle(IPC.CHAIN_APPLY, (_event, params: { primary: string; fallbacks: string[] }) => {
    chainOptimizer.applyChain({ primary: params.primary, fallbacks: params.fallbacks });
    return { ok: true };
  });
}
