import { Notification } from 'electron';
import { serviceBus } from '../service-bus';
import { getSqlite } from '../db/connection';
import type { Alert } from '../../shared/types';

export class AlertManager {
  private recentAlerts = new Map<string, number>(); // dedup key -> timestamp
  private throttleMs = 60_000; // Min 1 minute between same alerts

  constructor() {
    serviceBus.on('model:state-change', (change) => {
      if (change.next === 'down') {
        this.createAlert({
          ts: Date.now(),
          type: 'model_down',
          severity: 'critical',
          modelId: change.modelId,
          message: `Model ${change.modelId} is DOWN (was ${change.prev})`,
          acknowledged: false,
        });
      }
    });

    serviceBus.on('fallback:event', (event) => {
      this.createAlert({
        ts: Date.now(),
        type: 'fallback_storm',
        severity: 'warning',
        modelId: event.fromModel,
        message: `Fallback: ${event.fromModel} → ${event.toModel} (${event.reason})`,
        acknowledged: false,
      });
    });
  }

  private createAlert(alert: Alert): void {
    const dedupKey = `${alert.type}:${alert.modelId ?? 'global'}`;
    const lastTime = this.recentAlerts.get(dedupKey);

    if (lastTime && Date.now() - lastTime < this.throttleMs) {
      return; // Throttled
    }

    this.recentAlerts.set(dedupKey, Date.now());

    // Save to DB
    try {
      const sqlite = getSqlite();
      sqlite.prepare(
        'INSERT INTO alerts (ts, type, severity, model_id, message, acknowledged, metadata) VALUES (?, ?, ?, ?, ?, 0, ?)'
      ).run(alert.ts, alert.type, alert.severity, alert.modelId ?? null, alert.message, null);
    } catch (err) {
      console.error('[AlertManager] DB error:', err);
    }

    // Desktop notification
    if (Notification.isSupported()) {
      new Notification({
        title: `ClawPilot: ${alert.severity.toUpperCase()}`,
        body: alert.message,
        urgency: alert.severity === 'critical' ? 'critical' : 'normal',
      }).show();
    }

    serviceBus.emit('alert:new', alert);
  }

  getAlerts(limit: number, offset: number): Alert[] {
    try {
      const sqlite = getSqlite();
      return sqlite
        .prepare('SELECT * FROM alerts ORDER BY ts DESC LIMIT ? OFFSET ?')
        .all(limit, offset) as Alert[];
    } catch {
      return [];
    }
  }

  acknowledge(id: number): void {
    try {
      const sqlite = getSqlite();
      sqlite.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(id);
    } catch (err) {
      console.error('[AlertManager] Ack error:', err);
    }
  }
}
