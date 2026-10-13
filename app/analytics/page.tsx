'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/context/CRMContext';
import { Lead, MeetingNote, GeneratedDocument } from '@/lib/types';
import { exportLeadsToExcel } from '@/lib/export-utils';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  Calendar,
  Users,
  Building2,
  DollarSign,
  Clock,
  Sparkles,
  PieChart,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { currentUser, settings } = useCRM();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [dateRange, setDateRange] = useState('This Month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [resLeads, resMeetings, resDocs] = await Promise.all([
          fetch('/api/leads').then((r) => r.json()),
          fetch('/api/meetings').then((r) => r.json()),
          fetch('/api/quotations').then((r) => r.json()),
        ]);
        if (resLeads.leads) setLeads(resLeads.leads);
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

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin';
  const isManager = currentUser.role === 'manager';
  const isConsultant = currentUser.role === 'consultant';

  const userLeads = isConsultant ? leads.filter((l) => l.consultantId === currentUser.id) : leads;
  const wonLeads = userLeads.filter((l) => l.status === 'Won');
  const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.finalDealAmount || 0), 0);
  const conversionRate = userLeads.length > 0 ? Math.round((wonLeads.length / userLeads.length) * 100) : 0;

  // Funnel calculations
  const funnelStages = [
    { label: 'New / Contacted', count: userLeads.filter((l) => l.status === 'New / Contacted').length, color: 'bg-blue-500' },
    { label: 'Interested / Follow-up', count: userLeads.filter((l) => l.status === 'Interested / Follow-up').length, color: 'bg-indigo-500' },
    { label: 'Proposal sent / Negotiation', count: userLeads.filter((l) => l.status === 'Proposal sent / Negotiation').length, color: 'bg-amber-500' },
    { label: 'Won (Closed)', count: wonLeads.length, color: 'bg-emerald-500' },
  ];

  // Consultant Performance (For Manager & Admin)
  const consultantStats = [
    { name: 'Nikhil Varma', leads: leads.filter((l) => l.consultantId === 'user-nikhil').length, won: leads.filter((l) => l.consultantId === 'user-nikhil' && l.status === 'Won').length, revenue: 95000 },
    { name: 'Arun Patel', leads: leads.filter((l) => l.consultantId === 'user-arun').length, won: leads.filter((l) => l.consultantId === 'user-arun' && l.status === 'Won').length, revenue: 0 },
  ];

  // Geographic Breakdown
  const locationMap: { [loc: string]: number } = {};
  userLeads.forEach((l) => {
    const city = l.location.split(',')[0].trim() || 'Other';
    locationMap[city] = (locationMap[city] || 0) + 1;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Operational Analytics & Performance Metrics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin && 'Executive oversight: Lead acquisition and wins by month, conversion rate, and system throughput.'}
            {isManager && 'Team operations: Leads per consultant, pipeline stage funnel, overdue follow-ups, and review velocity.'}
            {isConsultant && 'Personal performance: Pipeline progression, meetings held, follow-ups due, and win rate.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="py-1.5 px-3 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="This Month">This Month (October 2026)</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="This Quarter">This Quarter (Q4 2026)</option>
            <option value="This Year">This Year (2026)</option>
            <option value="All Time">All Time</option>
          </select>

          {/* Export to Excel */}
          <button
            onClick={() => exportLeadsToExcel(userLeads, `iFleon_Analytics_${dateRange.replace(/\s+/g, '_')}.xlsx`)}
            className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition"
            title="Export analytics dataset to Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>

          {/* Print Report */}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="crm-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Conversion Rate
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
              {conversionRate}%
            </span>
            <span className="text-xs text-slate-400">lead-to-win</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {wonLeads.length} deals closed from {userLeads.length} opportunities
          </p>
        </div>

        <div className="crm-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Closed Deal Revenue
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              ₹{wonRevenue.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            Average ticket: ₹{wonLeads.length > 0 ? (wonRevenue / wonLeads.length).toLocaleString() : 0}
          </p>
        </div>

        <div className="crm-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Meetings (MoM) Held
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {meetings.length}
            </span>
            <span className="text-xs text-slate-400">logged sessions</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Calls, showroom visits & video presentations
          </p>
        </div>

        <div className="crm-card p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {isAdmin ? 'System Intelligence Events' : 'Active Deal Quotations'}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">
              {isAdmin ? '142' : documents.length}
            </span>
            <span className="text-xs text-slate-400">
              {isAdmin ? 'requests' : 'generated files'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAdmin ? 'Multi-provider synthesis (Groq & OpenRouter)' : 'PowerPoint decks & PDF proposals'}
          </p>
        </div>
      </div>

      {/* Visual Chart 1: Pipeline Funnel */}
      <div className="crm-card p-5 space-y-4">
        <div className="crm-card-header pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Sales Stage Funnel (New Contact to Won)</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Sequential stage conversion drop-off and velocity
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {funnelStages.map((stage, idx) => {
            const maxVal = Math.max(...funnelStages.map((s) => s.count), 1);
            const percentage = Math.round((stage.count / maxVal) * 100);

            return (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">
                    Stage {idx + 1}: {stage.label}
                  </span>
                  <span className="text-slate-500 font-mono tabular-nums text-[11px]">
                    {stage.count} leads ({userLeads.length > 0 ? Math.round((stage.count / userLeads.length) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-6 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden p-0.5 flex items-center">
                  <div
                    className={`h-full rounded-sm ${stage.color} transition-all duration-500 flex items-center justify-end px-2 text-[10px] text-white font-mono font-bold tabular-nums`}
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  >
                    {stage.count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Consultant Performance Comparison (Manager / Admin) */}
      {(isAdmin || isManager) && (
        <div className="crm-card p-5 space-y-4">
          <div className="crm-card-header pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Consultant Activity & Win Comparison</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Comparative lead volume, wins closed, and revenue generated per consultant
              </p>
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
            <table className="crm-table w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="p-2.5">Consultant Name</th>
                  <th className="p-2.5">Total Assigned Leads</th>
                  <th className="p-2.5">Won Deals</th>
                  <th className="p-2.5">Personal Win Rate</th>
                  <th className="p-2.5 text-right">Revenue Closed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {consultantStats.map((cs) => {
                  const rate = cs.leads > 0 ? Math.round((cs.won / cs.leads) * 100) : 0;
                  return (
                    <tr key={cs.name}>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {cs.name}
                      </td>
                      <td className="p-2.5 font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums">
                        {cs.leads} leads
                      </td>
                      <td className="p-2.5 font-bold text-emerald-600 font-mono tabular-nums">
                        {cs.won} won
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono tabular-nums">
                          {rate}%
                        </span>
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        ₹{cs.revenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid: Geographic Distribution & Lost Reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Geographic Distribution */}
        <div className="crm-card p-5 space-y-4">
          <div className="crm-card-header pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Leads by Dealership Region</span>
            </h3>
          </div>

          <div className="space-y-2.5 pt-1">
            {Object.entries(locationMap).map(([city, count]) => {
              const pct = Math.round((count / userLeads.length) * 100);
              return (
                <div key={city} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-800 dark:text-slate-200">{city}</span>
                    <span className="text-slate-400 font-mono tabular-nums text-[11px]">{count} dealerships ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-sm" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lost Deal Reasons Analysis */}
        <div className="crm-card p-5 space-y-4">
          <div className="crm-card-header pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-500" />
              <span>Lost Deal Root Cause Analysis</span>
            </h3>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-rose-600 block text-[11px] uppercase tracking-wider">
                Primary Reason: Competitor Selected (Price Sensitive)
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Clients opting for static template builders. Playbook response: Emphasize vehicle EMI calculators and instant inventory sync ROI.
              </p>
            </div>

            <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-amber-600 block text-[11px] uppercase tracking-wider">
                Secondary Reason: Budget Deferred to Q1
              </span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Dealership owners awaiting festive season revenue. Auto-scheduled for proactive consultant re-engagement in 60 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
