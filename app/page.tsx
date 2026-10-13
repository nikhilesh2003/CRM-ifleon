'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCRM } from '@/context/CRMContext';
import { Lead, MeetingNote, TaskItem, GeneratedDocument } from '@/lib/types';
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileText,
  Calendar,
  Sparkles,
  PhoneCall,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Building2,
  FileCheck2,
  User,
  MapPin,
  Briefcase,
  Layers,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, settings } = useCRM();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resLeads, resTasks, resMeetings, resDocs] = await Promise.all([
          fetch('/api/leads').then((r) => r.json()),
          fetch('/api/tasks').then((r) => r.json()),
          fetch('/api/meetings').then((r) => r.json()),
          fetch('/api/quotations').then((r) => r.json()),
        ]);

        if (resLeads.leads) setLeads(resLeads.leads);
        if (resTasks.tasks) setTasks(resTasks.tasks);
        if (resMeetings.meetings) setMeetings(resMeetings.meetings);
        if (resDocs.documents) setDocuments(resDocs.documents);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const isConsultant = currentUser.role === 'consultant';
  const isManager = currentUser.role === 'manager';
  const isAdmin = currentUser.role === 'admin';

  const userLeads = isConsultant ? leads.filter((l) => l.consultantId === currentUser.id) : leads;
  const userTasks = isConsultant ? tasks.filter((t) => t.consultantId === currentUser.id) : tasks;
  const userMeetings = isConsultant ? meetings.filter((m) => m.addedById === currentUser.id) : meetings;

  // Key KPI metrics
  const totalLeadsCount = userLeads.length;
  const wonLeads = userLeads.filter((l) => l.status === 'Won');
  const wonCount = wonLeads.length;
  const totalWonRevenue = wonLeads.reduce((sum, l) => sum + (l.finalDealAmount || 0), 0);

  const dueTodayFollowUps = userLeads.filter(
    (l) => l.followUpDate === todayStr && l.status !== 'Won' && l.status !== 'Lost'
  );
  const overdueFollowUps = userLeads.filter(
    (l) => l.followUpDate < todayStr && l.status !== 'Won' && l.status !== 'Lost'
  );
  const awaitingReviewLeads = leads.filter(
    (l) => l.managerReview === 'Pending' && (l.status === 'Won' || l.status === 'Lost')
  );
  const pendingQuotations = documents.filter((d) => d.status === 'Needs Approval');

  const winRate = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Executive Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 uppercase">
              {currentUser.role}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin && 'System administration, AI provider fallback metrics, and global sales overview.'}
            {isManager && `Oversight: ${awaitingReviewLeads.length} lead reviews and ${pendingQuotations.length} high-value quotations requiring manager authorization.`}
            {isConsultant && `Pipeline: ${dueTodayFollowUps.length} client follow-up calls scheduled for today.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/leads?action=new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log New Lead</span>
          </Link>
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs transition border border-slate-200/60 dark:border-slate-700/60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Quotation / PPTX</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isConsultant ? 'My Pipeline Leads' : 'Total Opportunities'}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalLeadsCount}
            </span>
            <span className="text-xs text-slate-400">records</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <span className="text-emerald-500 font-semibold">{wonCount} won</span>
            <span>across active projects</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Closed Deal Revenue
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹{(totalWonRevenue / 1000).toFixed(0)}k
            </span>
            <span className="text-xs text-slate-400">total closed</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Win rate: <strong className="text-slate-700 dark:text-slate-300">{winRate}%</strong></span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Follow-ups Due Today
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-500">
              {dueTodayFollowUps.length}
            </span>
            <span className="text-xs text-slate-400">actions</span>
          </div>
          <div className="mt-2 text-xs">
            {overdueFollowUps.length > 0 ? (
              <span className="text-rose-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {overdueFollowUps.length} overdue follow-up(s)
              </span>
            ) : (
              <span className="text-emerald-500 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> No overdue items
              </span>
            )}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isManager ? 'Awaiting Review' : 'Meetings Held'}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-500">
              {isManager ? <FileCheck2 className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {isManager ? awaitingReviewLeads.length : userMeetings.length}
            </span>
            <span className="text-xs text-slate-400">
              {isManager ? 'pending' : 'MoM sessions'}
            </span>
          </div>
          <div className="mt-2 text-xs">
            <Link
              href={isManager ? '/review-inbox' : '/leads'}
              className="text-blue-500 hover:underline flex items-center gap-1 font-medium"
            >
              <span>{isManager ? 'Go to Review Inbox' : 'View Meetings Log'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Due Today & Stage Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Priority Due Today List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Scheduled Follow-ups Due Today</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dealerships and clients requiring contact on {todayStr}
                </p>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {dueTodayFollowUps.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  All caught up for today
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No pending calls or follow-ups scheduled for today.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {dueTodayFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 rounded-xl px-2 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-500 transition"
                        >
                          {lead.businessName}
                        </Link>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {lead.contactPerson}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {lead.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {lead.consultantName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition"
                        title="Click to call"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium text-xs flex items-center gap-1 transition"
                        title="Open WhatsApp chat"
                      >
                        <span>WhatsApp</span>
                      </a>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pipeline Stage Distribution */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80 space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Pipeline Stage Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: 'New / Contacted', count: userLeads.filter((l) => l.status === 'New / Contacted').length, color: 'border-blue-500' },
                { label: 'Interested', count: userLeads.filter((l) => l.status === 'Interested / Follow-up').length, color: 'border-indigo-500' },
                { label: 'Proposal Sent', count: userLeads.filter((l) => l.status === 'Proposal sent / Negotiation').length, color: 'border-amber-500' },
                { label: 'Won', count: userLeads.filter((l) => l.status === 'Won').length, color: 'border-emerald-500' },
                { label: 'Lost', count: userLeads.filter((l) => l.status === 'Lost').length, color: 'border-rose-500' },
              ].map((stage) => (
                <Link
                  key={stage.label}
                  href={`/leads?status=${encodeURIComponent(stage.label)}`}
                  className={`p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border-l-4 ${stage.color} border border-slate-200/60 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition`}
                >
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block line-clamp-1">
                    {stage.label}
                  </span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                    {stage.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI & Tools */}
        <div className="space-y-6">
          {/* Provider-Agnostic AI Hub */}
          <div className="p-5 rounded-2xl bg-slate-900 dark:bg-[#0D131F] border border-blue-500/20 text-white space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs">Provider-Agnostic AI Layer</h3>
                <p className="text-[10px] text-slate-400">Groq • OpenRouter • Gemini</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Automated follow-up message generation, meeting minutes tidying, and AI quotation drafting.
            </p>

            <div className="space-y-2 pt-1">
              <Link
                href="/admin/settings?tab=theme"
                className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch AI Theme Generator</span>
              </Link>
              <Link
                href="/quotations/new"
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition border border-white/10"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Draft Proposal with AI</span>
              </Link>
            </div>
          </div>

          {/* Manager & Admin Review Box */}
          {(isAdmin || isManager) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800/80 space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Manager Oversight Queue</span>
              </h3>

              <div className="space-y-2 text-xs">
                <Link
                  href="/review-inbox"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Lead Approvals Queue (Won/Lost)
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    {awaitingReviewLeads.length}
                  </span>
                </Link>

                <Link
                  href="/projects"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Active Campaigns & Projects
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/audit-log"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Activity & Audit Trail
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          )}

          {/* Standard Scope Info */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">
              Pre-Owned Car Dealer Scope
            </span>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
              9 standard modules pre-configured for vehicle inventory catalogs, dynamic EMI financing, direct WhatsApp buyer routing, and SEO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
