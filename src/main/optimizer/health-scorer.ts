import type { ModelState, HealthComponents, ModelMetrics, RequestLogEntry, ChainRecommendation, ChainConfig } from '../../shared/types';
import { DEFAULT_HEALTH_WEIGHTS, LATENCY_BASELINE_MS, HYSTERESIS_THRESHOLD } from '../../shared/constants';
import { getCostPer1kOutput, getMaxCostInPool } from '../metrics/pricing';
import { serviceBus } from '../service-bus';

interface ModelAccumulator {
  recentRequests: RequestLogEntry[];
  emaPrev: number;
  latencies: number[];
  cooldownEndsAt: number | null;
  lastSeen: number;
}

export class HealthScorer {
  private accumulators = new Map<string, ModelAccumulator>();
  private modelStates = new Map<string, ModelState>();
  private currentChain: ChainConfig | null = null;
  private weights = { ...DEFAULT_HEALTH_WEIGHTS };
  private windowMs = 5 * 60 * 1000; // 5 minute window

  recordRequest(entry: RequestLogEntry): void {
    const acc = this.getOrCreateAccumulator(entry.modelId);
    acc.recentRequests.push(entry);
    acc.lastSeen = entry.ts;

    // Trim to window
    const cutoff = Date.now() - this.windowMs;
    acc.recentRequests = acc.recentRequests.filter((r) => r.ts > cutoff);

    if (entry.success && entry.latencyMs > 0) {
      acc.latencies.push(entry.latencyMs);
      if (acc.latencies.length > 100) acc.latencies = acc.latencies.slice(-100);
    }

    // Recompute health
    this.computeModelHealth(entry.modelId);
  }

  private computeModelHealth(modelId: string): void {
    const acc = this.getOrCreateAccumulator(modelId);
    const components = this.computeComponents(modelId, acc);
    const score = this.computeScore(components);

    const prevState = this.modelStates.get(modelId);
    const status = this.deriveStatus(score, components);

    const state: ModelState = {
      id: modelId,
      provider: modelId.split('/')[0] ?? 'unknown',
      displayName: this.getDisplayName(modelId),
      status,
      healthScore: score,
      components,
      metrics: this.computeMetrics(acc),
      isInCooldown: components.cooldown === 0,
      cooldownEndsAt: acc.cooldownEndsAt,
      lastSeen: acc.lastSeen,
    };

    this.modelStates.set(modelId, state);

    // Emit state change if status changed
    if (prevState && prevState.status !== status) {
      serviceBus.emit('model:state-change', {
        modelId,
        prev: prevState.status,
        next: status,
        reason: `Health score: ${score.toFixed(3)}`,
      });
    }
  }

  private computeComponents(modelId: string, acc: ModelAccumulator): HealthComponents {
    const availability = this.scoreAvailability(acc);
    const latency = this.scoreLatency(acc);
    const cost = this.scoreCost(modelId);
    const stability = this.scoreStability(acc);
    const cooldown = this.scoreCooldown(acc);

    return { availability, latency, cost, stability, cooldown };
  }

  private scoreAvailability(acc: ModelAccumulator): number {
    if (acc.recentRequests.length === 0) return acc.emaPrev * 0.95;
    const successRate = acc.recentRequests.filter((r) => r.success).length / acc.recentRequests.length;
    const EMA_ALPHA = 0.3;
    const score = EMA_ALPHA * successRate + (1 - EMA_ALPHA) * acc.emaPrev;
    acc.emaPrev = score;
    return score;
  }

  private scoreLatency(acc: ModelAccumulator): number {
    if (acc.latencies.length === 0) return 0.5;
    const avg = acc.latencies.reduce((a, b) => a + b, 0) / acc.latencies.length;
    const ratio = avg / LATENCY_BASELINE_MS;
    return 1.0 / (1.0 + ratio * ratio);
  }

  private scoreCost(modelId: string): number {
    const maxCost = getMaxCostInPool();
    if (maxCost <= 0) return 1.0;
    const cost = getCostPer1kOutput(modelId);
    const normalized = cost / maxCost;
    return 1.0 - Math.log1p(normalized * 9) / Math.log(10);
  }

