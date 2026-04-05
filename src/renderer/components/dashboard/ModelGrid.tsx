import React from 'react';
import { ModelCard } from './ModelCard';
import { useModelsStore } from '../../stores/models-store';
import { useMetricsStore } from '../../stores/metrics-store';

export const ModelGrid: React.FC = () => {
  const models = useModelsStore((s) => s.models);
  const metricsMap = useMetricsStore((s) => s.models);

  if (models.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No models detected. Connect to OpenClaw Gateway to start monitoring.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {models.map((model) => {
        const metrics = metricsMap[model.id];
        return (
          <ModelCard
            key={model.id}
            id={model.id}
            displayName={model.displayName}
            status={model.status}
            healthScore={model.healthScore}
            latencyAvg={metrics?.latencyAvg ?? 0}
            errorRate={metrics?.errorRate ?? 0}
            costPerMin={metrics?.costPerMin ?? 0}
            rpm={metrics?.rpm ?? 0}
          />
        );
      })}
    </div>
  );
};
