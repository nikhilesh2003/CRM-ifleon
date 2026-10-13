'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Briefcase,
  UserCheck,
  Search,
  Plus,
  FileText,
  Users,
  Calendar,
  CheckCircle2,
  ChevronDown,
  X,
  Command,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Lead } from '@/lib/types';

export default function Navbar() {
  const router = useRouter();
  const { currentUser, allUsers, switchUserById, isDark, toggleDarkMode, settings } = useCRM();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  // Listen for Ctrl+K or Cmd+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsQuickCreateOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch leads for quick command palette search
  React.useEffect(() => {
    if (isCommandPaletteOpen && allLeads.length === 0) {
      fetch('/api/leads')
        .then((r) => r.json())
        .then((data) => {
          if (data.leads) setAllLeads(data.leads);
        })
        .catch(console.error);
    }
  }, [isCommandPaletteOpen, allLeads.length]);

  // Filter search results dynamically
  React.useEffect(() => {
    if (!globalSearch.trim()) {
      setSearchResults([]);
    } else {
      const q = globalSearch.toLowerCase();
      const filtered = allLeads.filter(
        (l) =>
          l.businessName.toLowerCase().includes(q) ||
          l.contactPerson.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.location.toLowerCase().includes(q)
      );
      setSearchResults(filtered.slice(0, 5));
    }
  }, [globalSearch, allLeads]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      setIsCommandPaletteOpen(false);
      router.push(`/leads?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-8 flex items-center">
              <img
                src={isDark ? '/logo-dark-horizontal.png' : '/logo-light-horizontal.png'}
                alt="IFLEON Intelligent Frameworks"
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase hidden lg:inline">
              Enterprise CRM
            </span>
          </Link>
        </div>

        {/* Center: SuiteCRM-style Global Quick Search with Ctrl+K shortcut */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex flex-1 max-w-md mx-4 cursor-pointer"
        >
          <div className="relative w-full flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
            <div className="w-full pl-9 pr-16 py-1.5 text-xs rounded-xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition flex items-center justify-between">
              <span>Quick search leads, quotes, actions...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold shadow-xs">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>

        {/* Center-Right: Executive Role Switcher */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-2">
            Role:
          </span>
          {allUsers.map((u) => {
            const isActive = currentUser.id === u.id;
            let RoleIcon = UserCheck;
            if (u.role === 'admin') RoleIcon = Shield;
            else if (u.role === 'manager') RoleIcon = Briefcase;

            return (
              <button
                key={u.id}
                onClick={() => switchUserById(u.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
                title={`Switch role to ${u.name} (${u.role})`}
              >
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{u.name.split(' ')[0]}</span>
                <span className={`text-[9px] uppercase font-mono ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                  ({u.role})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Actions: Quick Create + Notifications + Dark Mode + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Quick Create Dropdown (SuiteCRM style) */}
          <div className="relative">
            <button
              onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Create</span>
              <ChevronDown className="w-3 h-3 opacity-80" />
            </button>

            {isQuickCreateOpen && (
              <div
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1 z-50 text-xs"
                onClick={() => setIsQuickCreateOpen(false)}
              >
                <Link
                  href="/leads?action=new"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                >
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span>New Dealership Lead</span>
                </Link>
                <Link
                  href="/quotations/new"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                >
                  <FileText className="w-3.5 h-3.5 text-orange-500" />
                  <span>New Quotation / PPTX</span>
                </Link>
                <Link
                  href="/tasks"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <span>New Action Task</span>
                </Link>
              </div>
            )}
          </div>

          {/* Follow-up Alerts Popover */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Notifications and Due Today"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            </button>

            {isNotificationsOpen && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 text-xs space-y-3"
                onClick={() => setIsNotificationsOpen(false)}
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>Follow-ups & Alerts</span>
                  </span>
                  <Link href="/tasks" className="text-[11px] text-blue-500 hover:underline">
                    View All
                  </Link>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Client calls scheduled for today
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Review your scheduled follow-ups in the tasks workspace.
                    </p>
                  </div>
                  {currentUser.role !== 'consultant' && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                      <p className="font-semibold">Manager Review Pending</p>
                      <p className="text-[11px] mt-0.5 opacity-90">
                        Check approvals for Won/Lost leads and high-value quotations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-xs font-mono">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div className="hidden xl:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono uppercase">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>

      {/* Global Command Palette Modal (Ctrl+K) */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative border-b border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Type to search dealership leads, phone, or run action..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-11 pr-12 py-3 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(false)}
                className="absolute right-3.5 top-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            {/* Results or Quick Actions */}
            <div className="p-3 max-h-96 overflow-y-auto space-y-3 text-xs">
              {searchResults.length > 0 ? (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Matching Dealership Leads ({searchResults.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition">
                            {lead.businessName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {lead.contactPerson} • {lead.location} • {lead.phone}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          {lead.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : globalSearch.trim() ? (
                <div className="p-6 text-center text-slate-400">
                  <p>No direct matches found for "{globalSearch}".</p>
                  <button
                    onClick={handleSearchSubmit}
                    className="mt-2 text-blue-500 font-semibold hover:underline"
                  >
                    Search across full database →
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Quick CRM Actions
                    </div>
                    <div className="space-y-1 mt-1">
                      <Link
                        href="/leads?action=new"
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                          <Users className="w-4 h-4 text-blue-500" />
                          <span className="font-medium">Add New Dealership Lead</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <Link
                        href="/quotations/new"
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                          <FileText className="w-4 h-4 text-orange-500" />
                          <span className="font-medium">Generate PowerPoint Quotation (16:9)</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <Link
                        href="/tasks"
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">View Scheduled Client Follow-ups</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      {currentUser.role !== 'consultant' && (
                        <Link
                          href="/review-inbox"
                          onClick={() => setIsCommandPaletteOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span className="font-medium">Open Manager Approval Inbox</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        </Link>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Switch Role Mode
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {allUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            switchUserById(u.id);
                            setIsCommandPaletteOpen(false);
                          }}
                          className={`p-2 rounded-xl text-left border transition ${
                            currentUser.id === u.id
                              ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="font-semibold">{u.name.split(' ')[0]}</div>
                          <div className="text-[10px] uppercase font-mono text-slate-400">
                            {u.role}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Press ESC to exit</span>
              <span>iFleon Quick Navigation</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
