declare global {
  interface Window {
    clawpilot: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
      platform: string;
      versions: { electron: string; node: string };
    };
  }
}

export const ipc = {
  invoke: <T = unknown>(channel: string, ...args: unknown[]): Promise<T> => {
    return window.clawpilot.invoke(channel, ...args) as Promise<T>;
  },
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    return window.clawpilot.on(channel, callback);
  },
};
