import React from 'react';
import { cn } from '../../lib/cn';
import { getStatusDot } from '../../lib/format';
import { useModelsStore } from '../../stores/models-store';

interface FallbackChainProps {
  chain?: { primary: string; fallbacks: string[] };
  recommended?: { primary: string; fallbacks: string[] };
  showRecommended?: boolean;
}

export const FallbackChain: React.FC<FallbackChainProps> = ({ chain, recommended, showRecommended = true }) => {
  const models = useModelsStore((s) => s.models);

  const getModel = (id: string) => models.find((m) => m.id === id);

  const renderChainItem = (modelId: string, index: number, isRecommended = false) => {
    const model = getModel(modelId);
    const name = model?.displayName ?? modelId.split('/')[1] ?? modelId;
    const status = model?.status ?? 'unknown';

    return (
      <React.Fragment key={`${modelId}-${index}`}>
        {index > 0 && <span className="text-gray-600 mx-1">→</span>}
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
            isRecommended ? 'bg-claw-900/50 border border-claw-700' : 'bg-gray-800 border border-gray-700'
          )}
        >
          <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(status))} />
          {name}
          {index === 0 && <span className="text-gray-500 ml-1">(primary)</span>}
        </span>
      </React.Fragment>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Fallback Chain</h3>

      {chain && (
        <div className="mb-2">
          <span className="text-xs text-gray-500 mr-2">Current:</span>
          <div className="inline-flex flex-wrap items-center gap-0.5">
            {[chain.primary, ...chain.fallbacks].map((id, i) => renderChainItem(id, i))}
          </div>
        </div>
      )}

      {showRecommended && recommended && (
        <div>
          <span className="text-xs text-claw-400 mr-2">Recommended:</span>
          <div className="inline-flex flex-wrap items-center gap-0.5">
            {[recommended.primary, ...recommended.fallbacks].map((id, i) => renderChainItem(id, i, true))}
          </div>
        </div>
      )}
    </div>
  );
};
