import { create } from 'zustand';

interface GatewayState {
  connected: boolean;
  connId: string | null;
  serverVersion: string | null;
  uptime: number | null;
  url: string;
  reconnecting: boolean;
  lastError: string | null;

  updateStatus: (status: Partial<GatewayState>) => void;
}

export const useGatewayStore = create<GatewayState>((set) => ({
  connected: false,
  connId: null,
  serverVersion: null,
  uptime: null,
  url: 'ws://127.0.0.1:18789',
  reconnecting: false,
  lastError: null,

  updateStatus: (status) => set((state) => ({ ...state, ...status })),
}));
