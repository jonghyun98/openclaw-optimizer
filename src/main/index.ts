import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { initDb, closeDb } from './db/connection';
import { runMigrations } from './db/migrate';
import { registerIpcHandlers } from './ipc-router';
import { GatewayClient } from './gateway/client';
import { MetricsEngine } from './metrics/engine';
import { HealthScorer } from './optimizer/health-scorer';
import { AlertManager } from './alerts/manager';
import { serviceBus } from './service-bus';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;
let gatewayClient: GatewayClient | null = null;
let metricsEngine: MetricsEngine | null = null;
let healthScorer: HealthScorer | null = null;
let alertManager: AlertManager | null = null;

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'ClawPilot',
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#030712',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Forward service bus events to renderer
  const forwardEvents: Array<{ busEvent: string; ipcChannel: string }> = [
    { busEvent: 'metrics:snapshot', ipcChannel: 'clawpilot:metrics-snapshot' },
    { busEvent: 'model:state-change', ipcChannel: 'clawpilot:model-state-change' },
    { busEvent: 'fallback:event', ipcChannel: 'clawpilot:fallback-event' },
    { busEvent: 'gateway:status', ipcChannel: 'clawpilot:gateway-connection' },
    { busEvent: 'alert:new', ipcChannel: 'clawpilot:alert-new' },
    { busEvent: 'optimizer:recommendation', ipcChannel: 'clawpilot:chain-recommendation' },
    { busEvent: 'metrics:request', ipcChannel: 'clawpilot:request-log' },
  ];

  for (const { busEvent, ipcChannel } of forwardEvents) {
    serviceBus.on(busEvent as any, (...args: any[]) => {
      mainWindow?.webContents.send(ipcChannel, ...args);
    });
  }
}

async function initServices(): Promise<void> {
  // Initialize database
  initDb();
  runMigrations();
  console.log('[ClawPilot] Database initialized');

  // Initialize services
  healthScorer = new HealthScorer();
  metricsEngine = new MetricsEngine(healthScorer);
  alertManager = new AlertManager();
  gatewayClient = new GatewayClient();

  // Register IPC handlers
  registerIpcHandlers({ gatewayClient, metricsEngine, healthScorer, alertManager });

  console.log('[ClawPilot] Services initialized');
}

app.whenReady().then(async () => {
  await initServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  gatewayClient?.disconnect();
  metricsEngine?.stop();
  closeDb();
});
