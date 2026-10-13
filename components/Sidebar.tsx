'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileCheck2,
  FileText,
  CalendarCheck,
  BarChart3,
  History,
  Settings,
  UserCog,
  Sparkles,
  Smartphone,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useCRM();
  const role = currentUser.role;

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'consultant'],
    },
    {
      title: 'Lead Log',
      href: '/leads',
      icon: Users,
      badge: 'Active',
      roles: ['admin', 'manager', 'consultant'],
    },
    {
      title: 'Projects & Campaigns',
      href: '/projects',
      icon: FolderKanban,
      roles: ['admin', 'manager'],
    },
    {
      title: 'Review Inbox',
      href: '/review-inbox',
      icon: FileCheck2,
      badge: 'Approvals',
      badgeColor: 'bg-amber-500 text-white',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Quotations & Proposals',
      href: '/quotations',
      icon: FileText,
      roles: ['admin', 'manager', 'consultant'],
    },
    {
      title: 'Tasks & Due Today',
      href: '/tasks',
      icon: CalendarCheck,
      roles: ['admin', 'manager', 'consultant'],
    },
    {
      title: 'Analytics & Reports',
      href: '/analytics',
      icon: BarChart3,
      roles: ['admin', 'manager', 'consultant'],
    },
    {
      title: 'Activity & Audit Log',
      href: '/audit-log',
      icon: History,
      roles: ['admin', 'manager'],
    },
    {
      title: 'User Management',
      href: '/admin/users',
      icon: UserCog,
      roles: ['admin'],
    },
    {
      title: 'CRM & AI Settings',
      href: '/admin/settings',
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between hidden md:flex h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Role Notice Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Mode
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                role === 'admin'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                  : role === 'manager'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
              }`}
            >
              {role}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
            {role === 'admin' && 'Full system control, users, AI themes and price lists.'}
            {role === 'manager' && 'Project oversight, lead approvals and consultant reviews.'}
            {role === 'consultant' && 'Manage your own leads, timeline meetings and quotations.'}
          </p>
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom PWA & Tech Badge */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2">
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span>PWA Ready</span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
