import React, { useState, useEffect } from 'react';
import { useGatewayStore } from '../stores/gateway-store';
import { ipc } from '../lib/ipc-client';

export const SettingsPage: React.FC = () => {
  const { connected, url: currentUrl } = useGatewayStore();
  const [gatewayUrl, setGatewayUrl] = useState(currentUrl);
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load saved settings
    ipc.invoke<string>('clawpilot:settings-get', { key: 'gatewayUrl' }).then((val: any) => {
      if (val) setGatewayUrl(val);
    });
  }, []);

  const handleConnect = async () => {
    setStatus('Connecting...');
    try {
      const result = await ipc.invoke<{ ok: boolean; error?: string }>('clawpilot:gateway-connect', {
        url: gatewayUrl,
        token: token || undefined,
      });
      if (result.ok) {
        setStatus('Connected!');
        ipc.invoke('clawpilot:settings-set', { key: 'gatewayUrl', value: gatewayUrl });
      } else {
        setStatus(`Failed: ${result.error}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const handleDisconnect = () => {
    ipc.invoke('clawpilot:gateway-disconnect');
    setStatus('Disconnected');
  };

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-100">Settings</h2>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Gateway Connection</h3>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Gateway URL</label>
          <input
            type="text"
            value={gatewayUrl}
            onChange={(e) => setGatewayUrl(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-claw-500"
            placeholder="ws://127.0.0.1:18789"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Auth Token (optional)</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-claw-500"
            placeholder="Leave empty to auto-detect from openclaw.json"
          />
        </div>

        <div className="flex gap-2">
          {!connected ? (
            <button
              onClick={handleConnect}
              className="px-4 py-2 bg-claw-600 hover:bg-claw-700 text-white text-sm rounded-lg transition-colors"
            >
              Connect
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
          {status && <span className="text-xs text-gray-400 self-center">{status}</span>}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">Appearance</h3>
        <p className="text-xs text-gray-500">Theme: Dark (default) — more options coming soon</p>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-medium text-gray-300">About</h3>
        <div className="text-xs text-gray-500 space-y-1">
          <p>ClawPilot v0.1.0</p>
          <p>Electron {window.clawpilot.versions.electron}</p>
          <p>Node {window.clawpilot.versions.node}</p>
          <p>Platform: {window.clawpilot.platform}</p>
        </div>
      </section>
    </div>
  );
};
