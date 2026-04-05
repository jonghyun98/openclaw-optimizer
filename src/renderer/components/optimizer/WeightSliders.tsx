import React from 'react';

interface Weights {
  availability: number;
  latency: number;
  cost: number;
  stability: number;
  cooldown: number;
}

interface WeightSlidersProps {
  weights: Weights;
  onChange: (weights: Weights) => void;
}

const labels: Record<keyof Weights, { label: string; description: string }> = {
  availability: { label: 'Availability', description: 'How important is uptime/success rate?' },
  latency: { label: 'Latency', description: 'How important is response speed?' },
  cost: { label: 'Cost', description: 'How important is cost efficiency?' },
  stability: { label: 'Stability', description: 'How important is consistent performance?' },
  cooldown: { label: 'Cooldown', description: 'Penalty for recently failed models' },
};

export const WeightSliders: React.FC<WeightSlidersProps> = ({ weights, onChange }) => {
  const handleChange = (key: keyof Weights, value: number) => {
    const newWeights = { ...weights, [key]: value };
    // Normalize to sum to 1
    const total = Object.values(newWeights).reduce((s, v) => s + v, 0);
    if (total > 0) {
      const normalized: Weights = {
        availability: Math.round((newWeights.availability / total) * 100) / 100,
        latency: Math.round((newWeights.latency / total) * 100) / 100,
        cost: Math.round((newWeights.cost / total) * 100) / 100,
        stability: Math.round((newWeights.stability / total) * 100) / 100,
        cooldown: Math.round((newWeights.cooldown / total) * 100) / 100,
      };
      onChange(normalized);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
      <h3 className="text-sm font-medium text-gray-200 mb-4">Health Score Weights</h3>
      <div className="space-y-4">
        {(Object.keys(labels) as Array<keyof Weights>).map((key) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-300">{labels[key].label}</label>
              <span className="text-xs text-claw-400 font-mono">{(weights[key] * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(weights[key] * 100)}
              onChange={(e) => handleChange(key, parseInt(e.target.value) / 100)}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-claw-500"
            />
            <p className="text-[10px] text-gray-600 mt-0.5">{labels[key].description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
