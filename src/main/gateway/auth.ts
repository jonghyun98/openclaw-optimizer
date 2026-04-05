import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

interface OpenClawConfig {
  gateway?: {
    port?: number;
    auth?: {
      token?: string;
    };
  };
}

export function loadOpenClawConfig(): OpenClawConfig | null {
  const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
  try {
    if (!fs.existsSync(configPath)) return null;
    const content = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function getGatewayToken(): string | null {
  const config = loadOpenClawConfig();
  return config?.gateway?.auth?.token ?? null;
}

export function getGatewayPort(): number {
  const config = loadOpenClawConfig();
  return config?.gateway?.port ?? 18789;
}
