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
  const scoreColor = healthScore >= 0.7 ? '#34d399' : healthScore >= 0.4 ? '#fbbf24' : '#f87171';
  const glowClass = healthScore >= 0.7 ? 'glow-emerald' : healthScore >= 0.4 ? 'glow-amber' : healthScore > 0 ? 'glow-red' : '';

  return (
    <div className={cn(
      'glass-card rounded-xl p-4 hover:border-white/10 transition-all duration-300 slide-up',
      glowClass && `hover:${glowClass}`
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200 truncate pr-2">{displayName}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('w-2 h-2 rounded-full', getStatusDot(status), status === 'healthy' && 'pulse-dot')} />
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider', getStatusColor(status))}>
            {status}
          </span>
        </div>
      </div>

      {/* Health Ring */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15.9155"
              fill="none"
              stroke={scoreColor}
              strokeWidth="2.5"
              strokeDasharray={`${healthScore * 100}, 100`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease-out, stroke 0.3s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: scoreColor }}>
              {Math.round(healthScore * 100)}
            </span>
            <span className="text-[8px] text-gray-600 uppercase tracking-widest">Health</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetricItem label="Latency" value={formatLatency(latencyAvg)} />
        <MetricItem label="Error Rate" value={formatPercent(errorRate)} alert={errorRate > 0.1} />
        <MetricItem label="Cost/min" value={formatCost(costPerMin)} />
        <MetricItem label="RPM" value={rpm.toFixed(1)} />
      </div>
    </div>
  );
};

const MetricItem: React.FC<{ label: string; value: string; alert?: boolean }> = ({ label, value, alert }) => (
  <div>
    <span className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</span>
    <p className={cn('text-xs font-medium', alert ? 'text-red-400' : 'text-gray-300')}>{value}</p>
  </div>
);
