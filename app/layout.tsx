import './globals.css';
import type { Metadata } from 'next';
import { CRMProvider } from '@/context/CRMContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'iFleon CRM | Intelligent Frameworks',
  description: 'Internal CRM for iFleon: consultants log leads & meetings, managers review & approve, admin manages users & settings.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo-icon.png',
    apple: '/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('ifleon_theme');
                  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'dark' || (!stored && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#F8FAFC] dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white transition-colors duration-150">
        <CRMProvider>
          <AppShell>
            {children}
          </AppShell>
        </CRMProvider>
      </body>
    </html>
  );
}
