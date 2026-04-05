import React, { useState, useEffect } from 'react';
import { ChainComparison } from '../components/optimizer/ChainComparison';
import { WeightSliders } from '../components/optimizer/WeightSliders';
import { TaskRoutingTable } from '../components/optimizer/TaskRoutingTable';
import { useModelsStore } from '../stores/models-store';
import { useGatewayStore } from '../stores/gateway-store';
import { useIpcEvent } from '../hooks/useIpcEvent';
import { ipc } from '../lib/ipc-client';

const DEFAULT_WEIGHTS = {
  availability: 0.35,
  latency: 0.25,
  cost: 0.15,
  stability: 0.15,
  cooldown: 0.10,
};

const TASK_CATEGORIES = ['simple', 'code', 'analysis', 'creative', 'multimodal'];
const TASK_LABELS: Record<string, string> = {
  simple: 'Simple Q&A',
  code: 'Code',
  analysis: 'Analysis',
  creative: 'Creative',
  multimodal: 'Multimodal',
};

export const OptimizerPage: React.FC = () => {
  const connected = useGatewayStore((s) => s.connected);
  const models = useModelsStore((s) => s.models);
  const [chainData, setChainData] = useState<any>(null);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [autoMode, setAutoMode] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useIpcEvent('clawpilot:chain-recommendation', (rec: any) => {
    setChainData(rec);
  });

  useEffect(() => {
    if (connected) {
      ipc.invoke('clawpilot:chain-get').then((data: any) => setChainData(data));
    }
  }, [connected]);

  const handleApply = async () => {
    if (!chainData?.recommended) return;
    try {
      const result = await ipc.invoke<{ ok: boolean; error?: string }>('clawpilot:chain-apply', {
        chain: chainData.recommended,
      });
      if (result.ok) {
        setStatusMsg('Chain applied!');
        ipc.invoke('clawpilot:chain-get').then((data: any) => setChainData(data));
      } else {
        setStatusMsg(`Failed: ${result.error}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleWeightChange = (newWeights: typeof weights) => {
    setWeights(newWeights);
    ipc.invoke('clawpilot:settings-set', { key: 'healthWeights', value: newWeights });
  };

  // Compute task routing based on current models
  const taskRoutes = TASK_CATEGORIES.map((cat) => {
    const sorted = [...models]
      .filter((m) => m.healthScore > 0)
      .sort((a, b) => b.healthScore - a.healthScore);
    const best = sorted[0];
    return {
      category: cat,
      label: TASK_LABELS[cat],
      bestModel: best?.displayName ?? '—',
      score: best?.healthScore ?? 0,
      alternatives: sorted.slice(1, 3).map((m) => m.displayName),
    };
  });

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Fallback Optimizer</h2>
        <div className="flex items-center gap-3">
          {statusMsg && <span className="text-xs text-claw-400">{statusMsg}</span>}
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-claw-500 focus:ring-claw-500"
            />
            Auto-optimize
          </label>
        </div>
      </div>

      {!connected ? (
        <div className="text-gray-500 text-sm">Connect to OpenClaw Gateway to use the optimizer.</div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChainComparison
              current={chainData?.current}
              recommended={chainData?.recommended}
              reason={chainData?.reason}
              improvement={chainData?.improvement}
              onApply={handleApply}
            />
            <WeightSliders weights={weights} onChange={handleWeightChange} />
          </div>

          <TaskRoutingTable routes={taskRoutes} />
        </>
      )}
    </div>
  );
};
