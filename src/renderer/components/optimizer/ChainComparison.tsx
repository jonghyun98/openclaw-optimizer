import React from 'react';
import { cn } from '../../lib/cn';
import { getStatusDot } from '../../lib/format';
import { useModelsStore } from '../../stores/models-store';

interface ChainComparisonProps {
  current: { primary: string; fallbacks: string[] } | null;
  recommended: { primary: string; fallbacks: string[] } | null;
  reason?: string;
  improvement?: number;
  onApply?: () => void;
}

export const ChainComparison: React.FC<ChainComparisonProps> = ({
  current,
  recommended,
  reason,
  improvement,
  onApply,
}) => {
  const models = useModelsStore((s) => s.models);
  const getModel = (id: string) => models.find((m) => m.id === id);

  const renderChain = (chain: { primary: string; fallbacks: string[] } | null, label: string, highlight: boolean) => {
    if (!chain || !chain.primary) return null;
    const all = [chain.primary, ...chain.fallbacks];

    return (
      <div className={cn('p-4 rounded-lg border', highlight ? 'border-claw-600 bg-claw-950/30' : 'border-gray-700 bg-gray-800/50')}>
        <div className="text-xs text-gray-500 mb-2">{label}</div>
        <div className="flex flex-wrap items-center gap-1">
          {all.map((id, i) => {
            const model = getModel(id);
            const name = model?.displayName ?? id.split('/')[1] ?? id;
            const status = model?.status ?? 'unknown';
            return (
              <React.Fragment key={id}>
                {i > 0 && <span className="text-gray-600 text-xs">→</span>}
                <span className={cn(
                  'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                  i === 0 ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300'
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDot(status))} />
                  {name}
                  {i === 0 && <span className="text-gray-500 ml-0.5">(primary)</span>}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-200">Chain Comparison</h3>
        {improvement !== undefined && improvement > 0 && (
          <span className="text-xs text-claw-400 font-medium">+{improvement.toFixed(1)}% improvement</span>
        )}
      </div>

      <div className="space-y-3">
        {renderChain(current, 'Current Chain', false)}
        {renderChain(recommended, 'Recommended Chain', true)}
      </div>

      {reason && (
        <p className="text-xs text-gray-500 mt-3">{reason}</p>
      )}

      {onApply && improvement !== undefined && improvement > 0 && (
        <button
          onClick={onApply}
          className="mt-4 w-full px-4 py-2 bg-claw-600 hover:bg-claw-700 text-white text-sm rounded-lg transition-colors font-medium"
        >
          Apply Recommended Chain
        </button>
      )}
    </div>
  );
};
