import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';

import './globals.css';
import { Toast } from '@/components/shared/Toast';
import { ClientProviders } from '@/components/shared/ClientProviders';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Azimuth | AI Travel Planner',
  description: 'A calm, AI-powered travel planner that builds realistic day-by-day itineraries in seconds.',
  icons: {
    icon: '/assets/Azimuth_Logo.png',
    shortcut: '/assets/Azimuth_Logo.png',
    apple: '/assets/Azimuth_Logo.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClientProviders>
          {children}
        </ClientProviders>
        <Toast />
      </body>
    </html>
  );
}
