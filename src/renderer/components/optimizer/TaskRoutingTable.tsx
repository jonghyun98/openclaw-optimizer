import React from 'react';
import { cn } from '../../lib/cn';

interface TaskRoute {
  category: string;
  label: string;
  bestModel: string;
  score: number;
  alternatives: string[];
}

interface TaskRoutingTableProps {
  routes: TaskRoute[];
}

const categoryColors: Record<string, string> = {
  simple: 'bg-gray-700 text-gray-300',
  code: 'bg-violet-900/50 text-violet-300',
  analysis: 'bg-blue-900/50 text-blue-300',
  creative: 'bg-amber-900/50 text-amber-300',
  multimodal: 'bg-emerald-900/50 text-emerald-300',
};

export const TaskRoutingTable: React.FC<TaskRoutingTableProps> = ({ routes }) => {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-200 mb-4">Task-Based Routing</h3>

      {routes.length === 0 ? (
        <p className="text-xs text-gray-500">No routing data available. Connect to gateway first.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-4 text-xs text-gray-500 px-2 pb-1 border-b border-gray-800">
            <span>Task Type</span>
            <span>Best Model</span>
            <span>Score</span>
            <span>Alternatives</span>
          </div>
          {routes.map((route) => (
            <div key={route.category} className="grid grid-cols-4 items-center text-xs px-2 py-1.5 rounded hover:bg-gray-800/50">
              <span className={cn('inline-flex px-2 py-0.5 rounded text-[10px] font-medium w-fit', categoryColors[route.category] ?? 'bg-gray-700 text-gray-300')}>
                {route.label}
              </span>
              <span className="text-gray-200 font-medium">{route.bestModel}</span>
              <span className="text-claw-400 font-mono">{(route.score * 100).toFixed(0)}</span>
              <span className="text-gray-500 truncate">{route.alternatives.join(', ') || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
