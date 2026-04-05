import WebSocket from 'ws';
import { serviceBus } from '../service-bus';
import { createRequest, parseFrame, isResponse, isEvent } from './protocol';
import { getGatewayToken, getGatewayPort } from './auth';
import type { GatewayResponse } from '../../shared/types';
import type { GatewayStatus } from '../../shared/types';
import { RECONNECT_BASE_MS, RECONNECT_MAX_MS, DEFAULT_GATEWAY_URL, APP_VERSION } from '../../shared/constants';

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
};

export class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string = DEFAULT_GATEWAY_URL;
  private token: string | null = null;
  private connId: string | null = null;
  private serverVersion: string | null = null;
  private connected = false;
  private reconnecting = false;
  private lastError: string | null = null;
  private backoffMs = RECONNECT_BASE_MS;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private tickTimer: NodeJS.Timeout | null = null;
  private tickIntervalMs = 30_000;
  private lastTick = 0;
  private pendingRequests = new Map<string, PendingRequest>();
  private connectTime = 0;
  private intentionalClose = false;

  async connect(url?: string, token?: string): Promise<void> {
    if (url) this.url = url;
    if (token) {
      this.token = token;
    } else if (!this.token) {
      this.token = getGatewayToken();
    }

    if (!this.url.startsWith('ws://') && !this.url.startsWith('wss://')) {
      const port = getGatewayPort();
      this.url = `ws://127.0.0.1:${port}`;
    }

    this.intentionalClose = false;
    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          console.log('[Gateway] WebSocket connected');
          this.sendConnectRequest()
            .then(() => resolve())
            .catch(reject);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
          const msg = reason.toString() || `code ${code}`;
          console.log(`[Gateway] Disconnected: ${msg}`);
          this.onDisconnect(msg);
        });

        this.ws.on('error', (err: Error) => {
          this.lastError = err.message;
          console.error(`[Gateway] Error: ${err.message}`);
          if (!this.connected) reject(err);
        });
      } catch (err: any) {
        reject(err);
      }
    });
  }

  private async sendConnectRequest(): Promise<void> {
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'clawpilot',
        displayName: 'ClawPilot',
        version: APP_VERSION,
        platform: process.platform,
        mode: 'ui',
      },
      caps: ['tool-events'],
      role: 'operator',
      scopes: ['operator.read'],
      ...(this.token ? { auth: { token: this.token } } : {}),
    };

    const response = await this.request('connect', params) as any;
    this.connected = true;
    this.reconnecting = false;
    this.backoffMs = RECONNECT_BASE_MS;
    this.connId = response?.server?.connId ?? null;
    this.serverVersion = response?.server?.version ?? null;
    this.connectTime = Date.now();
    this.lastTick = Date.now();

    if (response?.policy?.tickIntervalMs) {
      this.tickIntervalMs = response.policy.tickIntervalMs;
    }
    this.startTickWatch();

    serviceBus.emit('gateway:connected', response);
    this.emitStatus();
    console.log(`[Gateway] Connected (connId: ${this.connId}, server: ${this.serverVersion})`);
  }

  request(method: string, params?: unknown, timeoutMs = 30_000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const frame = createRequest(method, params);
      const timer = setTimeout(() => {
        this.pendingRequests.delete(frame.id);
        reject(new Error(`Request ${method} timed out`));
      }, timeoutMs);

      this.pendingRequests.set(frame.id, { resolve, reject, timer });
      this.ws.send(JSON.stringify(frame));
    });
  }

  private handleMessage(raw: string): void {
    const frame = parseFrame(raw);
    if (!frame) return;

    if (isResponse(frame)) {
      const pending = this.pendingRequests.get(frame.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingRequests.delete(frame.id);
        if (frame.ok) {
          pending.resolve(frame.payload);
        } else {
          pending.reject(new Error(frame.error?.message ?? 'Request failed'));
        }
      }
      return;
    }

    if (isEvent(frame)) {
      this.lastTick = Date.now();

      if (frame.event === 'tick') return;

      serviceBus.emit('gateway:event', { event: frame.event, payload: frame.payload });
    }
  }

  private startTickWatch(): void {
    this.stopTickWatch();
    this.tickTimer = setInterval(() => {
      if (Date.now() - this.lastTick > this.tickIntervalMs * 2.5) {
        console.warn('[Gateway] Tick timeout, closing connection');
        this.ws?.close(4000, 'tick timeout');
      }
    }, this.tickIntervalMs);
  }

  private stopTickWatch(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  private onDisconnect(reason: string): void {
    this.connected = false;
    this.stopTickWatch();

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Disconnected'));
    }
    this.pendingRequests.clear();

    serviceBus.emit('gateway:disconnected', reason);
    this.emitStatus();

    if (!this.intentionalClose) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnecting = true;
    this.emitStatus();

    const delay = this.backoffMs + Math.random() * 1000;
    this.backoffMs = Math.min(this.backoffMs * 2, RECONNECT_MAX_MS);

    console.log(`[Gateway] Reconnecting in ${Math.round(delay)}ms`);
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.doConnect();
      } catch {
        this.scheduleReconnect();
      }
    }, delay);
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.connected = false;
    this.reconnecting = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopTickWatch();

    if (this.ws) {
      this.ws.close(1000, 'user disconnect');
      this.ws = null;
    }

    this.emitStatus();
  }

  getStatus(): GatewayStatus {
    return {
      connected: this.connected,
      connId: this.connId ?? undefined,
      serverVersion: this.serverVersion ?? undefined,
      uptime: this.connected ? Date.now() - this.connectTime : undefined,
      url: this.url,
      reconnecting: this.reconnecting,
      lastError: this.lastError ?? undefined,
    };
  }

  private emitStatus(): void {
    serviceBus.emit('gateway:status', this.getStatus());
  }
}
