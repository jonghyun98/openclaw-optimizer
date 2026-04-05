import React, { useRef } from 'react';
import { useMetricsStore } from '../../stores/metrics-store';
import { cn } from '../../lib/cn';
import { formatTime, formatLatency, formatCost } from '../../lib/format';

export const RequestLog: React.FC = () => {
  const requestLog = useMetricsStore((s) => s.requestLog);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Live Request Log</h3>
      <div
        ref={containerRef}
        className="h-48 overflow-y-auto text-xs font-mono space-y-0.5"
      >
        {requestLog.length === 0 ? (
          <div className="text-gray-600 text-center py-4">Waiting for requests...</div>
        ) : (
          requestLog.map((entry, i) => (
            <div
              key={`${entry.ts}-${i}`}
              className={cn(
                'flex items-center gap-2 px-2 py-0.5 rounded',
                entry.success ? 'hover:bg-gray-800/50' : 'bg-red-900/10 hover:bg-red-900/20'
              )}
            >
              <span className="text-gray-500 w-16 shrink-0">{formatTime(entry.ts)}</span>
              <span className="text-gray-400 w-40 truncate">{entry.modelId.split('/')[1]}</span>
              {entry.channel && (
                <span className="text-gray-600 w-20 truncate">#{entry.channel}</span>
              )}
              <span className={entry.success ? 'text-emerald-400' : 'text-red-400'}>
                {entry.success ? '✓' : '✗'}
              </span>
              <span className="text-gray-300 w-16 text-right">{formatLatency(entry.latencyMs)}</span>
              {entry.costUsd !== undefined && (
                <span className="text-gray-500 w-16 text-right">{formatCost(entry.costUsd)}</span>
              )}
              {entry.wasFallback && (
                <span className="text-amber-400 text-[10px]">FALLBACK</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
