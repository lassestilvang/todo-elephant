"use client";

import { useEffect, useState } from 'react';

interface PWAInstallEvent {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed' }>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAProvider() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallEvent | null>(null);

  useEffect(() => {
    // Check if already installed via standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (!isInstallable && !isInstalled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isInstallable && (
        <button
          onClick={installApp}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-accent text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all animate-bounce"
        >
          <span className="text-lg">🐘</span>
          <span>Install Todo Elephant</span>
        </button>
      )}

      {isInstalled && (
        <button
          onClick={() => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
              if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((registration) => registration.unregister());
                });
              }
              window.location.reload();
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border text-muted text-xs shadow-lg"
        >
          <span>📱</span>
          <span>App Installed</span>
        </button>
      )}
    </div>
  );
}