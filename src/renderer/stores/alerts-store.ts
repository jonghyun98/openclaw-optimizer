import { create } from 'zustand';

interface Alert {
  id?: number;
  ts: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  modelId?: string;
  message: string;
  acknowledged: boolean;
}

interface AlertsState {
  alerts: Alert[];
  unreadCount: number;

  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  acknowledgeAlert: (id: number) => void;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  unreadCount: 0,

  addAlert: (alert) =>
    set((state) => {
      const alerts = [alert, ...state.alerts].slice(0, 100);
      return { alerts, unreadCount: state.unreadCount + 1 };
    }),

  setAlerts: (alerts) =>
    set({ alerts, unreadCount: alerts.filter((a) => !a.acknowledged).length }),

  acknowledgeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
