import type { FailureScenario } from './scenarios';
import type { ModelState, ChainConfig, RequestLogEntry } from '../../shared/types';

export interface SimulationConfig {
  scenario: FailureScenario;
  chain: ChainConfig;
  durationMinutes: number;
  requestsPerMinute: number;
}

export interface SimulationResult {
  scenario: FailureScenario;
  chain: ChainConfig;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  fallbackCount: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  timelineEvents: SimTimelineEvent[];
  summary: string;
}

export interface SimTimelineEvent {
  minuteOffset: number;
  modelId: string;
  success: boolean;
  latencyMs: number;
  wasFallback: boolean;
}

export class SimulationEngine {
  simulate(config: SimulationConfig): SimulationResult {
    const { scenario, chain, durationMinutes, requestsPerMinute } = config;
    const downModels = new Set(scenario.modelDown.split(',').map((s) => s.trim()));
    const allModels = [chain.primary, ...chain.fallbacks];
    const timeline: SimTimelineEvent[] = [];
    let successCount = 0;
    let failCount = 0;
    let fallbackCount = 0;
    let totalLatency = 0;
    let totalCost = 0;

    for (let min = 0; min < durationMinutes; min++) {
      for (let req = 0; req < requestsPerMinute; req++) {
        const result = this.simulateRequest(min, allModels, downModels, scenario, durationMinutes);
        timeline.push({
          minuteOffset: min,
          modelId: result.modelId,
          success: result.success,
          latencyMs: result.latencyMs,
          wasFallback: result.wasFallback,
        });

        if (result.success) {
          successCount++;
          totalLatency += result.latencyMs;
          totalCost += result.costUsd;
        } else {
          failCount++;
        }
        if (result.wasFallback) fallbackCount++;
      }
    }

    const totalRequests = successCount + failCount;
    const successRate = totalRequests > 0 ? (successCount / totalRequests * 100).toFixed(1) : '0';
    const avgLatency = successCount > 0 ? Math.round(totalLatency / successCount) : 0;

    return {
      scenario,
      chain,
      totalRequests,
      successfulRequests: successCount,
      failedRequests: failCount,
      fallbackCount,
      avgLatencyMs: avgLatency,
      totalCostUsd: totalCost,
      timelineEvents: timeline,
      summary: `${successRate}% success rate, ${fallbackCount} fallbacks, avg ${avgLatency}ms latency, $${totalCost.toFixed(4)} cost`,
    };
  }

  private simulateRequest(
    minute: number,
    allModels: string[],
    downModels: Set<string>,
    scenario: FailureScenario,
    totalMinutes: number
  ): { modelId: string; success: boolean; latencyMs: number; costUsd: number; wasFallback: boolean } {
    for (let i = 0; i < allModels.length; i++) {
      const modelId = allModels[i];
      const isDown = this.isModelDown(modelId, minute, downModels, scenario, totalMinutes);

      if (!isDown) {
        const baseLatency = this.getBaseLatency(modelId);
        const latency = baseLatency + Math.random() * baseLatency * 0.3;
        const cost = this.getBaseCost(modelId);

        return {
          modelId,
          success: true,
          latencyMs: Math.round(latency),
          costUsd: cost,
          wasFallback: i > 0,
        };
      }
    }

    // All models failed
    return { modelId: allModels[0], success: false, latencyMs: 0, costUsd: 0, wasFallback: false };
  }

  private isModelDown(
    modelId: string,
    minute: number,
    downModels: Set<string>,
    scenario: FailureScenario,
    totalMinutes: number
  ): boolean {
    if (!downModels.has(modelId)) return false;

    switch (scenario.errorPattern) {
      case 'instant':
        return true;
      case 'gradual': {
        const progress = minute / totalMinutes;
        return Math.random() < progress;
      }
      case 'intermittent':
        return Math.random() < 0.4; // 40% failure rate
      default:
        return true;
    }
  }

  private getBaseLatency(modelId: string): number {
    if (modelId.includes('haiku')) return 200;
    if (modelId.includes('sonnet') || modelId.includes('flash')) return 500;
    if (modelId.includes('llama')) return 300;
    if (modelId.includes('gemini')) return 600;
    return 800; // opus, gpt-5
  }

  private getBaseCost(modelId: string): number {
    if (modelId.includes('llama')) return 0;
    if (modelId.includes('haiku') || modelId.includes('flash')) return 0.0005;
    if (modelId.includes('sonnet') || modelId.includes('mini')) return 0.002;
    if (modelId.includes('gemini')) return 0.001;
    return 0.005; // opus, gpt-5
  }
}
