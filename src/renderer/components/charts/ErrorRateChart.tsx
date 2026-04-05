import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DataPoint {
  time: string;
  value: number;
}

interface ErrorRateChartProps {
  data: DataPoint[];
}

export const ErrorRateChart: React.FC<ErrorRateChartProps> = ({ data }) => {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-3">Error Rate</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="time"
            stroke="rgba(255,255,255,0.2)"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.2)"
            fontSize={10}
            tickLine={false}
            tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
            domain={[0, 1]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Error Rate']}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#ef4444"
            fill="rgba(239, 68, 68, 0.1)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
