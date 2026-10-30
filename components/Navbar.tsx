'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  X,
  ArrowRight,
  Clock,
  LogOut,
  HelpCircle,
  Settings,
  User as UserIcon,
  Menu,
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  CalendarCheck,
  BarChart3,
  History,
  UserCog,
} from 'lucide-react';
import { Lead } from '@/lib/types';

export default function Navbar() {
  const router = useRouter();
  const { currentUser, isDark, toggleDarkMode, logout, openTutorial, settings } = useCRM();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsQuickCreateOpen(false);
        setIsNotificationsOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch leads for quick command palette search
  useEffect(() => {
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
  useEffect(() => {
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

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    router.push('/login');
  };

  const handleTriggerTutorial = () => {
    setIsProfileMenuOpen(false);
    openTutorial();
  };

  if (!currentUser) return null;

  const role = currentUser.role || 'consultant';
  let RoleIcon = UserCheck;
  if (role === 'admin') RoleIcon = Shield;
  else if (role === 'manager') RoleIcon = Briefcase;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-[#1E2A3E] bg-white dark:bg-[#111925] shadow-xs">
        <div className="flex h-15 items-center justify-between px-4 sm:px-6 gap-4">
          {/* Left: Brand Identity & Mobile Hamburger */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] transition"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 flex items-center">
                <img
                  src={
                    isDark
                      ? settings?.darkLogoUrl || '/logo-dark-horizontal.png'
                      : settings?.lightLogoUrl || settings?.horizontalLogoUrl || '/logo-light-horizontal.png'
                  }
                  alt={settings?.name || 'iFleon Intelligent Frameworks'}
                  className="h-8 md:h-9 w-auto object-contain"
                />
              </div>
              <span className="text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-[#172132] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1E2A3E] uppercase hidden sm:inline">
                CRM
              </span>
            </Link>
          </div>

          {/* Center: SuiteCRM Quick Search */}
          <div
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden md:flex flex-1 max-w-md mx-2 cursor-pointer"
          >
            <div className="relative w-full flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400" />
              <div className="w-full pl-9 pr-14 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 transition flex items-center justify-between">
                <span>Search leads, accounts, phones...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#111925] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#1E2A3E] font-semibold shadow-xs">
                  Ctrl K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Actions: Quick Create + Notifications + Dark Mode + Profile Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Quick Create Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                className="px-3 py-1.5 rounded-md bg-[#0B5CAB] hover:bg-[#094D92] text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Create</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>

              {isQuickCreateOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-lg p-1 z-50 text-xs"
                  onClick={() => setIsQuickCreateOpen(false)}
                >
                  <Link
                    href="/leads?action=new"
                    className="flex items-center gap-2 px-3 py-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>New Dealership Lead</span>
                  </Link>
                  <Link
                    href="/quotations/new"
                    className="flex items-center gap-2 px-3 py-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>New Quotation / Proposal</span>
                  </Link>
                  <Link
                    href="/tasks"
                    className="flex items-center gap-2 px-3 py-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>New Follow-up Task</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-76 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-lg p-3 z-50 text-xs space-y-2.5"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>Alerts & Due Today</span>
                    </span>
                    <Link href="/tasks" className="text-[11px] text-blue-600 hover:underline">
                      View all
                    </Link>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-xs">
                        Client calls scheduled for today
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Check scheduled follow-ups in the tasks view.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Interactive User Profile Menu */}
            <div className="relative pl-2 border-l border-slate-200 dark:border-[#1E2A3E]" ref={profileMenuRef}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#172132] transition text-left"
                aria-haspopup="true"
                aria-expanded={isProfileMenuOpen}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs font-mono">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xl:block" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111925] rounded-lg border border-slate-200 dark:border-[#1E2A3E] shadow-xl p-2 z-50 text-xs">
                  {/* User Profile Header */}
                  <div className="p-2.5 border-b border-slate-100 dark:border-[#1E2A3E] pb-3 mb-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs font-mono">
                        {currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase font-bold">
                        {currentUser.role}
                      </span>
                      {currentUser.department && (
                        <span className="text-slate-400 truncate max-w-[120px]">
                          {currentUser.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="space-y-0.5 py-1">
                    <button
                      onClick={handleTriggerTutorial}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#172132] font-medium transition text-left"
                    >
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                      <div>
                        <div>Replay Role Tutorial</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Step-by-step guided onboarding
                        </div>
                      </div>
                    </button>

                    {currentUser.role === 'admin' && (
                      <Link
                        href="/admin/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#172132] font-medium transition text-left"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <div>Enterprise Settings</div>
                      </Link>
                    )}
                  </div>

                  {/* Sign Out Action */}
                  <div className="border-t border-slate-100 dark:border-[#1E2A3E] pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette Modal (Ctrl+K) */}
      {isCommandPaletteOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20 px-4"
          onClick={() => setIsCommandPaletteOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative border-b border-slate-200 dark:border-slate-800">
              <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search dealership name, contact, or phone..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 text-xs bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsCommandPaletteOpen(false)}
                className="absolute right-3 top-2.5 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            {/* Results or Quick Actions */}
            <div className="p-3 max-h-80 overflow-y-auto space-y-3 text-xs">
              {searchResults.length > 0 ? (
                <div>
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Matching Leads ({searchResults.length})
                  </div>
                  <div className="space-y-1 mt-1">
                    {searchResults.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/leads/${lead.id}`}
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {lead.businessName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {lead.contactPerson} • {lead.location} • {lead.phone}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          {lead.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : globalSearch.trim() ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  <p>No results found for "{globalSearch}".</p>
                  <button
                    onClick={handleSearchSubmit}
                    className="mt-2 text-blue-600 font-medium hover:underline"
                  >
                    Search across full database →
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Quick Shortcuts
                    </div>
                    <div className="space-y-0.5 mt-1">
                      <Link
                        href="/leads?action=new"
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Users className="w-3.5 h-3.5 text-blue-600" />
                          <span>Add New Dealership Lead</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                      <Link
                        href="/quotations/new"
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <FileText className="w-3.5 h-3.5 text-amber-600" />
                          <span>Generate PowerPoint Quotation (16:9)</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                      <Link
                        href="/tasks"
                        onClick={() => setIsCommandPaletteOpen(false)}
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      >
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          <span>View Scheduled Follow-ups Due</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                      </Link>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Press ESC to close</span>
              <span>iFleon CRM</span>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-white dark:bg-[#111925] border-r border-slate-200 dark:border-[#1E2A3E] flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#1E2A3E]">
                <div className="flex items-center gap-2.5">
                  <img
                    src={
                      isDark
                        ? settings?.darkLogoUrl || '/logo-dark-horizontal.png'
                        : settings?.lightLogoUrl || settings?.horizontalLogoUrl || '/logo-light-horizontal.png'
                    }
                    alt={settings?.name || 'iFleon'}
                    className="h-7 w-auto object-contain"
                  />
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                    CRM
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Close Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Identity Mini Card */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-bold text-xs font-mono">
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-semibold">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-4 text-xs">
                {/* Section 1: Sales & Pipeline */}
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Sales & Pipeline
                  </span>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span>Executive Dashboard</span>
                  </Link>
                  <Link
                    href="/leads"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Lead Pipeline</span>
                  </Link>
                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                    <Link
                      href="/projects"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                    >
                      <FolderKanban className="w-4 h-4 text-blue-600" />
                      <span>Campaign Projects</span>
                    </Link>
                  )}
                </div>

                {/* Section 2: Activities & Review */}
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Activities & Approvals
                  </span>
                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                    <Link
                      href="/review-inbox"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                    >
                      <FileCheck2 className="w-4 h-4 text-amber-600" />
                      <span>Review Inbox</span>
                    </Link>
                  )}
                  <Link
                    href="/tasks"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                  >
                    <CalendarCheck className="w-4 h-4 text-emerald-600" />
                    <span>Tasks & Due Follow-ups</span>
                  </Link>
                </div>

                {/* Section 3: Commercial Assets */}
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Commercial Proposals
                  </span>
                  <Link
                    href="/quotations"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Quotations & Presentations</span>
                  </Link>
                </div>

                {/* Section 4: Analytics */}
                <div className="space-y-1">
                  <span className="px-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
                    Analytics & Compliance
                  </span>
                  <Link
                    href="/analytics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                  >
                    <BarChart3 className="w-4 h-4 text-teal-600" />
                    <span>Reports & Performance</span>
                  </Link>
                  {(currentUser.role === 'admin' || currentUser.role === 'manager') && (
                    <Link
                      href="/audit-log"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                    >
                      <History className="w-4 h-4 text-slate-500" />
                      <span>Audit Trail</span>
                    </Link>
                  )}
                </div>

                {/* Section 5: Administration */}
                {currentUser.role === 'admin' && (
                  <div className="space-y-1">
                    <span className="px-2 text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block mb-1">
                      Administration
                    </span>
                    <Link
                      href="/admin/users"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                    >
                      <UserCog className="w-4 h-4 text-blue-600" />
                      <span>User Access Control</span>
                    </Link>
                    <Link
                      href="/admin/settings"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#172132] font-medium"
                    >
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span>System Settings</span>
                    </Link>
                  </div>
                )}
              </nav>
            </div>

            {/* Drawer Footer with Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-[#1E2A3E] space-y-2 bg-slate-50/50 dark:bg-[#0B0F19]">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openTutorial();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-semibold"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Replay Role Tutorial</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
