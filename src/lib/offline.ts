import { useState, useEffect, useRef, createContext } from 'react';

// Offline context
const OfflineContext = createContext(null);

// Offline status flag
const isOffline = useRef(false).current;

// Sync strategy
const syncQueue = useRef([]).current;

// Connection status
const connectionStatus = useState('unknown').current;

// Sync timer
export function useOffline() {
  // Initialize context
  const context = useRef({ isOffline: false, syncQueue: [] }).current;

  // Detect online/offline state
  useEffect(() => {
    const checkConnection = () => {
      // In real app: navigator.onLine check or fetch to server
      setTimeout(() => {
        context.isOffline = navigator.onLine ? false : true;
        if (context.isOffline) {
          startBackgroundSync();
        }
      }, 5000);
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Process sync queue in background
  useEffect(() => {
    const processQueue = async () => {
      if (!context.isOffline || syncQueue.length === 0) return;

      const task = syncQueue.shift();
      try {
        // Execute offline operations
        await task();
        connectionStatus = 'synced';
      } catch (error) {
        connectionStatus = 'error';
      }
    };

    // Run every 30 seconds when offline
    if (context.isOffline) {
      setInterval(processQueue, 30000);
    }

    return () => {
      clearInterval(processQueue);
    };
  }, [content.isOffline, syncQueue]);

  // Public API
  return {
    isOffline: context.isOffline,
    addToQueue: (fn) => syncQueue.push(fn),
    getStatus: () => connectionStatus
  };
}