import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const metricsRaw = sqliteTable('metrics_raw', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts').notNull(),
  modelId: text('model_id').notNull(),
  provider: text('provider').notNull(),
  sessionId: text('session_id'),
  channel: text('channel'),
  latencyMs: integer('latency_ms'),
  ttfbMs: integer('ttfb_ms'),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  cacheReadTokens: integer('cache_read_tokens'),
  cacheWriteTokens: integer('cache_write_tokens'),
  costUsd: real('cost_usd'),
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  wasFallback: integer('was_fallback', { mode: 'boolean' }).notNull().default(false),
  fallbackFromModel: text('fallback_from_model'),
  fallbackDepth: integer('fallback_depth').default(0),
}, (table) => [
  index('idx_metrics_ts').on(table.ts),
  index('idx_metrics_model').on(table.modelId),
  index('idx_metrics_model_ts').on(table.modelId, table.ts),
]);

export const metricsAgg1m = sqliteTable('metrics_agg_1m', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bucketTs: integer('bucket_ts').notNull(),
  modelId: text('model_id').notNull(),
  provider: text('provider').notNull(),
  requestCount: integer('request_count').notNull(),
  successCount: integer('success_count').notNull(),
  errorCount: integer('error_count').notNull(),
  latencyP50: integer('latency_p50'),
  latencyP95: integer('latency_p95'),
  latencyP99: integer('latency_p99'),
  latencyAvg: real('latency_avg'),
  totalInputTokens: integer('total_input_tokens'),
  totalOutputTokens: integer('total_output_tokens'),
  totalCostUsd: real('total_cost_usd'),
}, (table) => [
  uniqueIndex('idx_agg1m_bucket_model').on(table.bucketTs, table.modelId),
]);

export const fallbackEvents = sqliteTable('fallback_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts').notNull(),
  fromModel: text('from_model').notNull(),
  toModel: text('to_model').notNull(),
  reason: text('reason').notNull(),
  chainSnapshot: text('chain_snapshot'),
  resolvedInMs: integer('resolved_in_ms'),
  sessionId: text('session_id'),
  channel: text('channel'),
}, (table) => [
  index('idx_fallback_ts').on(table.ts),
]);

export const modelSnapshots = sqliteTable('model_snapshots', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts').notNull(),
  modelId: text('model_id').notNull(),
  healthScore: real('health_score').notNull(),
  availabilityScore: real('availability_score'),
  latencyScore: real('latency_score'),
  costScore: real('cost_score'),
  qualityScore: real('quality_score'),
  errorRate: real('error_rate'),
  avgLatencyMs: real('avg_latency_ms'),
  rpm: real('rpm'),
  isInCooldown: integer('is_in_cooldown', { mode: 'boolean' }),
}, (table) => [
  index('idx_snap_model_ts').on(table.modelId, table.ts),
]);

export const costDaily = sqliteTable('cost_daily', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dateStr: text('date_str').notNull(),
  modelId: text('model_id').notNull(),
  provider: text('provider').notNull(),
  totalRequests: integer('total_requests'),
  totalInputTokens: integer('total_input_tokens'),
  totalOutputTokens: integer('total_output_tokens'),
  totalCostUsd: real('total_cost_usd'),
}, (table) => [
  uniqueIndex('idx_cost_date_model').on(table.dateStr, table.modelId),
]);

export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts').notNull(),
  type: text('type').notNull(),
  severity: text('severity').notNull(),
  modelId: text('model_id'),
  message: text('message').notNull(),
  acknowledged: integer('acknowledged', { mode: 'boolean' }).default(false),
  metadata: text('metadata'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
