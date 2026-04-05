export interface ConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    displayName: string;
    version: string;
    platform: string;
    mode: string;
  };
  caps: string[];
  role: string;
  scopes: string[];
  auth?: {
    token: string;
  };
}

export interface HelloOkResponse {
  protocol: number;
  server: { version: string; connId: string };
  features: { methods: string[]; events: string[] };
  snapshot: unknown;
  policy: {
    maxPayload: number;
    maxBufferedBytes: number;
    tickIntervalMs: number;
  };
}
