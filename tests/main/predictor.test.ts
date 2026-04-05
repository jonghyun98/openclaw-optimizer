import { describe, it, expect } from 'vitest';
import { FailurePredictor } from '../../src/main/optimizer/predictor';

describe('FailurePredictor', () => {
  it('returns no prediction with insufficient data', () => {
    const predictor = new FailurePredictor();
    predictor.recordMetrics('model-a', 0.1, 500);
    predictor.recordMetrics('model-a', 0.12, 520);

    const result = predictor.predict('model-a');
    expect(result.willFail).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it('predicts failure on rising error trend', () => {
    const predictor = new FailurePredictor();

    // Simulate rising error rate
    for (let i = 0; i < 10; i++) {
      predictor.recordMetrics('model-a', 0.05 + i * 0.05, 500 + i * 100);
    }

    const result = predictor.predict('model-a');
    // Error rate is rising: 0.05, 0.10, 0.15, ..., 0.50
    // Should predict failure
    expect(result.willFail).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.estimatedFailureTs).not.toBeNull();
    expect(result.reason).toBeTruthy();
  });

  it('does not predict failure on stable metrics', () => {
    const predictor = new FailurePredictor();

    // Stable low error rate
    for (let i = 0; i < 10; i++) {
      predictor.recordMetrics('model-b', 0.02 + Math.random() * 0.01, 500);
    }

    const result = predictor.predict('model-b');
    expect(result.willFail).toBe(false);
  });

  it('predicts all models', () => {
    const predictor = new FailurePredictor();

    for (let i = 0; i < 6; i++) {
      predictor.recordMetrics('model-a', 0.01, 500);
      predictor.recordMetrics('model-b', 0.01, 300);
    }

    const results = predictor.predictAll();
    expect(results.length).toBe(2);
  });
});
