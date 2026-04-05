export const METRICS_SNAPSHOT_INTERVAL_MS = 5_000;
export const DB_WRITE_INTERVAL_MS = 5_000;
export const HEALTH_SNAPSHOT_INTERVAL_MS = 60_000;
export const RETENTION_PRUNE_INTERVAL_MS = 6 * 60 * 60 * 1000;

export const RAW_RETENTION_DAYS = 7;
export const AGG_RETENTION_DAYS = 90;
export const SNAPSHOT_RETENTION_DAYS = 30;

export const RING_BUFFER_CAPACITY = 300;
export const WRITE_BUFFER_MAX = 10_000;
export const RECONNECT_BASE_MS = 1_000;
export const RECONNECT_MAX_MS = 30_000;

export const DEFAULT_GATEWAY_URL = 'ws://127.0.0.1:18789';
export const DEFAULT_GATEWAY_PORT = 18789;

export const DEFAULT_HEALTH_WEIGHTS = {
  availability: 0.35,
  latency: 0.25,
  cost: 0.15,
  stability: 0.15,
  cooldown: 0.10,
};

export const LATENCY_BASELINE_MS = 2000;
export const HYSTERESIS_THRESHOLD = 0.10;

export const APP_NAME = 'ClawPilot';
export const APP_VERSION = '0.1.0';
export const DB_FILENAME = 'clawpilot.db';
