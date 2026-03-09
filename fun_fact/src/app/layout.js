// file: src/app/layout.js
// description: This file defines the root layout for the application, including global styles and providers.

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'IYF We Can Academy',
  description: 'Book your practical driving sessions easily',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'IYF Academy',
  },
};

export const viewport = {
  themeColor: '#1e3a8a',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IYF We Can Academy - Session Scheduler',
  description: 'Book your practical driving sessions easily',
  applicationCategory: 'EducationalApplication',
  creator: {
    '@type': 'Organization',
    name: 'Chacha Technologies',
    url: 'https://www.chach-a.com',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}