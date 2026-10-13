'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isLoadingAuth, isDark, settings } = useCRM();

  const isPublicRoute = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    if (isLoadingAuth) return;

    if (!currentUser && !isPublicRoute) {
      // Unauthenticated user trying to access protected route
      router.push('/login');
    } else if (currentUser && isPublicRoute) {
      // Authenticated user trying to access login/register
      router.push('/');
    }
  }, [currentUser, isLoadingAuth, isPublicRoute, router]);

  // If loading auth state, show branded loading splash
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 flex items-center">
            <img
              src={
                isDark
                  ? settings?.darkLogoUrl || '/logo-dark-horizontal.png'
                  : settings?.lightLogoUrl || settings?.horizontalLogoUrl || '/logo-light-horizontal.png'
              }
              alt={settings?.name || 'iFleon Intelligent Frameworks'}
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Verifying enterprise credentials...</span>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated and trying to view protected route, show redirect screen
  if (!currentUser && !isPublicRoute) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono text-slate-500">Redirecting to enterprise sign in...</p>
        </div>
      </div>
    );
  }

  // If authenticated and trying to view login/register, show redirect screen
  if (currentUser && isPublicRoute) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-mono text-slate-500">Redirecting to workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
