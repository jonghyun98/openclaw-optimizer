import { create } from 'zustand';

interface ModelMetrics {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  latencyAvg: number;
  errorRate: number;
  rpm: number;
  costPerMin: number;
  totalRequests: number;
  totalErrors: number;
}

interface RequestLogEntry {
  ts: number;
  modelId: string;
  channel?: string;
  success: boolean;
  latencyMs: number;
  costUsd?: number;
  errorCode?: string;
  wasFallback: boolean;
}

interface MetricsState {
  models: Record<string, ModelMetrics>;
  requestLog: RequestLogEntry[];
  lastUpdate: number;
  maxLogEntries: number;

  onSnapshot: (snapshot: { models: Record<string, ModelMetrics>; ts: number }) => void;
  addRequestLog: (entry: RequestLogEntry) => void;
}

export const useMetricsStore = create<MetricsState>((set) => ({
  models: {},
  requestLog: [],
  lastUpdate: 0,
  maxLogEntries: 500,

  onSnapshot: (snapshot) => {
    set({ models: snapshot.models, lastUpdate: snapshot.ts });
  },

  addRequestLog: (entry) => {
    set((state) => ({
      requestLog: [entry, ...state.requestLog].slice(0, state.maxLogEntries),
    }));
  },
}));
