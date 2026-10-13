import './globals.css';
import type { Metadata } from 'next';
import { CRMProvider } from '@/context/CRMContext';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'iFleon CRM | Intelligent Frameworks',
  description: 'Internal CRM for iFleon: consultants log leads & meetings, managers review & approve, admin manages users & settings.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-icon.svg',
    apple: '/logo-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        <CRMProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </CRMProvider>
      </body>
    </html>
  );
}
