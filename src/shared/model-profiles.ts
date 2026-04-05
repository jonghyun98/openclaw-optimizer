export interface ModelProfile {
  modelId: string;
  displayName: string;
  provider: string;
  capabilities: {
    simple: number;
    code: number;
    analysis: number;
    creative: number;
    multimodal: number;
  };
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
}

export const DEFAULT_MODEL_PROFILES: ModelProfile[] = [
  {
    modelId: 'anthropic/claude-opus-4',
    displayName: 'Claude Opus 4',
    provider: 'anthropic',
    capabilities: { simple: 0.9, code: 0.95, analysis: 0.95, creative: 0.9, multimodal: 0.9 },
    contextWindow: 200_000,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  {
    modelId: 'anthropic/claude-sonnet-4-6',
    displayName: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    capabilities: { simple: 0.85, code: 0.9, analysis: 0.88, creative: 0.85, multimodal: 0.85 },
    contextWindow: 200_000,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  {
    modelId: 'anthropic/claude-haiku-4-5',
    displayName: 'Claude Haiku 4.5',
    provider: 'anthropic',
    capabilities: { simple: 0.8, code: 0.7, analysis: 0.65, creative: 0.6, multimodal: 0.7 },
    contextWindow: 200_000,
    costPer1kInput: 0.0008,
    costPer1kOutput: 0.004,
  },
  {
    modelId: 'openai/gpt-5',
    displayName: 'GPT-5',
    provider: 'openai',
    capabilities: { simple: 0.9, code: 0.92, analysis: 0.9, creative: 0.88, multimodal: 0.92 },
    contextWindow: 128_000,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
  {
    modelId: 'google/gemini-3-pro',
    displayName: 'Gemini 3 Pro',
    provider: 'google',
    capabilities: { simple: 0.85, code: 0.85, analysis: 0.88, creative: 0.8, multimodal: 0.95 },
    contextWindow: 1_000_000,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },
  {
    modelId: 'meta/llama-4-maverick',
    displayName: 'Llama 4 Maverick',
    provider: 'meta',
    capabilities: { simple: 0.75, code: 0.72, analysis: 0.7, creative: 0.65, multimodal: 0.6 },
    contextWindow: 128_000,
    costPer1kInput: 0.0,
    costPer1kOutput: 0.0,
  },
];
