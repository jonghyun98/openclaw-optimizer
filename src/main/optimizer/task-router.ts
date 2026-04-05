import { TaskCategory, classifyTask } from './task-classifier';
import type { ModelState } from '../../shared/types';
import { DEFAULT_MODEL_PROFILES, type ModelProfile } from '../../shared/model-profiles';

export interface RoutingDecision {
  modelId: string;
  reason: string;
  taskCategory: TaskCategory;
  combinedScore: number;
  alternatives: Array<{ modelId: string; score: number }>;
}

export class TaskRouter {
  private profiles: ModelProfile[] = DEFAULT_MODEL_PROFILES;

  route(message: string, models: ModelState[], attachments?: { type: string }[]): RoutingDecision {
    const category = classifyTask(message, attachments);
    return this.selectModelForTask(category, models);
  }

  selectModelForTask(task: TaskCategory, models: ModelState[]): RoutingDecision {
    const scored = models
      .filter((m) => m.healthScore > 0)
      .map((m) => {
        const profile = this.profiles.find((p) => p.modelId === m.id);
        const suitability = profile?.capabilities[task] ?? 0.5;
        const combinedScore = 0.6 * m.healthScore + 0.4 * suitability;
        return { modelId: m.id, combinedScore, suitability };
      })
      .sort((a, b) => b.combinedScore - a.combinedScore);

    const best = scored[0];
    const alternatives = scored.slice(1, 4).map((s) => ({
      modelId: s.modelId,
      score: s.combinedScore,
    }));

    return {
      modelId: best?.modelId ?? models[0]?.id ?? '',
      reason: `Best for ${task}: health=${models.find((m) => m.id === best?.modelId)?.healthScore.toFixed(2)}, suitability=${best?.suitability.toFixed(2)}`,
      taskCategory: task,
      combinedScore: best?.combinedScore ?? 0,
      alternatives,
    };
  }

  updateProfiles(profiles: ModelProfile[]): void {
    this.profiles = profiles;
  }
}
