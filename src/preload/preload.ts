import { contextBridge, ipcRenderer } from 'electron';

type Callback = (...args: unknown[]) => void;

contextBridge.exposeInMainWorld('clawpilot', {
  invoke: (channel: string, ...args: unknown[]) => {
    if (!channel.startsWith('clawpilot:')) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel: string, callback: Callback) => {
    if (!channel.startsWith('clawpilot:')) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
  },
});
