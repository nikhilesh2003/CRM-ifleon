'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCRM } from '@/context/CRMContext';
import { Lead, GeneratedDocument } from '@/lib/types';
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Building2,
  DollarSign,
  AlertCircle,
  FileText,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';

export default function ReviewInboxPage() {
  const { currentUser, settings } = useCRM();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackText, setFeedbackText] = useState<{ [id: string]: string }>({});

  const fetchItems = async () => {
    try {
      const [resLeads, resDocs] = await Promise.all([
        fetch('/api/leads').then((r) => r.json()),
        fetch('/api/quotations').then((r) => r.json()),
      ]);
      if (resLeads.leads) setLeads(resLeads.leads);
      if (resDocs.documents) setDocuments(resDocs.documents);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Won or Lost leads awaiting manager sign-off
  const pendingLeads = leads.filter(
    (l) => l.managerReview === 'Pending' || (l.status === 'Won' && l.managerReview !== 'Approved')
  );

  // High-value quotations awaiting manager sign-off
  const pendingQuotations = documents.filter((d) => d.status === 'Needs Approval');

  const handleLeadReview = async (leadId: string, decision: 'Approved' | 'Needs changes') => {
    const comment = feedbackText[leadId] || '';
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerReview: decision,
          managerComment: comment,
          currentUser,
        }),
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuotationApprove = async (docId: string) => {
    try {
      await fetch('/api/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, action: 'approve', currentUser }),
      });
      fetchItems();
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) return null;
  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager';

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Manager Access Only</h2>
        <p className="text-xs text-slate-500">
          The Review Inbox is reserved for Managers and Admins to review deal closures and approve commercial quotes. Use the role switcher in the header to switch to Manager or Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-emerald-600" />
          <span>Management Approvals & Deal Sign-Off</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Review and authorize deal closures (Won / Lost validation) and commercial quotations exceeding policy thresholds
        </p>
      </div>

      {/* Section 1: Lead Closures Awaiting Review */}
      <div className="crm-card p-5 space-y-4">
        <div className="crm-card-header pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Deal Closures Awaiting Review ({pendingLeads.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Mandatory sign-off required whenever a dealership lead transitions to Won or Lost
            </p>
          </div>
        </div>

        {pendingLeads.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No pending lead reviews in inbox.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingLeads.map((lead) => (
              <div key={lead.id} className="py-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600"
                      >
                        {lead.businessName}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          lead.status === 'Won'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {lead.status}
                      </span>
                      {lead.status === 'Won' && lead.finalDealAmount && (
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
                          ₹{lead.finalDealAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3 items-center">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> Contact: {lead.contactPerson} ({lead.phone})</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {lead.location}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> Submitted by: {lead.consultantName}</span>
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md border border-slate-200 dark:border-slate-800">
                        &quot;{lead.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Manager Feedback Input & Decision Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                  <input
                    type="text"
                    placeholder="Provide manager audit notes or sign-off feedback..."
                    value={feedbackText[lead.id] || ''}
                    onChange={(e) =>
                      setFeedbackText({ ...feedbackText, [lead.id]: e.target.value })
                    }
                    className="w-full sm:flex-1 px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleLeadReview(lead.id, 'Approved')}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition"
                    >
                      Authorize Deal
                    </button>
                    <button
                      onClick={() => handleLeadReview(lead.id, 'Needs changes')}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-xs transition"
                    >
                      Request Changes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Quotations Above Approval Threshold */}
      <div className="crm-card p-5 space-y-4">
        <div className="crm-card-header pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>High-Value Quotations Requiring Sign-Off ({pendingQuotations.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Quotations exceeding the ₹{settings?.quotationApprovalThreshold.toLocaleString() || '1,00,000'} policy threshold
            </p>
          </div>
        </div>

        {pendingQuotations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No quotations currently pending approval.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingQuotations.map((doc) => (
              <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                      {doc.docNumber}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {doc.businessName}
                    </span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
                      ₹{doc.total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Prepared by: <strong>{doc.consultantName}</strong> • {doc.selectedModules.length} Modules configured
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                    {doc.projectSummary}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/quotations`}
                    className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  >
                    Review Details
                  </Link>
                  <button
                    onClick={() => handleQuotationApprove(doc.id)}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-xs transition"
                  >
                    Authorize & Mark Ready
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
