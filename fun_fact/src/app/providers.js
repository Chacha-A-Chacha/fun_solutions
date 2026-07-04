// file: src/app/providers.js
// Central providers component for the application

'use client';

import { AuthProvider } from './hooks/useAuth';
import { SessionDataProvider } from './hooks/useSessionData';
import { Toaster } from 'react-hot-toast';
import InstallPrompt from '@/components/InstallPrompt';
import OfflineBanner from '@/components/OfflineBanner';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <SessionDataProvider>
        <OfflineBanner />
        <InstallPrompt />
        <ServiceWorkerRegistrar />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            success: {
              style: {
                background: '#f0fdf4',
                color: '#166534',
                border: '1px solid #bbf7d0'
              },
            },
            error: {
              style: {
                background: '#fef2f2',
                color: '#b91c1c',
                border: '1px solid #fecaca'
              },
              duration: 4000,
            },
          }} 
        />
        {children}
      </SessionDataProvider>
    </AuthProvider>
  );
}
