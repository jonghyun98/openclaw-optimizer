import { serviceBus } from '../service-bus';
import { RingBuffer } from './ring-buffer';
import { computeCost } from './pricing';
import { getSqlite } from '../db/connection';
import type { HealthScorer } from '../optimizer/health-scorer';
import type { RequestLogEntry, MetricsSnapshot, ModelMetrics } from '../../shared/types';
import {
  RING_BUFFER_CAPACITY,
  METRICS_SNAPSHOT_INTERVAL_MS,
  DB_WRITE_INTERVAL_MS,
  WRITE_BUFFER_MAX,
} from '../../shared/constants';

export class MetricsEngine {
  private buffers = new Map<string, RingBuffer<RequestLogEntry>>();
  private writeBuffer: RequestLogEntry[] = [];
  private snapshotTimer: NodeJS.Timeout | null = null;
  private writeTimer: NodeJS.Timeout | null = null;
  private healthScorer: HealthScorer;

  constructor(healthScorer: HealthScorer) {
    this.healthScorer = healthScorer;

    serviceBus.on('gateway:event', (event) => {
      this.handleGatewayEvent(event);
    });
  }

  start(): void {
    this.snapshotTimer = setInterval(() => this.emitSnapshot(), METRICS_SNAPSHOT_INTERVAL_MS);
    this.writeTimer = setInterval(() => this.flushToDb(), DB_WRITE_INTERVAL_MS);
    console.log('[MetricsEngine] Started');
  }

  stop(): void {
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    if (this.writeTimer) clearInterval(this.writeTimer);
    this.flushToDb(); // Final flush
  }

  private handleGatewayEvent(event: { event: string; payload: unknown }): void {
    // Extract request metrics from gateway events
    if (event.event === 'session.message' || event.event === 'session.update' || event.event === 'usage.update') {
      const entry = this.extractMetrics(event);
      if (entry) {
        this.recordEntry(entry);
      }
    }

    // Handle fallback events
    if (event.event === 'model.fallback') {
      const payload = event.payload as any;
      serviceBus.emit('fallback:event', {
        ts: Date.now(),
        fromModel: payload?.fromModel ?? 'unknown',
        toModel: payload?.toModel ?? 'unknown',
        reason: payload?.reason ?? 'error',
        sessionId: payload?.sessionId,
        channel: payload?.channel,
      });
    }
  }

  private extractMetrics(event: { event: string; payload: unknown }): RequestLogEntry | null {
    const p = event.payload as any;
    if (!p?.model) return null;

    const inputTokens = p.usage?.inputTokens ?? p.inputTokens ?? 0;
    const outputTokens = p.usage?.outputTokens ?? p.outputTokens ?? 0;

    return {
      ts: Date.now(),
      modelId: p.model,
      channel: p.channel ?? undefined,
      success: !p.error,
      latencyMs: p.latencyMs ?? p.duration ?? 0,
      inputTokens,
      outputTokens,
      costUsd: computeCost(p.model, inputTokens, outputTokens),
      errorCode: p.error?.code ?? undefined,
      wasFallback: p.wasFallback ?? false,
      fallbackFromModel: p.fallbackFrom ?? undefined,
    };
  }

  private recordEntry(entry: RequestLogEntry): void {
    // Add to ring buffer
    const buffer = this.getOrCreateBuffer(entry.modelId);
    buffer.push(entry);

    // Add to write buffer (for DB)
    if (this.writeBuffer.length < WRITE_BUFFER_MAX) {
      this.writeBuffer.push(entry);
    }

    // Emit to renderer for live log
    serviceBus.emit('metrics:request', entry);

    // Update health scorer
    this.healthScorer.recordRequest(entry);
  }

  private getOrCreateBuffer(modelId: string): RingBuffer<RequestLogEntry> {
    let buffer = this.buffers.get(modelId);
    if (!buffer) {
      buffer = new RingBuffer(RING_BUFFER_CAPACITY);
      this.buffers.set(modelId, buffer);
    }
    return buffer;
  }

  private emitSnapshot(): void {
    const models: Record<string, ModelMetrics> = {};

    for (const [modelId, buffer] of this.buffers) {
      const entries = buffer.toArray();
      if (entries.length === 0) continue;

      const recent = entries.filter((e) => e.ts > Date.now() - 5 * 60 * 1000); // Last 5 min
      if (recent.length === 0) continue;

      const latencies = recent.filter((e) => e.success && e.latencyMs > 0).map((e) => e.latencyMs).sort((a, b) => a - b);
      const errors = recent.filter((e) => !e.success).length;
      const totalCost = recent.reduce((sum, e) => sum + (e.costUsd ?? 0), 0);
      const durationMin = (Date.now() - recent[0].ts) / 60_000 || 1;

      models[modelId] = {
        latencyP50: percentile(latencies, 0.5),
        latencyP95: percentile(latencies, 0.95),
        latencyP99: percentile(latencies, 0.99),
        latencyAvg: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
        errorRate: recent.length > 0 ? errors / recent.length : 0,
        rpm: recent.length / durationMin,
        costPerMin: totalCost / durationMin,
        totalRequests: recent.length,
        totalErrors: errors,
      };
    }

    const snapshot: MetricsSnapshot = { models, ts: Date.now() };
    serviceBus.emit('metrics:snapshot', snapshot);
  }

  private flushToDb(): void {
    if (this.writeBuffer.length === 0) return;

    try {
      const sqlite = getSqlite();
      const stmt = sqlite.prepare(`
        INSERT INTO metrics_raw (ts, model_id, provider, session_id, channel, latency_ms, input_tokens, output_tokens, cost_usd, success, error_code, error_message, was_fallback, fallback_from_model)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const batch = this.writeBuffer.splice(0, 500);
      const transaction = sqlite.transaction(() => {
        for (const e of batch) {
          const provider = e.modelId.split('/')[0] ?? 'unknown';
          stmt.run(
            e.ts, e.modelId, provider, null, e.channel ?? null,
            e.latencyMs, e.inputTokens ?? null, e.outputTokens ?? null,
            e.costUsd ?? null, e.success ? 1 : 0, e.errorCode ?? null,
            null, e.wasFallback ? 1 : 0, e.fallbackFromModel ?? null
          );
        }
      });
      transaction();
    } catch (err) {
      console.error('[MetricsEngine] DB flush error:', err);
    }
  }

  queryMetrics(params: { modelId?: string; from: number; to: number }): RequestLogEntry[] {
    try {
      const sqlite = getSqlite();
      let query = 'SELECT * FROM metrics_raw WHERE ts >= ? AND ts <= ?';
      const args: unknown[] = [params.from, params.to];

      if (params.modelId) {
        query += ' AND model_id = ?';
        args.push(params.modelId);
      }

      query += ' ORDER BY ts DESC LIMIT 1000';
      return sqlite.prepare(query).all(...args) as RequestLogEntry[];
    } catch {
      return [];
    }
  }

  getSetting(key: string): unknown {
    try {
      const sqlite = getSqlite();
      const row = sqlite.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
      return row ? JSON.parse(row.value) : null;
    } catch {
      return null;
    }
  }

  setSetting(key: string, value: unknown): void {
    try {
      const sqlite = getSqlite();
      sqlite.prepare(
        'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, ?)'
      ).run(key, JSON.stringify(value), Date.now());
    } catch (err) {
      console.error('[MetricsEngine] Setting write error:', err);
    }
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}
