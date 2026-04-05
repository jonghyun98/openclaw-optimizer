import type { ModelState, ChainConfig, ChainRecommendation } from '../../shared/types';
import { HYSTERESIS_THRESHOLD } from '../../shared/constants';
import { serviceBus } from '../service-bus';

export class ChainOptimizer {
  private currentChain: ChainConfig | null = null;
  private autoMode = false;

  computeOptimalChain(models: ModelState[]): ChainRecommendation {
    const ranked = [...models]
      .filter((m) => m.healthScore > 0)
      .sort((a, b) => b.healthScore - a.healthScore);

    if (ranked.length === 0) {
      const empty: ChainConfig = { primary: '', fallbacks: [] };
      return { current: this.currentChain ?? empty, recommended: empty, reason: 'No healthy models', improvement: 0 };
    }

    const recommended: ChainConfig = {
      primary: ranked[0].id,
      fallbacks: ranked.slice(1).map((m) => m.id),
    };

    const current = this.currentChain ?? recommended;

    // Hysteresis check
    const currentPrimary = models.find((m) => m.id === current.primary);
    const bestCandidate = ranked[0];
    let reason = 'Based on current health scores';
    let improvement = 0;

    if (currentPrimary && bestCandidate && bestCandidate.id !== current.primary) {
      const currentScore = currentPrimary.healthScore || 0.001;
      improvement = ((bestCandidate.healthScore - currentScore) / currentScore) * 100;

      if (improvement < HYSTERESIS_THRESHOLD * 100) {
        // Keep current primary, just reorder fallbacks
        return {
          current,
          recommended: {
            primary: current.primary,
            fallbacks: ranked.filter((m) => m.id !== current.primary).map((m) => m.id),
          },
          reason: `Current primary ${currentPrimary.displayName} stable (${improvement.toFixed(1)}% < ${HYSTERESIS_THRESHOLD * 100}% threshold)`,
          improvement: 0,
        };
      }

      reason = `${bestCandidate.displayName} has ${improvement.toFixed(1)}% better health score than ${currentPrimary.displayName}`;
    }

    const result: ChainRecommendation = { current, recommended, reason, improvement };

    // Auto-apply if enabled and significant improvement
    if (this.autoMode && improvement >= HYSTERESIS_THRESHOLD * 100) {
      this.applyChain(recommended);
      serviceBus.emit('optimizer:recommendation', result);
    }

    return result;
  }

  applyChain(chain: ChainConfig): void {
    this.currentChain = chain;
  }

  getCurrentChain(): ChainConfig | null {
    return this.currentChain;
  }

  setAutoMode(enabled: boolean): void {
    this.autoMode = enabled;
  }

  isAutoMode(): boolean {
    return this.autoMode;
  }
}