  private scoreStability(acc: ModelAccumulator): number {
    if (acc.latencies.length < 3) return 0.5;
    const mean = acc.latencies.reduce((a, b) => a + b, 0) / acc.latencies.length;
    if (mean === 0) return 1.0;
    const variance = acc.latencies.reduce((sum, l) => sum + (l - mean) ** 2, 0) / acc.latencies.length;
    const cv = Math.sqrt(variance) / mean;
    return Math.max(0, 1.0 - cv);
  }

  private scoreCooldown(acc: ModelAccumulator): number {
    if (acc.cooldownEndsAt && acc.cooldownEndsAt > Date.now()) return 0;
    if (acc.cooldownEndsAt) {
      const elapsed = Date.now() - acc.cooldownEndsAt;
      return Math.min(1.0, elapsed / 60_000);
    }
    return 1.0;
  }

  private computeScore(components: HealthComponents): number {
    if (components.cooldown === 0) return 0;
    if (components.availability < 0.1) return Math.min(0.1, components.availability);

    return Math.round(
      (this.weights.availability * components.availability +
        this.weights.latency * components.latency +
        this.weights.cost * components.cost +
        this.weights.stability * components.stability +
        this.weights.cooldown * components.cooldown) * 1000
    ) / 1000;
  }

  private deriveStatus(score: number, components: HealthComponents): ModelState['status'] {
    if (components.cooldown === 0) return 'cooldown';
    if (score >= 0.7) return 'healthy';
    if (score >= 0.4) return 'degraded';
    if (score > 0) return 'down';
    return 'unknown';
  }

  private computeMetrics(acc: ModelAccumulator): ModelMetrics {
    const recent = acc.recentRequests;
    const latencies = recent.filter((r) => r.success && r.latencyMs > 0).map((r) => r.latencyMs).sort((a, b) => a - b);
    const errors = recent.filter((r) => !r.success).length;
    const totalCost = recent.reduce((sum, r) => sum + (r.costUsd ?? 0), 0);
    const durationMin = recent.length > 0 ? (Date.now() - recent[0].ts) / 60_000 || 1 : 1;

    return {
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

  getAllModelStates(): ModelState[] {
    return Array.from(this.modelStates.values());
  }

  getChainRecommendation(): ChainRecommendation | null {
    const states = this.getAllModelStates();
    if (states.length === 0) return null;

    const ranked = [...states]
      .filter((m) => m.healthScore > 0)
      .sort((a, b) => b.healthScore - a.healthScore);

    const recommended: ChainConfig = {
      primary: ranked[0]?.id ?? '',
      fallbacks: ranked.slice(1).map((m) => m.id),
    };

    const current = this.currentChain ?? { primary: ranked[0]?.id ?? '', fallbacks: [] };

    // Check hysteresis
    const currentPrimary = states.find((s) => s.id === current.primary);
    const bestCandidate = ranked[0];
    let reason = 'Based on current health scores';
    let improvement = 0;

    if (currentPrimary && bestCandidate && bestCandidate.id !== current.primary) {
      improvement = ((bestCandidate.healthScore - currentPrimary.healthScore) / (currentPrimary.healthScore || 1)) * 100;
      if (improvement < HYSTERESIS_THRESHOLD * 100) {
        recommended.primary = current.primary;
        recommended.fallbacks = ranked.filter((m) => m.id !== current.primary).map((m) => m.id);
        reason = 'Current primary stable (within hysteresis threshold)';
        improvement = 0;
      } else {
        reason = `${bestCandidate.displayName} has ${improvement.toFixed(1)}% better health score`;
      }
    }

    return { current, recommended, reason, improvement };
  }

  setChain(chain: ChainConfig): void {
    this.currentChain = chain;
  }

  private getDisplayName(modelId: string): string {
    const parts = modelId.split('/');
    return parts[1]?.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) ?? modelId;
  }

  private getOrCreateAccumulator(modelId: string): ModelAccumulator {
    let acc = this.accumulators.get(modelId);
    if (!acc) {
      acc = { recentRequests: [], emaPrev: 0.5, latencies: [], cooldownEndsAt: null, lastSeen: 0 };
      this.accumulators.set(modelId, acc);
    }
    return acc;
  }
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil(sorted.length * p) - 1;
  return sorted[Math.max(0, idx)];
}
