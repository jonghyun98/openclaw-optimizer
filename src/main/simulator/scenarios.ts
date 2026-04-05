export interface FailureScenario {
  id: string;
  name: string;
  description: string;
  modelDown: string;
  duration: string;
  errorPattern: 'instant' | 'gradual' | 'intermittent';
}

export const PREDEFINED_SCENARIOS: FailureScenario[] = [
  {
    id: 'claude-down',
    name: 'Claude API Outage',
    description: 'Anthropic Claude API becomes completely unavailable',
    modelDown: 'anthropic/claude-sonnet-4-6',
    duration: '30min',
    errorPattern: 'instant',
  },
  {
    id: 'openai-rate-limit',
    name: 'OpenAI Rate Limit Storm',
    description: 'GPT-5 hits rate limits across all API keys',
    modelDown: 'openai/gpt-5',
    duration: '15min',
    errorPattern: 'gradual',
  },
  {
    id: 'gemini-degraded',
    name: 'Gemini Degraded Performance',
    description: 'Gemini 3 Pro responds but with 5x latency',
    modelDown: 'google/gemini-3-pro',
    duration: '60min',
    errorPattern: 'intermittent',
  },
  {
    id: 'multi-provider',
    name: 'Multi-Provider Failure',
    description: 'Both Claude and GPT-5 go down simultaneously',
    modelDown: 'anthropic/claude-sonnet-4-6,openai/gpt-5',
    duration: '10min',
    errorPattern: 'instant',
  },
];
