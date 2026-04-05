import React, { useState } from 'react';
import { cn } from '../lib/cn';
import { formatCost, formatLatency } from '../lib/format';

interface Scenario {
  id: string;
  name: string;
  description: string;
  modelDown: string;
  errorPattern: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'claude-down', name: 'Claude API Outage', description: 'Claude becomes completely unavailable', modelDown: 'anthropic/claude-sonnet-4-6', errorPattern: 'instant' },
  { id: 'openai-rate-limit', name: 'OpenAI Rate Limit', description: 'GPT-5 hits rate limits', modelDown: 'openai/gpt-5', errorPattern: 'gradual' },
  { id: 'gemini-degraded', name: 'Gemini Degraded', description: 'Gemini responds with 5x latency', modelDown: 'google/gemini-3-pro', errorPattern: 'intermittent' },
  { id: 'multi-provider', name: 'Multi-Provider Failure', description: 'Both Claude and GPT-5 down', modelDown: 'anthropic/claude-sonnet-4-6,openai/gpt-5', errorPattern: 'instant' },
];

interface SimResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackCount: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  summary: string;
}

export const SimulatorPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('claude-down');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      // Simulate locally for MVP (in production, this would go through IPC)
      await new Promise((r) => setTimeout(r, 1500)); // Simulate processing
      setResult({
        totalRequests: 300,
        successfulRequests: 285,
        failedRequests: 15,
        fallbackCount: 120,
        avgLatencyMs: 450,
        totalCostUsd: 0.85,
        summary: '95.0% success rate, 120 fallbacks triggered',
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold text-gray-100">Fallback Simulator</h2>
      <p className="text-sm text-gray-500">Test how your fallback chain handles different failure scenarios.</p>

      {/* Scenario Selection */}
      <div className="grid grid-cols-2 gap-3">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedScenario(s.id)}
            className={cn(
              'text-left p-4 rounded-xl border transition-colors',
              selectedScenario === s.id
                ? 'border-claw-600 bg-claw-950/30'
                : 'border-gray-800 bg-gray-900 hover:border-gray-700'
            )}
          >
            <h4 className="text-sm font-medium text-gray-200">{s.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{s.description}</p>
            <span className={cn(
              'inline-block mt-2 text-[10px] px-2 py-0.5 rounded font-medium',
              s.errorPattern === 'instant' ? 'bg-red-900/50 text-red-300' :
              s.errorPattern === 'gradual' ? 'bg-amber-900/50 text-amber-300' :
              'bg-blue-900/50 text-blue-300'
            )}>
              {s.errorPattern}
            </span>
          </button>
        ))}
      </div>

      {/* Run Button */}
      <button
        onClick={handleRun}
        disabled={running}
        className={cn(
          'px-6 py-2.5 rounded-lg text-sm font-medium transition-colors',
          running ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-claw-600 hover:bg-claw-700 text-white'
        )}
      >
        {running ? 'Simulating...' : 'Run Simulation'}
      </button>

      {/* Results */}
      {result && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-medium text-gray-200">Simulation Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-emerald-400">
                {((result.successfulRequests / result.totalRequests) * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Fallbacks Triggered</p>
              <p className="text-xl font-bold text-amber-400">{result.fallbackCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Failed Requests</p>
              <p className="text-xl font-bold text-red-400">{result.failedRequests}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Latency</p>
              <p className="text-lg font-bold text-gray-200">{formatLatency(result.avgLatencyMs)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Cost</p>
              <p className="text-lg font-bold text-gray-200">{formatCost(result.totalCostUsd)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Requests</p>
              <p className="text-lg font-bold text-gray-200">{result.totalRequests}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 pt-2 border-t border-gray-800">{result.summary}</p>
        </div>
      )}
    </div>
  );
};
