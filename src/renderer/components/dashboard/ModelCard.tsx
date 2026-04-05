import React from 'react';
import { cn } from '../../lib/cn';
import { formatLatency, formatPercent, formatCost, getStatusDot, getStatusColor } from '../../lib/format';

interface ModelCardProps {
  id: string;
  displayName: string;
  status: string;
  healthScore: number;
  latencyAvg: number;
  errorRate: number;
  costPerMin: number;
  rpm: number;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  displayName,
  status,
  healthScore,
  latencyAvg,
  errorRate,
  costPerMin,
  rpm,
}) => {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200 truncate">{displayName}</h3>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', getStatusDot(status))} />
          <span className={cn('text-xs font-medium uppercase', getStatusColor(status))}>
            {status}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center mb-3">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={healthScore >= 0.7 ? '#34d399' : healthScore >= 0.4 ? '#fbbf24' : '#f87171'}
              strokeWidth="3"
              strokeDasharray={`${healthScore * 100}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-gray-100">
              {Math.round(healthScore * 100)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-500">Latency</span>
          <p className="text-gray-200 font-medium">{formatLatency(latencyAvg)}</p>
        </div>
        <div>
          <span className="text-gray-500">Error Rate</span>
          <p className={cn('font-medium', errorRate > 0.1 ? 'text-red-400' : 'text-gray-200')}>
            {formatPercent(errorRate)}
          </p>
        </div>
        <div>
          <span className="text-gray-500">Cost/min</span>
          <p className="text-gray-200 font-medium">{formatCost(costPerMin)}</p>
        </div>
        <div>
          <span className="text-gray-500">RPM</span>
          <p className="text-gray-200 font-medium">{rpm.toFixed(1)}</p>
        </div>
      </div>
    </div>
  );
};
