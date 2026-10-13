'use client';

import React, { useState, useEffect } from 'react';
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
  Shield,
  Briefcase,
  UserCheck,
} from 'lucide-react';

interface NavSection {
  title: string;
  items: Array<{
    title: string;
    href: string;
    icon: any;
    badge?: string;
    badgeColor?: string;
    roles: Array<'admin' | 'manager' | 'consultant'>;
  }>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useCRM();
  const role = currentUser.role;

  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState<number | null>(null);
  const [taskDueCount, setTaskDueCount] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then((r) => r.json()).catch(() => ({})),
      fetch('/api/tasks').then((r) => r.json()).catch(() => ({})),
      fetch('/api/quotations').then((r) => r.json()).catch(() => ({})),
    ]).then(([leadsData, tasksData, quotesData]) => {
      if (leadsData.leads) {
        setLeadCount(leadsData.leads.length);
        const pendingLeads = leadsData.leads.filter(
          (l: any) => l.managerReview === 'Pending' && (l.status === 'Won' || l.status === 'Lost')
        ).length;
        const pendingQuotes = quotesData?.documents?.filter(
          (q: any) => q.status === 'Needs Approval'
        ).length || 0;
        setPendingReviewCount(pendingLeads + pendingQuotes);
      }
      if (tasksData.tasks) {
        const todayStr = new Date().toISOString().slice(0, 10);
        const due = tasksData.tasks.filter((t: any) => !t.completed && t.dueDate <= todayStr).length;
        setTaskDueCount(due);
      }
    });
  }, []);

  const navSections: NavSection[] = [
    {
      title: 'Sales & Pipeline',
      items: [
        {
          title: 'Dashboard',
          href: '/',
          icon: LayoutDashboard,
          roles: ['admin', 'manager', 'consultant'],
        },
        {
          title: 'Lead Pipeline',
          href: '/leads',
          icon: Users,
          badge: leadCount !== null ? `${leadCount}` : undefined,
          roles: ['admin', 'manager', 'consultant'],
        },
        {
          title: 'Campaign Projects',
          href: '/projects',
          icon: FolderKanban,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Activities & Review',
      items: [
        {
          title: 'Review Inbox',
          href: '/review-inbox',
          icon: FileCheck2,
          badge: pendingReviewCount !== null && pendingReviewCount > 0 ? `${pendingReviewCount}` : undefined,
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 font-bold',
          roles: ['admin', 'manager'],
        },
        {
          title: 'Tasks & Due Today',
          href: '/tasks',
          icon: CalendarCheck,
          badge: taskDueCount !== null && taskDueCount > 0 ? `${taskDueCount}` : undefined,
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 font-bold',
          roles: ['admin', 'manager', 'consultant'],
        },
      ],
    },
    {
      title: 'Commercial Assets',
      items: [
        {
          title: 'Quotations & Proposals',
          href: '/quotations',
          icon: FileText,
          roles: ['admin', 'manager', 'consultant'],
        },
      ],
    },
    {
      title: 'Analytics & Compliance',
      items: [
        {
          title: 'Reports & Analytics',
          href: '/analytics',
          icon: BarChart3,
          roles: ['admin', 'manager', 'consultant'],
        },
        {
          title: 'Audit Trail',
          href: '/audit-log',
          icon: History,
          roles: ['admin', 'manager'],
        },
      ],
    },
    {
      title: 'Administration',
      items: [
        {
          title: 'User Access Control',
          href: '/admin/users',
          icon: UserCog,
          roles: ['admin'],
        },
        {
          title: 'System Settings',
          href: '/admin/settings',
          icon: Settings,
          roles: ['admin'],
        },
      ],
    },
  ];

  let RoleIcon = UserCheck;
  if (role === 'admin') RoleIcon = Shield;
  else if (role === 'manager') RoleIcon = Briefcase;

  return (
    <aside className="w-60 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111622] flex flex-col justify-between hidden md:flex h-[calc(100vh-3.5rem)] sticky top-14">
      <div className="p-3 space-y-5 overflow-y-auto">
        {/* Workspace Mode Badge */}
        <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <RoleIcon className="w-3.5 h-3.5 text-blue-600" />
              <span className="capitalize">{role} Mode</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {role === 'admin' && 'Full system administration'}
            {role === 'manager' && 'Deal approvals & oversight'}
            {role === 'consultant' && 'Deal pipeline & meetings'}
          </p>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-4">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-0.5">
                <span className="px-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 block mb-1">
                  {section.title}
                </span>

                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-600'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                            isActive
                              ? 'bg-blue-200/60 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200'
                              : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between">
        <span>iFleon CRM</span>
        <span>v2.0</span>
      </div>
    </aside>
  );
}
