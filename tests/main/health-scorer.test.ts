import { describe, it, expect } from 'vitest';
import { HealthScorer } from '../../src/main/optimizer/health-scorer';

describe('HealthScorer', () => {
  it('starts with no models', () => {
    const scorer = new HealthScorer();
    expect(scorer.getAllModelStates()).toEqual([]);
  });

  it('records requests and computes health', () => {
    const scorer = new HealthScorer();

    // Record successful requests
    for (let i = 0; i < 10; i++) {
      scorer.recordRequest({
        ts: Date.now(),
        modelId: 'anthropic/claude-sonnet-4-6',
        success: true,
        latencyMs: 500 + Math.random() * 200,
        wasFallback: false,
      });
    }

    const states = scorer.getAllModelStates();
    expect(states.length).toBe(1);
    expect(states[0].id).toBe('anthropic/claude-sonnet-4-6');
    expect(states[0].healthScore).toBeGreaterThan(0);
    expect(states[0].status).toBe('healthy');
  });

  it('degrades score on errors', () => {
    const scorer = new HealthScorer();

    // Mix of success and failure
    for (let i = 0; i < 10; i++) {
      scorer.recordRequest({
        ts: Date.now(),
        modelId: 'openai/gpt-5',
        success: i < 3, // 70% failure
        latencyMs: 1000,
        wasFallback: false,
        errorCode: i >= 3 ? 'rate_limit' : undefined,
      });
    }

    const states = scorer.getAllModelStates();
    expect(states[0].healthScore).toBeLessThan(0.7);
    expect(states[0].status).not.toBe('healthy');
  });

  it('generates chain recommendations', () => {
    const scorer = new HealthScorer();

    // Record for two models with different health
    for (let i = 0; i < 10; i++) {
      scorer.recordRequest({
        ts: Date.now(),
        modelId: 'anthropic/claude-sonnet-4-6',
        success: true,
        latencyMs: 400,
        wasFallback: false,
      });
      scorer.recordRequest({
        ts: Date.now(),
        modelId: 'openai/gpt-5',
        success: i < 5, // 50% failure
        latencyMs: 2000,
        wasFallback: false,
      });
    }

    const rec = scorer.getChainRecommendation();
    expect(rec).not.toBeNull();
    expect(rec!.recommended.primary).toBe('anthropic/claude-sonnet-4-6');
  });
});
