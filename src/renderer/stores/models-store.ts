import { create } from 'zustand';

interface ModelState {
  id: string;
  provider: string;
  displayName: string;
  status: 'healthy' | 'degraded' | 'down' | 'cooldown' | 'unknown';
  healthScore: number;
  components: {
    availability: number;
    latency: number;
    cost: number;
    stability: number;
    cooldown: number;
  };
  isInCooldown: boolean;
  lastSeen: number;
}

interface ModelsState {
  models: ModelState[];
  lastFetch: number;

  setModels: (models: ModelState[]) => void;
  updateModel: (modelId: string, updates: Partial<ModelState>) => void;
}

export const useModelsStore = create<ModelsState>((set) => ({
  models: [],
  lastFetch: 0,

  setModels: (models) => set({ models, lastFetch: Date.now() }),
  updateModel: (modelId, updates) =>
    set((state) => ({
      models: state.models.map((m) => (m.id === modelId ? { ...m, ...updates } : m)),
    })),
}));
