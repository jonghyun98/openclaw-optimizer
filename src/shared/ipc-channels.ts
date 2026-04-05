// IPC channel constants - single source of truth

export const IPC = {
  // Request/Response (invoke/handle)
  GATEWAY_CONNECT: 'clawpilot:gateway-connect',
  GATEWAY_DISCONNECT: 'clawpilot:gateway-disconnect',
  GATEWAY_STATUS: 'clawpilot:gateway-status',
  MODELS_LIST: 'clawpilot:models-list',
  METRICS_QUERY: 'clawpilot:metrics-query',
  CHAIN_GET: 'clawpilot:chain-get',
  CHAIN_APPLY: 'clawpilot:chain-apply',
  COST_SUMMARY: 'clawpilot:cost-summary',
  ALERTS_LIST: 'clawpilot:alerts-list',
  ALERTS_ACK: 'clawpilot:alerts-ack',
  SETTINGS_GET: 'clawpilot:settings-get',
  SETTINGS_SET: 'clawpilot:settings-set',
  CONFIG_READ: 'clawpilot:config-read',

  // Push events (main -> renderer)
  METRICS_SNAPSHOT: 'clawpilot:metrics-snapshot',
  MODEL_STATE_CHANGE: 'clawpilot:model-state-change',
  FALLBACK_EVENT: 'clawpilot:fallback-event',
  PREDICTION_ALERT: 'clawpilot:prediction-alert',
  GATEWAY_CONNECTION: 'clawpilot:gateway-connection',
  ALERT_NEW: 'clawpilot:alert-new',
  CHAIN_RECOMMENDATION: 'clawpilot:chain-recommendation',
  REQUEST_LOG: 'clawpilot:request-log',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];
