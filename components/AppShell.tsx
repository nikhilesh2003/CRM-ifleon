'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import RoleTutorialModal from '@/components/RoleTutorialModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex flex-col justify-center items-center p-4">
          {children}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
      <RoleTutorialModal />
    </AuthGuard>
  );
}
