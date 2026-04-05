export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatCost(usd: number): string {
  if (usd === 0) return 'FREE';
  if (usd < 0.001) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false });
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy': return 'text-emerald-400';
    case 'degraded': return 'text-amber-400';
    case 'down': return 'text-red-400';
    case 'cooldown': return 'text-blue-400';
    default: return 'text-gray-400';
  }
}

export function getStatusDot(status: string): string {
  switch (status) {
    case 'healthy': return 'bg-emerald-400';
    case 'degraded': return 'bg-amber-400';
    case 'down': return 'bg-red-400';
    case 'cooldown': return 'bg-blue-400';
    default: return 'bg-gray-400';
  }
}
