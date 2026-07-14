// src/lib/hooks/useRealtimeSync.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import { Task } from '@/types';

export interface SyncState {
  clients: number;
  syncStatus: 'connected' | 'disconnected' | 'connecting';
  lastSync: Date | null;
}

export const useRealtimeSync = (
  tasks: Task[],
  onTaskUpdate: (task: Task) => void
) => {
  const [syncState, setSyncState] = useState<SyncState>({
    clients: 0,
    syncStatus: 'disconnected',
    lastSync: null
  });
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    setSyncState(s => ({ ...s, syncStatus: 'connecting' }));

    const ws = new WebSocket(`wss://${window.location.host}/api/elephant/sync`);
    wsRef.current = ws;

    ws.onopen = () => {
      setSyncState(s => ({ ...s, syncStatus: 'connected' }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'TASK_UPDATE':
          onTaskUpdate(data.payload);
          break;
        case 'CLIENT_CONNECT':
          setSyncState(s => ({ ...s, clients: data.count }));
          break;
      }

      setSyncState(s => ({ ...s, lastSync: new Date() }));
    };

    ws.onerror = () => {
      setSyncState(s => ({ ...s, syncStatus: 'disconnected' }));
    };

    ws.onclose = () => {
      setSyncState(s => ({ ...s, syncStatus: 'disconnected' }));
    };
  }, [onTaskUpdate]);

  const sendUpdate = useCallback((task: Task) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'TASK_UPDATE',
        payload: task
      }));
    }
  }, []);

  // Auto-reconnect logic
  useEffect(() => {
    connect();
    const reconnectInterval = setInterval(() => {
      if (syncState.syncStatus === 'disconnected') {
        connect();
      }
    }, 5000); // Try reconnect every 5 seconds

    return () => {
      if (wsRef.current) wsRef.current.close();
      clearInterval(reconnectInterval);
    };
  }, [connect]);

  // Listen for local task changes to broadcast
  useEffect(() => {
    // This would be triggered by local task updates
    // Implementation would depend on how task updates are handled
  }, [tasks]);

  return {
    syncState,
    sendUpdate,
    connect,
  };
};