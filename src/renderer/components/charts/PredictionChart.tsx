import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PredictionDataPoint {
  time: string;
  errorRate: number;
  predicted?: number;
}

interface PredictionChartProps {
  data: PredictionDataPoint[];
  failureThreshold?: number;
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ data, failureThreshold = 0.5 }) => {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Failure Prediction</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            fontSize={10}
            tickLine={false}
            domain={[0, 1]}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
            formatter={(value: number, name: string) => [`${(value * 100).toFixed(1)}%`, name === 'predicted' ? 'Predicted' : 'Error Rate']}
          />
          <ReferenceLine y={failureThreshold} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Failure Threshold', fill: '#ef4444', fontSize: 10 }} />
          <Line type="monotone" dataKey="errorRate" stroke="#f59e0b" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="predicted" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
