import { useEffect, useRef } from 'react';

export function useIpcEvent(channel: string, callback: (...args: unknown[]) => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handler = (...args: unknown[]) => callbackRef.current(...args);
    const unsubscribe = window.clawpilot.on(channel, handler);
    return unsubscribe;
  }, [channel]);
}
