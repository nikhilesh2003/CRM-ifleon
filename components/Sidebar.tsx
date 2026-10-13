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
  Shield,
  Briefcase,
  UserCheck,
  ChevronRight,
  Sparkles,
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

  const [leadCount, setLeadCount] = React.useState<number | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = React.useState<number | null>(null);
  const [taskDueCount, setTaskDueCount] = React.useState<number | null>(null);

  React.useEffect(() => {
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
          title: 'Dashboard Overview',
          href: '/',
          icon: LayoutDashboard,
          roles: ['admin', 'manager', 'consultant'],
        },
        {
          title: 'Lead Pipeline',
          href: '/leads',
          icon: Users,
          badge: leadCount !== null ? `${leadCount}` : 'Active',
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
          title: 'Manager Review Inbox',
          href: '/review-inbox',
          icon: FileCheck2,
          badge: pendingReviewCount !== null && pendingReviewCount > 0 ? `${pendingReviewCount} pending` : 'Approvals',
          badgeColor:
            pendingReviewCount && pendingReviewCount > 0
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          roles: ['admin', 'manager'],
        },
        {
          title: 'Tasks & Due Today',
          href: '/tasks',
          icon: CalendarCheck,
          badge: taskDueCount !== null && taskDueCount > 0 ? `${taskDueCount} due` : undefined,
          badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30',
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
          badge: 'PPTX/PDF',
          roles: ['admin', 'manager', 'consultant'],
        },
      ],
    },
    {
      title: 'Business Intelligence',
      items: [
        {
          title: 'Analytics & Reports',
          href: '/analytics',
          icon: BarChart3,
          roles: ['admin', 'manager', 'consultant'],
        },
        {
          title: 'Activity & Audit Trail',
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
          title: 'CRM & AI Settings',
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
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F17] flex flex-col justify-between hidden md:flex h-[calc(100vh-4rem)] sticky top-16">
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Workspace Mode Card */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <RoleIcon className="w-3.5 h-3.5 text-blue-500" />
              <span className="capitalize">{role} Workspace</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
              Online
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
            {role === 'admin' && 'System configuration, master lists, user administration.'}
            {role === 'manager' && 'Deal approvals, campaign oversight, consultant review.'}
            {role === 'consultant' && 'Lead management, meeting notes timeline, quotation drafting.'}
          </p>
        </div>

        {/* Grouped Navigation Sections */}
        <div className="space-y-5">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="space-y-1">
                <span className="px-3 text-[10px] font-mono uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-1">
                  {section.title}
                </span>

                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
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
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span>iFleon CRM v1.0</span>
          <span>Enterprise</span>
        </div>
      </div>
    </aside>
  );
}
