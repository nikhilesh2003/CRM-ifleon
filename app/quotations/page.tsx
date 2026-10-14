'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCRM } from '@/context/CRMContext';
import { GeneratedDocument } from '@/lib/types';
import { generatePowerPointQuotation } from '@/lib/export-utils';
import {
  FileText,
  Plus,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Printer,
  Sparkles,
  Presentation,
  User,
  Copy,
  Check,
  Mail,
  Send,
  Loader2,
} from 'lucide-react';

export default function QuotationsListPage() {
  const { currentUser, settings } = useCRM();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [threshold, setThreshold] = useState<number>(100000);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);

  // Email Proposal Modal State
  const [emailModalDoc, setEmailModalDoc] = useState<GeneratedDocument | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ success: boolean; message: string } | null>(null);

  const handleCopyDocRef = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDocId(id);
    setTimeout(() => setCopiedDocId(null), 2000);
  };

  const fetchDocs = async () => {
    try {
      const res = await fetch('/api/quotations');
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
      if (data.approvalThreshold) setThreshold(data.approvalThreshold);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleDownloadPPTX = async (doc: GeneratedDocument) => {
    if (!settings) return;
    try {
      await generatePowerPointQuotation(doc, settings);
    } catch (e) {
      console.error('Error generating PPTX:', e);
      alert('Generating PowerPoint presentation...');
    }
  };

  const handleApproveDoc = async (docId: string) => {
    try {
      await fetch('/api/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, action: 'approve', currentUser }),
      });
      fetchDocs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (docId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/quotations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: docId, status: newStatus, currentUser }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to update status');
        return;
      }
      fetchDocs();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEmailModal = (doc: GeneratedDocument) => {
    setEmailModalDoc(doc);
    setTargetEmail('contact@ifleon.com');
    setEmailNotice(null);
  };

  const handleSendProposalEmail = async () => {
    if (!emailModalDoc || !targetEmail.trim()) return;
    setEmailSending(true);
    setEmailNotice(null);
    try {
      const subject = `[Proposal] ${settings?.name || 'iFleon'} Commercial Deliverables - ${emailModalDoc.businessName} (${emailModalDoc.docNumber})`;
      const htmlBody = `
        <p>Dear <strong>${emailModalDoc.contactPerson || emailModalDoc.businessName}</strong>,</p>
        <p>Thank you for engaging with <strong>${settings?.name || 'iFleon Technologies'}</strong>. We are pleased to submit our formal commercial proposal and scope definition for your review.</p>
        <div style="background:#f1f5f9;border-left:4px solid #2563eb;padding:14px 18px;margin:18px 0;border-radius:4px;">
          <div style="font-weight:700;color:#0f172a;font-size:14px;margin-bottom:6px;">Summary of Commercial Investment</div>
          <div style="font-size:13px;color:#334155;line-height:1.6;">
            <strong>Document Ref:</strong> ${emailModalDoc.docNumber}<br/>
            <strong>Scope Modules:</strong> ${emailModalDoc.selectedModules.join(', ')}<br/>
            <strong>Total Proposed Investment:</strong> ₹${emailModalDoc.total.toLocaleString('en-IN')}<br/>
            <strong>Project Timeline:</strong> ${emailModalDoc.timeline}<br/>
            <strong>Payment Terms:</strong> ${emailModalDoc.paymentTerms}
          </div>
        </div>
        <p>A full itemized breakdown and legal sign-off terms are on file with our solutions delivery group.</p>
        <p>Please review and feel free to reach out to our principal solutions consultant, <strong>${emailModalDoc.consultantName}</strong>, or our office directly at <a href="mailto:${settings?.email || 'contact@ifleon.com'}">${settings?.email || 'contact@ifleon.com'}</a>.</p>
      `;

      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: targetEmail.trim(),
          subject,
          html: htmlBody,
          type: 'quotation',
          title: `Commercial Proposal: ${emailModalDoc.businessName}`,
          meta: {
            'Document Ref': emailModalDoc.docNumber,
            'Client Entity': emailModalDoc.businessName,
            'Primary Contact': emailModalDoc.contactPerson,
            'Proposed Total': `₹${emailModalDoc.total.toLocaleString('en-IN')}`,
            'Lead Consultant': emailModalDoc.consultantName,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailNotice({
          success: true,
          message: `Proposal successfully dispatched to ${targetEmail.trim()} via ${data.transport || 'Hostinger Gateway'}.`,
        });
        if (emailModalDoc.status === 'Draft' || emailModalDoc.status === 'Needs Approval') {
          handleUpdateStatus(emailModalDoc.id, 'Sent');
        }
      } else {
        setEmailNotice({
          success: false,
          message: data.error || 'Failed to dispatch proposal email.',
        });
      }
    } catch (err: any) {
      setEmailNotice({
        success: false,
        message: err.message || 'Network error while attempting dispatch.',
      });
    } finally {
      setEmailSending(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    if (filterType === 'all') return true;
    return doc.type === filterType;
  });

  if (!currentUser) return null;
  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Presentation className="w-5 h-5 text-blue-600" />
            <span>Commercial Quotations & Proposals</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Branded PowerPoint presentations and formal PDF proposal documents with version tracking
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/quotations/new"
            className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quote / Proposal</span>
          </Link>
        </div>
      </div>

      {/* Info notice & Filter Pills */}
      <div className="crm-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Quotation Policy:</strong> Documents totaling ₹{threshold.toLocaleString()} or above require Manager authorization before client dispatch.
          </span>
        </div>
        <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${filterType === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            All ({documents.length})
          </button>
          <button
            onClick={() => setFilterType('quotation')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${filterType === 'quotation' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            Quotations
          </button>
          <button
            onClick={() => setFilterType('proposal')}
            className={`px-3 py-1 rounded text-xs font-medium transition ${filterType === 'proposal' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
          >
            Proposals
          </button>
        </div>
      </div>

      {/* Documents Table */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="crm-table w-full text-left text-xs">
            <thead>
              <tr>
                <th className="py-2.5 px-3.5">Doc Ref & Type</th>
                <th className="py-2.5 px-3.5">Dealership / Client</th>
                <th className="py-2.5 px-3.5">Scope Modules</th>
                <th className="py-2.5 px-3.5">Total Value</th>
                <th className="py-2.5 px-3.5">Consultant</th>
                <th className="py-2.5 px-3.5">Approval & Status</th>
                <th className="py-2.5 px-3.5 text-right">Generate & Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No documents generated yet. Click "Create New Quote" above.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      {/* Doc Ref & Copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white text-sm">
                          <span>{doc.docNumber}</span>
                          <button
                            onClick={() => handleCopyDocRef(doc.docNumber, doc.id)}
                            className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            title="Copy Quote Reference"
                          >
                            {copiedDocId === doc.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {doc.type} v{doc.version}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/leads/${doc.leadId}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-500 block"
                        >
                          {doc.businessName}
                        </Link>
                        <span className="text-slate-500 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{doc.contactPerson}</span>
                        </span>
                      </td>

                      {/* Modules */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {doc.selectedModules.length} module(s)
                        </span>
                        <div className="text-[10px] text-slate-400 line-clamp-1">
                          {doc.selectedModules.slice(0, 3).join(', ')}...
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                          ₹{doc.total.toLocaleString()}
                        </span>
                      </td>

                      {/* Consultant */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {doc.consultantName}
                      </td>

                      {/* Status & Approvals */}
                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              doc.status === 'Sent'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : doc.status === 'Accepted'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : doc.status === 'Needs Approval'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>

                        {/* If needs approval and current user is manager/admin */}
                        {doc.status === 'Needs Approval' && isManagerOrAdmin && (
                          <button
                            onClick={() => handleApproveDoc(doc.id)}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                          >
                            Approve Quote
                          </button>
                        )}

                        {/* Status transition dropdown */}
                        {doc.status !== 'Needs Approval' && (
                          <select
                            value={doc.status}
                            onChange={(e) => handleUpdateStatus(doc.id, e.target.value)}
                            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300"
                          >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        )}
                      </td>

                      {/* Actions: PowerPoint PPTX, PDF View & Email */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => handleDownloadPPTX(doc)}
                          className="px-2.5 py-1.5 rounded-md bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="Generate and download PowerPoint (.pptx) file"
                        >
                          <Presentation className="w-3.5 h-3.5 text-orange-400" />
                          <span>PPTX</span>
                        </button>

                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="Open printable PDF proposal view"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>

                        <button
                          onClick={() => handleOpenEmailModal(doc)}
                          className="px-2.5 py-1.5 rounded-md bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium text-xs inline-flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 shadow-xs transition cursor-pointer"
                          title="Email proposal to client"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Email</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proposal PDF Printable Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-8 space-y-6 my-8 max-h-[90vh] overflow-y-auto print:max-h-none print:m-0 print:p-0 border border-slate-200">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b pb-4 no-print">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">
                  {previewDoc.type === 'proposal' ? 'Formal Proposal Document' : 'Commercial Quotation Document'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold tabular-nums">
                  {previewDoc.docNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEmailModal(previewDoc)}
                  className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-xs flex items-center gap-1.5 border border-blue-200 shadow-xs cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Email Proposal</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs border border-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Document Content matching PDF pages 8 & 9 */}
            <div className="space-y-8 p-4 font-sans leading-relaxed">
              {/* Header with iFleon Branding */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6">
                <div>
                  <h1 className="text-3xl font-black tracking-wider text-slate-950 font-mono">
                    IFLEON
                  </h1>
                  <p className="text-xs font-semibold text-blue-600">
                    {settings?.tagline || 'Intelligent Frameworks. Powerful Execution.'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {settings?.cityState || 'Nellore, Andhra Pradesh, India'} • {settings?.website || 'https://ifleon.com'}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs uppercase tracking-widest font-black text-slate-400 block">
                    {previewDoc.type.toUpperCase()}
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900">
                    {previewDoc.docNumber}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Date: {previewDoc.date}</p>
                  <p className="text-xs text-slate-500">Valid Until: {previewDoc.validUntilDate}</p>
                </div>
              </div>

              {/* Client Profile Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Prepared For:
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{previewDoc.businessName}</h3>
                  <p className="text-slate-600">Contact: {previewDoc.contactPerson}</p>
                  <p className="text-slate-600 font-mono">{previewDoc.phone}</p>
                  <p className="text-slate-600">{previewDoc.location}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Prepared By:
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{previewDoc.consultantName}</h3>
                  <p className="text-slate-600">iFleon Solutions Consultant</p>
                  <p className="text-slate-600">{settings?.email || 'contact@ifleon.com'}</p>
                  <p className="text-slate-600 font-mono">{settings?.phone || '+91 94900 12345'}</p>
                </div>
              </div>

              {/* Executive Summary */}
              {previewDoc.executiveSummary && (
                <div className="space-y-2 text-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                    1. Executive Summary
                  </h2>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {previewDoc.executiveSummary}
                  </p>
                </div>
              )}

              {/* Understanding of Needs */}
              {previewDoc.understandingOfNeeds && (
                <div className="space-y-2 text-xs">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                    2. Understanding of Client Requirements
                  </h2>
                  <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                    {previewDoc.understandingOfNeeds}
                  </p>
                </div>
              )}

              {/* Scope & Selected Modules */}
              <div className="space-y-2 text-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                  3. Standard Scope & Selected Modules
                </h2>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {previewDoc.selectedModules.map((mod) => (
                    <div key={mod} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="font-semibold text-slate-800">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Investment & Pricing Table */}
              <div className="space-y-2 text-xs">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                  4. Commercial Investment Breakdown
                </h2>
                <table className="w-full text-left border border-slate-200 mt-2">
                  <thead className="bg-slate-100 font-bold">
                    <tr>
                      <th className="p-2 border-b">Item / Deliverable</th>
                      <th className="p-2 border-b">Scope Description</th>
                      <th className="p-2 border-b text-center">Qty</th>
                      <th className="p-2 border-b text-right">Rate</th>
                      <th className="p-2 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewDoc.lineItems.map((li, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 font-semibold">{li.moduleOrItem}</td>
                        <td className="p-2 text-slate-600">{li.description}</td>
                        <td className="p-2 text-center">{li.qty}</td>
                        <td className="p-2 text-right">₹{li.rate.toLocaleString()}</td>
                        <td className="p-2 text-right font-bold">₹{li.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50">
                      <td colSpan={3}></td>
                      <td className="p-2 text-right font-bold">Subtotal:</td>
                      <td className="p-2 text-right font-bold">₹{previewDoc.subtotal.toLocaleString()}</td>
                    </tr>
                    {previewDoc.discount > 0 && (
                      <tr className="bg-slate-50 text-rose-600">
                        <td colSpan={3}></td>
                        <td className="p-2 text-right font-bold">Special Discount:</td>
                        <td className="p-2 text-right font-bold">-₹{previewDoc.discount.toLocaleString()}</td>
                      </tr>
                    )}
                    <tr className="bg-blue-50 text-blue-900 font-bold text-sm">
                      <td colSpan={3}></td>
                      <td className="p-2 text-right">Total Investment:</td>
                      <td className="p-2 text-right">₹{previewDoc.total.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Terms & Timeline */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <h4 className="font-bold text-slate-900 mb-1">Payment Terms</h4>
                  <p className="text-slate-600">{previewDoc.paymentTerms}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <h4 className="font-bold text-slate-900 mb-1">Project Delivery Timeline</h4>
                  <p className="text-slate-600">{previewDoc.timeline}</p>
                </div>
              </div>

              {/* Terms and Sign-off */}
              <div className="space-y-4 pt-4 border-t text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Terms & Conditions</h4>
                  <p className="text-slate-600 leading-relaxed">{previewDoc.termsAndConditions}</p>
                </div>

                <div className="grid grid-cols-2 gap-8 pt-8">
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-bold text-slate-900">Authorized Signatory</p>
                    <p className="text-slate-500">iFleon Technologies</p>
                  </div>
                  <div className="border-t border-slate-300 pt-2">
                    <p className="font-bold text-slate-900">Client Acceptance & Signature</p>
                    <p className="text-slate-500">{previewDoc.businessName}</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-6 border-t text-center text-[10px] text-slate-400">
                {settings?.name || 'iFleon'} • {settings?.tagline} • {settings?.website} • {settings?.phone} • {settings?.email}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Proposal Modal */}
      {emailModalDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#111925] text-slate-900 dark:text-white rounded-xl shadow-2xl p-6 space-y-4 border border-slate-200 dark:border-[#1E2A3E]">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E2A3E] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Transmit Commercial Proposal</h3>
                  <p className="text-[11px] text-slate-500">{emailModalDoc.docNumber} • {emailModalDoc.businessName}</p>
                </div>
              </div>
              <button
                onClick={() => setEmailModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Recipient Client Email Address
                </label>
                <input
                  type="email"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  placeholder="client@dealership.com or contact@ifleon.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Deliverables:</span>
                  <span className="font-semibold">{emailModalDoc.selectedModules.length} Modules</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proposed Investment:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{emailModalDoc.total.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispatch Relay:</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">Hostinger Corporate Gateway</span>
                </div>
              </div>

              {emailNotice && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                    emailNotice.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {emailNotice.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{emailNotice.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E2A3E]">
              <button
                type="button"
                onClick={() => setEmailModalDoc(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#1E2A3E] text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleSendProposalEmail}
                disabled={emailSending || !targetEmail.trim()}
                className="px-4 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {emailSending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Transmitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Proposal via Email</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
