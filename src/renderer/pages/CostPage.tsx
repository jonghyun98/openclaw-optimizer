import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useGatewayStore } from '../stores/gateway-store';
import { ipc } from '../lib/ipc-client';
import { formatCost } from '../lib/format';

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

interface CostData {
  totalUsd: number;
  byModel: Record<string, { totalUsd: number; requests: number; inputTokens: number; outputTokens: number }>;
}

export const CostPage: React.FC = () => {
  const connected = useGatewayStore((s) => s.connected);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [costData, setCostData] = useState<CostData | null>(null);

  useEffect(() => {
    if (!connected) return;
    const now = Date.now();
    const periodMs = period === '24h' ? 86400000 : period === '7d' ? 604800000 : 2592000000;
    ipc.invoke<CostData>('clawpilot:cost-summary', { from: now - periodMs, to: now }).then((data) => {
      if (data) setCostData(data);
    });
  }, [connected, period]);

  const pieData = costData
    ? Object.entries(costData.byModel).map(([id, data]) => ({
        name: id.split('/')[1] ?? id,
        value: data.totalUsd,
      })).filter((d) => d.value > 0)
    : [];

  const barData = costData
    ? Object.entries(costData.byModel).map(([id, data]) => ({
        name: id.split('/')[1] ?? id,
        cost: Math.round(data.totalUsd * 1000) / 1000,
        requests: data.requests,
      }))
    : [];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">Cost Analytics</h2>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-0.5">
          {(['24h', '7d', '30d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                period === p ? 'bg-claw-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!connected ? (
        <div className="text-gray-500 text-sm">Connect to gateway to view cost data.</div>
      ) : !costData ? (
        <div className="text-gray-500 text-sm">Loading...</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500">Total Cost ({period})</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{formatCost(costData.totalUsd)}</p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">
                {Object.values(costData.byModel).reduce((s, m) => s + m.requests, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <p className="text-xs text-gray-500">Models Used</p>
              <p className="text-2xl font-bold text-gray-100 mt-1">{Object.keys(costData.byModel).length}</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Cost by Model</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                  <Bar dataKey="cost" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Cost Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-gray-600 text-sm">No cost data</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
