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
  PhoneCall,
  DollarSign,
  ChevronRight,
  FileCheck2,
  User,
  MapPin,
  Briefcase,
  Layers,
  MessageSquare,
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser } = useCRM();
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

  if (!currentUser) return null;

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
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Executive Header Bar */}
      <div className="crm-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
              {currentUser.role} Workspace
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {currentUser.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin && 'Enterprise administration, AI provider routing, and global pipeline metrics.'}
            {isManager && `Management cockpit: ${awaitingReviewLeads.length} reviews and ${pendingQuotations.length} quotes requiring authorization.`}
            {isConsultant && `Consultant pipeline: ${dueTodayFollowUps.length} dealership follow-ups scheduled for today.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/leads?action=new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </Link>
          <Link
            href="/quotations/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition border border-slate-200 dark:border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1 */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isConsultant ? 'My Active Leads' : 'Total Opportunities'}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {totalLeadsCount}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">leads</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-600 font-bold">{wonCount} won</span>
            <span>in current pipeline</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Closed Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{totalWonRevenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            <span>Win rate: <strong>{winRate}%</strong></span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Follow-ups Due Today</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {dueTodayFollowUps.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">scheduled</span>
          </div>
          <div className="mt-2 text-[11px]">
            {overdueFollowUps.length > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {overdueFollowUps.length} overdue call(s)
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> All calls up to date
              </span>
            )}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="crm-card p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>{isManager ? 'Awaiting Review' : 'MoM Sessions Held'}</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {isManager ? awaitingReviewLeads.length : userMeetings.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">records</span>
          </div>
          <div className="mt-2 text-[11px]">
            <Link
              href={isManager ? '/review-inbox' : '/leads'}
              className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
            >
              <span>{isManager ? 'Open Review Inbox' : 'Browse Meeting Minutes'}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Operational Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: High-Priority Action Radar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="crm-card">
            <div className="crm-card-header flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Scheduled Follow-ups Due Today ({todayStr})</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dealerships and clients requiring contact today
                </p>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>View all tasks</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4">
              {dueTodayFollowUps.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No pending follow-ups for today
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    All scheduled calls and touchpoints are up to date.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dueTodayFollowUps.map((lead) => (
                    <div
                      key={lead.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition"
                          >
                            {lead.businessName}
                          </Link>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {lead.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {lead.contactPerson}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {lead.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {lead.consultantName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${lead.phone}`}
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 transition"
                          title="Call"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-green-600 hover:bg-green-500 text-white font-medium text-xs flex items-center gap-1 transition"
                          title="WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        <Link
                          href={`/leads/${lead.id}`}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition font-medium text-xs"
                        >
                          Open Record
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Overdue Alerts if any */}
          {overdueFollowUps.length > 0 && (
            <div className="crm-card border-rose-200 dark:border-rose-900/60 p-4 bg-rose-50/40 dark:bg-rose-950/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Overdue Client Follow-ups ({overdueFollowUps.length})</span>
                </div>
                <Link href="/tasks" className="text-[11px] font-semibold text-rose-700 hover:underline">
                  Take action →
                </Link>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                These dealerships have past follow-up dates and require immediate contact.
              </p>
            </div>
          )}
        </div>

        {/* Right Col: Pipeline Stage Distribution (SuiteCRM Funnel) */}
        <div className="space-y-4">
          <div className="crm-card">
            <div className="crm-card-header">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Sales Pipeline Stages</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Distribution across lifecycle stages
              </p>
            </div>

            <div className="p-4 space-y-3">
              {[
                { stage: 'New / Contacted', count: userLeads.filter((l) => l.status === 'New / Contacted').length, color: 'bg-blue-600' },
                { stage: 'Interested / Follow-up', count: userLeads.filter((l) => l.status === 'Interested / Follow-up').length, color: 'bg-indigo-600' },
                { stage: 'Proposal sent / Negotiation', count: userLeads.filter((l) => l.status === 'Proposal sent / Negotiation').length, color: 'bg-amber-600' },
                { stage: 'Won', count: userLeads.filter((l) => l.status === 'Won').length, color: 'bg-emerald-600' },
                { stage: 'Lost', count: userLeads.filter((l) => l.status === 'Lost').length, color: 'bg-rose-600' },
              ].map((item) => {
                const percent = totalLeadsCount > 0 ? Math.round((item.count / totalLeadsCount) * 100) : 0;
                return (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.stage}
                      </span>
                      <span className="font-mono text-slate-500 font-semibold">
                        {item.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color}`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                href="/leads"
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center justify-center gap-1"
              >
                <span>Open Full Lead Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="crm-card p-4 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Quick Resources
            </h3>
            <div className="space-y-1.5 text-xs">
              <Link
                href="/quotations"
                className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Quotations & Proposals Log
                </span>
                <span className="font-mono text-slate-400 text-[11px]">{documents.length}</span>
              </Link>
              <Link
                href="/projects"
                className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Marketing Campaigns
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
              <Link
                href="/analytics"
                className="flex items-center justify-between p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Sales Analytics & Reports
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
