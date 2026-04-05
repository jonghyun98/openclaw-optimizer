// Model pricing per 1K tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  'anthropic/claude-opus-4': { input: 0.015, output: 0.075 },
  'anthropic/claude-sonnet-4-6': { input: 0.003, output: 0.015 },
  'anthropic/claude-haiku-4-5': { input: 0.0008, output: 0.004 },
  'openai/gpt-5': { input: 0.01, output: 0.03 },
  'openai/gpt-4.1': { input: 0.002, output: 0.008 },
  'openai/gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
  'google/gemini-3-pro': { input: 0.00125, output: 0.005 },
  'google/gemini-2.5-flash': { input: 0.00015, output: 0.00035 },
  'meta/llama-4-maverick': { input: 0, output: 0 },
};

export function computeCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[modelId];
  if (!pricing) return 0;
  return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
}

export function getCostPer1kOutput(modelId: string): number {
  return PRICING[modelId]?.output ?? 0;
}

export function getMaxCostInPool(): number {
  return Math.max(...Object.values(PRICING).map((p) => p.output));
}
