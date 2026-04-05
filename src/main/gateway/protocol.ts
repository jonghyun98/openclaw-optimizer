import type { GatewayRequest, GatewayResponse, GatewayEvent } from '../../shared/types';

let requestCounter = 0;

export function createRequest(method: string, params?: unknown): GatewayRequest {
  return {
    type: 'req',
    id: `req_${++requestCounter}_${Date.now()}`,
    method,
    params,
  };
}

export function parseFrame(data: string): GatewayRequest | GatewayResponse | GatewayEvent | null {
  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object' || !parsed.type) return null;
    if (parsed.type === 'req' || parsed.type === 'res' || parsed.type === 'event') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function isResponse(frame: any): frame is GatewayResponse {
  return frame?.type === 'res';
}

export function isEvent(frame: any): frame is GatewayEvent {
  return frame?.type === 'event';
}
