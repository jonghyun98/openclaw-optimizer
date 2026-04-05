export enum TaskCategory {
  SIMPLE = 'simple',
  CODE = 'code',
  ANALYSIS = 'analysis',
  CREATIVE = 'creative',
  MULTIMODAL = 'multimodal',
}

const CODE_SIGNALS = [
  /```[\s\S]*```/,
  /\b(function|class|const|let|var|import|export|def |async |await )\b/,
  /\b(debug|error|bug|fix|refactor|implement|compile|runtime)\b/i,
  /\.(ts|js|py|go|rs|java|cpp|rb|sh)\b/,
  /\b(API|endpoint|request|response|HTTP|REST|GraphQL)\b/i,
];

const ANALYSIS_SIGNALS = [
  /\b(summarize|analyze|compare|review|explain in detail|break down)\b/i,
  /\b(document|report|paper|article|research)\b/i,
];

const CREATIVE_SIGNALS = [
  /\b(write|compose|create|imagine|story|poem|essay|brainstorm)\b/i,
  /\b(creative|fiction|narrative|dialogue|scenario)\b/i,
];

interface Attachment {
  type: string;
  name?: string;
}

export function classifyTask(message: string, attachments?: Attachment[]): TaskCategory {
  // 1. Multimodal check (fast path)
  if (attachments?.some((a) => a.type.startsWith('image/'))) {
    return TaskCategory.MULTIMODAL;
  }

  // 2. Code detection
  const codeScore = CODE_SIGNALS.filter((r) => r.test(message)).length;
  if (codeScore >= 2) return TaskCategory.CODE;

  // 3. Analysis detection
  const isLong = message.length > 2000;
  const analysisScore = ANALYSIS_SIGNALS.filter((r) => r.test(message)).length + (isLong ? 2 : 0);
  if (analysisScore >= 2) return TaskCategory.ANALYSIS;

  // 4. Creative detection
  const creativeScore = CREATIVE_SIGNALS.filter((r) => r.test(message)).length;
  if (creativeScore >= 2) return TaskCategory.CREATIVE;

  // 5. Default: simple
  return TaskCategory.SIMPLE;
}

export function getTaskCategoryLabel(category: TaskCategory): string {
  switch (category) {
    case TaskCategory.SIMPLE: return 'Simple Q&A';
    case TaskCategory.CODE: return 'Code';
    case TaskCategory.ANALYSIS: return 'Analysis';
    case TaskCategory.CREATIVE: return 'Creative';
    case TaskCategory.MULTIMODAL: return 'Multimodal';
  }
}
