import { describe, it, expect } from 'vitest';
import { classifyTask, TaskCategory } from '../../src/main/optimizer/task-classifier';

describe('classifyTask', () => {
  it('classifies simple questions', () => {
    expect(classifyTask('Hello, how are you?')).toBe(TaskCategory.SIMPLE);
    expect(classifyTask('What time is it?')).toBe(TaskCategory.SIMPLE);
  });

  it('detects code tasks', () => {
    expect(classifyTask('Fix this bug in the function that handles API requests')).toBe(TaskCategory.CODE);
    expect(classifyTask('```typescript\nconst x = 1;\n```\nPlease refactor this')).toBe(TaskCategory.CODE);
    expect(classifyTask('debug the runtime error in main.ts')).toBe(TaskCategory.CODE);
  });

  it('detects analysis tasks', () => {
    const longText = 'Please analyze this document and provide a detailed summary. '.repeat(50);
    expect(classifyTask(longText)).toBe(TaskCategory.ANALYSIS);
    expect(classifyTask('Summarize this research paper and compare it with the previous report')).toBe(TaskCategory.ANALYSIS);
  });

  it('detects creative tasks', () => {
    expect(classifyTask('Write a creative story about a robot')).toBe(TaskCategory.CREATIVE);
    expect(classifyTask('Compose a creative poem about nature and imagine a fictional narrative')).toBe(TaskCategory.CREATIVE);
  });

  it('detects multimodal tasks', () => {
    expect(classifyTask('What is in this image?', [{ type: 'image/png' }])).toBe(TaskCategory.MULTIMODAL);
  });

  it('defaults to simple for ambiguous input', () => {
    expect(classifyTask('Thanks!')).toBe(TaskCategory.SIMPLE);
    expect(classifyTask('OK')).toBe(TaskCategory.SIMPLE);
  });
});
