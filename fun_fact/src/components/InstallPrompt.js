// file: src/components/InstallPrompt.js
// Lightweight "Add to Home Screen" banner. Shows only when the browser fires
// `beforeinstallprompt` (i.e. the app is installable and not already installed),
// and stays dismissed for the session. Mobile-first, safe-area aware.

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    try {
      deferred.prompt();
      await deferred.userChoice;
    } finally {
      setDeferred(null);
    }
  };

  return (
    <div className="fixed z-50 bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:w-80 rounded-xl border border-gray-200 bg-white shadow-lg p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-gray-900">Install the app</div>
        <div className="text-xs text-gray-500">Add Practicals to your home screen for quick access.</div>
      </div>
      <Button size="sm" onClick={install} className="bg-blue-900 hover:bg-blue-800 shrink-0">
        Install
      </Button>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
        className="text-gray-400 hover:text-gray-600 shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
