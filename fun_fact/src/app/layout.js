// file: src/app/layout.js
// description: This file defines the root layout for the application, including global styles and authentication context.

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './hooks/useAuth';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Student Session Scheduler',
  description: 'Book your practical sessions easily',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
