// Domain types for ClawPilot

export interface ModelState {
  id: string;           // e.g. "anthropic/claude-sonnet-4-6"
  provider: string;     // e.g. "anthropic"
  displayName: string;
  status: 'healthy' | 'degraded' | 'down' | 'cooldown' | 'unknown';
  healthScore: number;  // 0.0 - 1.0
  components: HealthComponents;
  metrics: ModelMetrics;
  isInCooldown: boolean;
  cooldownEndsAt: number | null;
  lastSeen: number;     // Unix ms
}

export interface HealthComponents {
  availability: number;  // 0-1
  latency: number;       // 0-1
  cost: number;          // 0-1
  stability: number;     // 0-1
  cooldown: number;      // 0-1
}

export interface ModelMetrics {
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  latencyAvg: number;
  errorRate: number;      // 0-1
  rpm: number;            // requests per minute
  costPerMin: number;     // USD
  totalRequests: number;
  totalErrors: number;
}

export interface MetricsSnapshot {
  models: Record<string, ModelMetrics>;
  ts: number;
}

export interface FallbackEvent {
  id?: number;
  ts: number;
  fromModel: string;
  toModel: string;
  reason: 'timeout' | 'rate_limit' | 'error' | 'overloaded' | 'auth_failure';
  resolvedInMs?: number;
  sessionId?: string;
  channel?: string;
}

export interface RequestLogEntry {
  ts: number;
  modelId: string;
  channel?: string;
  success: boolean;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  errorCode?: string;
  wasFallback: boolean;
  fallbackFromModel?: string;
}

export interface GatewayStatus {
  connected: boolean;
  connId?: string;
  serverVersion?: string;
  uptime?: number;
  url: string;
  reconnecting: boolean;
  lastError?: string;
}

export interface ChainConfig {
  primary: string;
  fallbacks: string[];
}

export interface ChainRecommendation {
  current: ChainConfig;
  recommended: ChainConfig;
  reason: string;
  improvement: number;  // percentage improvement
}

export interface Alert {
  id?: number;
  ts: number;
  type: 'model_down' | 'high_error_rate' | 'cost_spike' | 'fallback_storm' | 'prediction_warning';
  severity: 'info' | 'warning' | 'critical';
  modelId?: string;
  message: string;
  acknowledged: boolean;
  metadata?: Record<string, unknown>;
}

export interface CostSummary {
  totalUsd: number;
  byModel: Record<string, { totalUsd: number; requests: number; inputTokens: number; outputTokens: number }>;
  period: { from: number; to: number };
}

export interface AppSettings {
  gatewayUrl: string;
  gatewayToken: string;
  theme: 'dark' | 'light';
  autoOptimize: boolean;
  alertsEnabled: boolean;
  healthWeights: {
    availability: number;
    latency: number;
    cost: number;
    stability: number;
    cooldown: number;
  };
}

// Gateway protocol types
export interface GatewayFrame {
  type: 'req' | 'res' | 'event';
}

export interface GatewayRequest extends GatewayFrame {
  type: 'req';
  id: string;
  method: string;
  params?: unknown;
}

export interface GatewayResponse extends GatewayFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string; retryable?: boolean; retryAfterMs?: number };
}

export interface GatewayEvent extends GatewayFrame {
  type: 'event';
  event: string;
  payload?: unknown;
  seq?: number;
}

export interface HelloOk {
  protocol: number;
  server: { version: string; connId: string };
  features: { methods: string[]; events: string[] };
  snapshot: unknown;
  policy: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
}
