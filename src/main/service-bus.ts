import { EventEmitter } from 'node:events';
import type { MetricsSnapshot, FallbackEvent, RequestLogEntry, ModelState, Alert, ChainRecommendation, GatewayStatus } from '../shared/types';

export interface ServiceBusEvents {
  'gateway:connected': [HelloOk: unknown];
  'gateway:disconnected': [reason: string];
  'gateway:event': [event: { event: string; payload: unknown }];
  'gateway:status': [status: GatewayStatus];
  'metrics:snapshot': [snapshot: MetricsSnapshot];
  'metrics:request': [entry: RequestLogEntry];
  'model:state-change': [change: { modelId: string; prev: string; next: string; reason: string }];
  'fallback:event': [event: FallbackEvent];
  'optimizer:recommendation': [rec: ChainRecommendation];
  'alert:new': [alert: Alert];
}

class TypedEventEmitter extends EventEmitter {
  emit<K extends keyof ServiceBusEvents>(event: K, ...args: ServiceBusEvents[K]): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof ServiceBusEvents>(event: K, listener: (...args: ServiceBusEvents[K]) => void): this {
    return super.on(event, listener as (...args: any[]) => void);
  }

  off<K extends keyof ServiceBusEvents>(event: K, listener: (...args: ServiceBusEvents[K]) => void): this {
    return super.off(event, listener as (...args: any[]) => void);
  }
}

export const serviceBus = new TypedEventEmitter();
serviceBus.setMaxListeners(50);
