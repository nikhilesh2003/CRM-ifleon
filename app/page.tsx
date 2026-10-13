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

  // Filter based on user role
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

  const dueTodayFollowUps = userLeads.filter((l) => l.followUpDate === todayStr && l.status !== 'Won' && l.status !== 'Lost');
  const overdueFollowUps = userLeads.filter((l) => l.followUpDate < todayStr && l.status !== 'Won' && l.status !== 'Lost');
  const awaitingReviewLeads = leads.filter((l) => l.managerReview === 'Pending' && (l.status === 'Won' || l.status === 'Lost'));
  const pendingQuotations = documents.filter((d) => d.status === 'Needs Approval');

  const winRate = totalLeadsCount > 0 ? Math.round((wonCount / totalLeadsCount) * 100) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/30">
                {currentUser.role} Workspace
              </span>
              <span className="text-xs text-blue-200/80">• iFleon Internal Sales CRM</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {currentUser.name}!
            </h1>
            <p className="mt-1 text-sm sm:text-base text-blue-100/90 max-w-2xl">
              {isAdmin && 'System health is optimal. Track company conversion metrics, AI usage, and manage users.'}
              {isManager && `You have ${awaitingReviewLeads.length} lead reviews and ${pendingQuotations.length} high-value quotations awaiting your sign-off.`}
              {isConsultant && `You have ${dueTodayFollowUps.length} follow-up calls scheduled today. Keep pushing pipeline velocity!`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/leads?action=new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log New Lead</span>
            </Link>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Generate Quote / PPTX</span>
            </Link>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isConsultant ? 'My Active Pipeline' : 'Total Pipeline Leads'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {totalLeadsCount}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              contacts
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{wonCount} won</span>
            <span>across campaigns</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Won Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(totalWonRevenue / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              closed deals
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Win rate: <strong className="text-slate-700 dark:text-slate-200">{winRate}%</strong></span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Due Today Follow-Ups
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
              {dueTodayFollowUps.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              calls scheduled
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {overdueFollowUps.length > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {overdueFollowUps.length} overdue
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> No overdue leads
              </span>
            )}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isManager ? 'Awaiting Review' : 'Meetings Conducted'}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              {isManager ? <FileCheck2 className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {isManager ? awaitingReviewLeads.length : userMeetings.length}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isManager ? 'leads pending' : 'MoM sessions'}
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Link href={isManager ? '/review-inbox' : '/leads'} className="text-blue-500 hover:underline flex items-center gap-0.5 font-medium">
              <span>View details</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Due Today & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Priority Actions & Due Today Follow-up List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span>Today's Follow-up Agenda</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Leads and tasks scheduled for action today ({todayStr})
                </p>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {dueTodayFollowUps.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  All caught up for today!
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  No pending calls or follow-ups scheduled for today.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {dueTodayFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 rounded-xl px-2 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                        >
                          {lead.businessName}
                        </Link>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                          {lead.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                        <span>👤 {lead.contactPerson}</span>
                        <span>📍 {lead.location}</span>
                        <span>👔 {lead.consultantName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${lead.phone}`}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                        title="Click to call"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                        title="Open WhatsApp chat"
                      >
                        <span>WhatsApp</span>
                      </a>
                      <Link
                        href={`/leads/${lead.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Lead Status Breakdown */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
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
                  className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border-l-4 ${stage.color} hover:bg-slate-100 dark:hover:bg-slate-800 transition`}
                >
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block line-clamp-1">
                    {stage.label}
                  </span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                    {stage.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI & Quick Tools */}
        <div className="space-y-6">
          {/* AI Theme & Capabilities Widget */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 text-white shadow-lg space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Provider-Agnostic AI</h3>
                <p className="text-[11px] text-indigo-300">Groq • OpenRouter • Gemini</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Generate custom branded themes, tidy messy meeting minutes, draft persuasive proposals, and get follow-up message suggestions.
            </p>

            <div className="space-y-2 pt-2">
              <Link
                href="/admin/settings?tab=theme"
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Launch AI Theme Generator</span>
              </Link>
              <Link
                href="/quotations/new"
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-white/10"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>AI Proposal Drafter</span>
              </Link>
            </div>
          </div>

          {/* Manager / Admin Shortcuts */}
          {(isAdmin || isManager) && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Manager Oversight</span>
              </h3>

              <div className="space-y-2 text-xs">
                <Link
                  href="/review-inbox"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Lead Approvals Queue (Won/Lost)
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    {awaitingReviewLeads.length}
                  </span>
                </Link>

                <Link
                  href="/projects"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Active Campaigns & Projects
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>

                <Link
                  href="/audit-log"
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/80 transition"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Activity & Audit Trail
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              </div>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">
              iFleon Pre-Owned Scope
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Includes 9 standard modules: Car inventory, filters, test drive enquiry, EMI calculator, sell/exchange vehicle flow, dealer page, and SEO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
