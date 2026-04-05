import { getSqlite } from '../db/connection';

export interface CostSummary {
  totalUsd: number;
  byModel: Record<string, {
    totalUsd: number;
    requests: number;
    inputTokens: number;
    outputTokens: number;
  }>;
  period: { from: number; to: number };
}

export interface CostProjection {
  currentMonthEstimate: number;
  dailyAverage: number;
  topModel: { id: string; costUsd: number };
  savings: Array<{ suggestion: string; estimatedSaving: number }>;
}

export class CostTracker {
  getSummary(from: number, to: number): CostSummary {
    const sqlite = getSqlite();
    const rows = sqlite.prepare(`
      SELECT model_id,
        COUNT(*) as requests,
        SUM(cost_usd) as total_cost,
        SUM(input_tokens) as total_input,
        SUM(output_tokens) as total_output
      FROM metrics_raw
      WHERE ts >= ? AND ts <= ?
      GROUP BY model_id
    `).all(from, to) as any[];

    const byModel: CostSummary['byModel'] = {};
    let totalUsd = 0;

    for (const row of rows) {
      const cost = row.total_cost ?? 0;
      totalUsd += cost;
      byModel[row.model_id] = {
        totalUsd: cost,
        requests: row.requests,
        inputTokens: row.total_input ?? 0,
        outputTokens: row.total_output ?? 0,
      };
    }

    return { totalUsd, byModel, period: { from, to } };
  }

  getProjection(): CostProjection {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * dayMs;

    const summary = this.getSummary(weekAgo, now);
    const daysOfData = Math.max(1, (now - weekAgo) / dayMs);
    const dailyAverage = summary.totalUsd / daysOfData;

    // Estimate remaining month
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - today.getDate();
    const currentMonthEstimate = summary.totalUsd + dailyAverage * daysRemaining;

    // Find top cost model
    let topModel = { id: '', costUsd: 0 };
    for (const [id, data] of Object.entries(summary.byModel)) {
      if (data.totalUsd > topModel.costUsd) {
        topModel = { id, costUsd: data.totalUsd };
      }
    }

    // Generate savings suggestions
    const savings: CostProjection['savings'] = [];

    // Check if expensive models are used for simple tasks
    for (const [id, data] of Object.entries(summary.byModel)) {
      if (id.includes('opus') && data.requests > 10) {
        const potentialSaving = data.totalUsd * 0.7; // ~70% cheaper with smaller model
        if (potentialSaving > 0.1) {
          savings.push({
            suggestion: `Route simple queries away from ${id.split('/')[1]} to a lighter model`,
            estimatedSaving: potentialSaving,
          });
        }
      }
    }

    if (dailyAverage > 1) {
      savings.push({
        suggestion: 'Enable task-based routing to automatically use cheaper models for simple tasks',
        estimatedSaving: dailyAverage * 0.3 * 30,
      });
    }

    return { currentMonthEstimate, dailyAverage, topModel, savings };
  }

  getDailyBreakdown(days: number = 7): Array<{ date: string; totalUsd: number; byModel: Record<string, number> }> {
    const sqlite = getSqlite();
    const from = Date.now() - days * 24 * 60 * 60 * 1000;

    const rows = sqlite.prepare(`
      SELECT date(ts / 1000, 'unixepoch', 'localtime') as date_str,
        model_id,
        SUM(cost_usd) as total_cost
      FROM metrics_raw
      WHERE ts >= ?
      GROUP BY date_str, model_id
      ORDER BY date_str
    `).all(from) as any[];

    const dayMap = new Map<string, { totalUsd: number; byModel: Record<string, number> }>();

    for (const row of rows) {
      const existing = dayMap.get(row.date_str) ?? { totalUsd: 0, byModel: {} };
      const cost = row.total_cost ?? 0;
      existing.totalUsd += cost;
      existing.byModel[row.model_id] = (existing.byModel[row.model_id] ?? 0) + cost;
      dayMap.set(row.date_str, existing);
    }

    return Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data }));
  }
}
