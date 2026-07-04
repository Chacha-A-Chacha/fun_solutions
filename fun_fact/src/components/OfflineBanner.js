// file: src/components/OfflineBanner.js
// Shows a top banner when the device goes offline, so students understand why a
// booking/cancel action might not go through. Safe-area aware.

'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white text-xs sm:text-sm text-center py-1.5 pt-[max(0.375rem,env(safe-area-inset-top))] flex items-center justify-center gap-2 px-3">
      <WifiOff className="w-4 h-4 shrink-0" />
      You&apos;re offline — changes will retry when you reconnect
    </div>
  );
}
