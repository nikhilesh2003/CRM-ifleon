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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-emerald-500" />
          <span>Manager Review & Feedback Inbox</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review deal closures (Won / Lost validation) and authorize quotations above the approval threshold
        </p>
      </div>

      {/* Section 1: Lead Closures Awaiting Review */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <span>Deal Closures Awaiting Review ({pendingLeads.length})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mandatory approval required whenever a lead moves to Won or Lost
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
              <div key={lead.id} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-500"
                      >
                        {lead.businessName}
                      </Link>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          lead.status === 'Won'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {lead.status}
                      </span>
                      {lead.status === 'Won' && lead.finalDealAmount && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                          ₹{lead.finalDealAmount.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3">
                      <span>👤 Contact: {lead.contactPerson} ({lead.phone})</span>
                      <span>📍 {lead.location}</span>
                      <span>👔 Submitted by: {lead.consultantName}</span>
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                        "{lead.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Manager Feedback Input & Decision Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <input
                    type="text"
                    placeholder="Provide manager comments or feedback..."
                    value={feedbackText[lead.id] || ''}
                    onChange={(e) =>
                      setFeedbackText({ ...feedbackText, [lead.id]: e.target.value })
                    }
                    className="w-full sm:flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleLeadReview(lead.id, 'Approved')}
                      className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
                    >
                      Approve Deal
                    </button>
                    <button
                      onClick={() => handleLeadReview(lead.id, 'Needs changes')}
                      className="flex-1 sm:flex-initial px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition"
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
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            <span>High-Value Quotations Requiring Approval ({pendingQuotations.length})</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Quotations exceeding the ₹{settings?.quotationApprovalThreshold.toLocaleString() || '1,00,000'} company limit
          </p>
        </div>

        {pendingQuotations.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            No quotations currently pending approval.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingQuotations.map((doc) => (
              <div key={doc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                      {doc.docNumber}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {doc.businessName}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                      ₹{doc.total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Prepared by: <strong>{doc.consultantName}</strong> • {doc.selectedModules.length} Modules included
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                    {doc.projectSummary}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/quotations`}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200"
                  >
                    Review Details
                  </Link>
                  <button
                    onClick={() => handleQuotationApprove(doc.id)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
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
