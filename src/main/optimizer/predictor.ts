import { serviceBus } from '../service-bus';

interface ErrorRatePoint {
  ts: number;
  rate: number;
}

interface LatencyPoint {
  ts: number;
  avgMs: number;
}

export interface PredictionResult {
  modelId: string;
  willFail: boolean;
  confidence: number;
  estimatedFailureTs: number | null;
  reason: string | null;
}

interface ModelPredictionState {
  errorRateHistory: ErrorRatePoint[];
  latencyTrend: LatencyPoint[];
}

export class FailurePredictor {
  private states = new Map<string, ModelPredictionState>();
  private readonly maxHistory = 30; // 30 data points (1 per minute = 30 min window)

  recordMetrics(modelId: string, errorRate: number, avgLatencyMs: number): void {
    const state = this.getOrCreateState(modelId);
    const now = Date.now();

    state.errorRateHistory.push({ ts: now, rate: errorRate });
    state.latencyTrend.push({ ts: now, avgMs: avgLatencyMs });

    // Trim to window
    if (state.errorRateHistory.length > this.maxHistory) {
      state.errorRateHistory = state.errorRateHistory.slice(-this.maxHistory);
    }
    if (state.latencyTrend.length > this.maxHistory) {
      state.latencyTrend = state.latencyTrend.slice(-this.maxHistory);
    }
  }

  predict(modelId: string): PredictionResult {
    const state = this.states.get(modelId);
    if (!state || state.errorRateHistory.length < 5) {
      return { modelId, willFail: false, confidence: 0, estimatedFailureTs: null, reason: null };
    }

    const window = state.errorRateHistory;
    const n = window.length;
    const xs = window.map((_, i) => i);
    const ys = window.map((w) => w.rate);

    // Linear regression
    const xMean = xs.reduce((a, b) => a + b, 0) / n;
    const yMean = ys.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (xs[i] - xMean) * (ys[i] - yMean);
      denominator += (xs[i] - xMean) ** 2;
    }

    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - slope * xMean;

    // If trend is flat or improving, no failure predicted
    if (slope <= 0) {
      return { modelId, willFail: false, confidence: 0, estimatedFailureTs: null, reason: null };
    }

    // Project: when will error rate hit 50%?
    const FAILURE_THRESHOLD = 0.50;
    const currentRate = ys[ys.length - 1];
    const minutesUntilThreshold = (FAILURE_THRESHOLD - currentRate) / slope;
    const HORIZON_MINUTES = 10;

    if (minutesUntilThreshold > HORIZON_MINUTES || minutesUntilThreshold < 0) {
      return { modelId, willFail: false, confidence: 0, estimatedFailureTs: null, reason: null };
    }

    // R-squared as confidence
    const ssRes = ys.reduce((sum, y, i) => sum + (y - (intercept + slope * xs[i])) ** 2, 0);
    const ssTot = ys.reduce((sum, y) => sum + (y - yMean) ** 2, 0);
    const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // Latency spike detection
    const recentLat = state.latencyTrend.slice(-5).map((l) => l.avgMs);
    const latMean = recentLat.reduce((a, b) => a + b, 0) / (recentLat.length || 1);
    const olderLat = state.latencyTrend.slice(-15, -5).map((l) => l.avgMs);
    const olderMean = olderLat.length > 0 ? olderLat.reduce((a, b) => a + b, 0) / olderLat.length : latMean;
    const latencySpike = olderMean > 0 ? latMean / olderMean > 2.0 : false;

    // Combine signals
    const confidence = Math.min(1.0, rSquared * (latencySpike ? 1.3 : 1.0));
    const estimatedFailureTs = Date.now() + minutesUntilThreshold * 60_000;

    const reasons: string[] = [];
    if (slope > 0.05) reasons.push(`error rate rising ${(slope * 100).toFixed(1)}%/min`);
    if (latencySpike) reasons.push(`latency spiked ${(latMean / olderMean).toFixed(1)}x`);
    if (currentRate > 0.2) reasons.push(`current error rate ${(currentRate * 100).toFixed(0)}%`);

    const result: PredictionResult = {
      modelId,
      willFail: confidence > 0.6,
      confidence,
      estimatedFailureTs,
      reason: reasons.join('; ') || null,
    };

    if (result.willFail) {
      serviceBus.emit('alert:new', {
        ts: Date.now(),
        type: 'prediction_warning',
        severity: 'warning',
        modelId,
        message: `Predicted failure for ${modelId} in ~${Math.round(minutesUntilThreshold)}min (confidence: ${(confidence * 100).toFixed(0)}%). ${result.reason}`,
        acknowledged: false,
      });
    }

    return result;
  }

  predictAll(): PredictionResult[] {
    return Array.from(this.states.keys()).map((modelId) => this.predict(modelId));
  }

  private getOrCreateState(modelId: string): ModelPredictionState {
    let state = this.states.get(modelId);
    if (!state) {
      state = { errorRateHistory: [], latencyTrend: [] };
      this.states.set(modelId, state);
    }
    return state;
  }
}
