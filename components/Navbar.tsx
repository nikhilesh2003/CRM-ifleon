'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCRM } from '@/context/CRMContext';
import { Moon, Sun, Bell, Shield, Briefcase, UserCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Navbar() {
  const { currentUser, allUsers, switchUserById, isDark, toggleDarkMode, settings } = useCRM();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-9 flex items-center">
              <img
                src={isDark ? "/logo-dark-horizontal.png" : "/logo-light-horizontal.png"}
                alt="IFLEON Intelligent Frameworks"
                className="h-8 max-w-[200px] object-contain"
              />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hidden sm:inline">
              CRM
            </span>
          </Link>
        </div>

        {/* Center: Interactive Role Switcher Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-inner">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 uppercase tracking-wider">
            Switch Role:
          </span>
          {allUsers.map((u) => {
            const isActive = currentUser.id === u.id;
            let RoleIcon = UserCheck;
            let roleBadge = 'bg-blue-600 text-white';
            if (u.role === 'admin') {
              RoleIcon = Shield;
              roleBadge = 'bg-purple-600 text-white';
            } else if (u.role === 'manager') {
              RoleIcon = Briefcase;
              roleBadge = 'bg-emerald-600 text-white';
            }

            return (
              <button
                key={u.id}
                onClick={() => switchUserById(u.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? `${roleBadge} shadow-sm scale-[1.02]`
                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
                title={`Switch view to ${u.name} (${u.role})`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{u.name.split(' ')[0]}</span>
                <span className="text-[10px] opacity-80 uppercase tracking-wider">({u.role})</span>
              </button>
            );
          })}
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center gap-3">
          {/* Due Today Follow-up Link */}
          <Link
            href="/tasks"
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Follow-ups and Due Today"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Light / Dark mode"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Active User Badge */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
