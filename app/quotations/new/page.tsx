'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { Lead, StandardScopeModule, PriceListItem, QuotationLineItem } from '@/lib/types';
import { generatePowerPointQuotation } from '@/lib/export-utils';
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  ChevronLeft,
  Presentation,
  CheckCircle,
  Building2,
  DollarSign,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Briefcase,
} from 'lucide-react';

export default function NewQuotationWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Builder...</div>}>
      <NewQuotationPage />
    </Suspense>
  );
}

function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, settings } = useCRM();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>(searchParams.get('leadId') || '');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [docType, setDocType] = useState<'quotation' | 'proposal'>('quotation');
  const [scopeModules, setScopeModules] = useState<StandardScopeModule[]>([]);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);

  // Selected Scope items
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Line items
  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      id: 'li-default-1',
      moduleOrItem: 'Pre-Owned Car Portal - Core Engine',
      description: 'Complete inventory database, multi-facet search & high-res car gallery',
      qty: 1,
      rate: 65000,
      amount: 65000,
    },
    {
      id: 'li-default-2',
      moduleOrItem: 'EMI Calculator & Financing Widget',
      description: 'Live EMI breakdown from vehicle pricing with tenure selector',
      qty: 1,
      rate: 10000,
      amount: 10000,
    },
  ]);
  const [discount, setDiscount] = useState<number>(0);

  // Text contents
  const [projectSummary, setProjectSummary] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [understandingOfNeeds, setUnderstandingOfNeeds] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(
    '50% advance on sign-off, 30% upon staging demo approval, 20% on final domain launch.'
  );
  const [timeline, setTimeline] = useState('3 to 4 weeks delivery from design sign-off.');
  const [termsAndConditions, setTermsAndConditions] = useState(
    'Validity: 15 days from issue date. Includes 2 design revisions and 30 days post-launch warranty.'
  );

  const [aiDrafting, setAiDrafting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadMasterData() {
      try {
        const [resLeads, resMaster] = await Promise.all([
          fetch('/api/leads').then((r) => r.json()),
          fetch('/api/admin/master-lists').then((r) => r.json()),
        ]);
        if (resLeads.leads) {
          setLeads(resLeads.leads);
          const initialLead = resLeads.leads.find((l: Lead) => l.id === selectedLeadId) || resLeads.leads[0];
          if (initialLead) {
            setSelectedLeadId(initialLead.id);
            setSelectedLead(initialLead);
          }
        }
        if (resMaster.scopeModules) {
          setScopeModules(resMaster.scopeModules);
          // Default select first 5 modules
          setSelectedModules(resMaster.scopeModules.slice(0, 5).map((m: any) => m.name));
        }
        if (resMaster.priceList) {
          setPriceList(resMaster.priceList);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMasterData();
  }, []);

  useEffect(() => {
    if (selectedLeadId && leads.length > 0) {
      const found = leads.find((l) => l.id === selectedLeadId);
      if (found) {
        setSelectedLead(found);
      }
    }
  }, [selectedLeadId, leads]);

  if (!currentUser) return null;

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const total = Math.max(0, subtotal - discount);

  // Toggle scope module
  const toggleScopeModule = (modName: string) => {
    if (selectedModules.includes(modName)) {
      setSelectedModules(selectedModules.filter((m) => m !== modName));
    } else {
      setSelectedModules([...selectedModules, modName]);
    }
  };

  // Add line item from price list
  const handleAddFromPriceList = (plItem: PriceListItem) => {
    setLineItems([
      ...lineItems,
      {
        id: `li-${Date.now()}`,
        moduleOrItem: plItem.name,
        description: plItem.description,
        qty: 1,
        rate: plItem.rate,
        amount: plItem.rate,
      },
    ]);
  };

  // Add custom line item
  const handleAddCustomLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `li-${Date.now()}`,
        moduleOrItem: 'Custom Module / Service',
        description: 'Scope specification details',
        qty: 1,
        rate: 15000,
        amount: 15000,
      },
    ]);
  };

  const handleUpdateLineItem = (index: number, field: keyof QuotationLineItem, value: any) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    if (field === 'qty' || field === 'rate') {
      updated[index].amount = updated[index].qty * updated[index].rate;
    }
    setLineItems(updated);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, idx) => idx !== index));
  };

  // AI Drafting Action: Draft wording from lead notes & minutes
  const handleAIDraftWording = async () => {
    if (!selectedLead) return;
    setAiDrafting(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'draft-proposal',
          leadId: selectedLead.id,
          selectedModules,
        }),
      });
      const data = await res.json();
      if (data.drafts) {
        setProjectSummary(data.drafts.projectSummary || '');
        setExecutiveSummary(data.drafts.executiveSummary || '');
        setUnderstandingOfNeeds(data.drafts.understandingOfNeeds || '');
        setProposedSolution(data.drafts.proposedSolution || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiDrafting(false);
    }
  };

  // Handle Form Submission & Optional Immediate PPTX Download
  const handleCreateDocument = async (downloadImmediately = false) => {
    if (!selectedLead) {
      alert('Please select a client lead record.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: docType,
        leadId: selectedLead.id,
        businessName: selectedLead.businessName,
        contactPerson: selectedLead.contactPerson,
        phone: selectedLead.phone,
        location: selectedLead.location,
        consultantId: selectedLead.consultantId || currentUser.id,
        consultantName: selectedLead.consultantName || currentUser.name,
        projectSummary: projectSummary || `Digital web platform for ${selectedLead.businessName}`,
        selectedModules,
        lineItems,
        subtotal,
        discount,
        total,
        paymentTerms,
        timeline,
        termsAndConditions,
        executiveSummary,
        understandingOfNeeds,
        proposedSolution,
        currentUser,
      };

      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.document) {
        if (downloadImmediately && settings) {
          await generatePowerPointQuotation(data.document, settings);
        }
        router.push('/quotations');
      } else {
        alert(data.error || 'Failed to create document');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/quotations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Quotations List</span>
        </Link>
        <span className="text-xs font-mono font-bold text-blue-600 uppercase tracking-wider">
          Document Generator
        </span>
      </div>

      <div className="crm-card p-6 space-y-6">
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Generate Branded Quotation or Proposal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build PowerPoint decks (.pptx) and comprehensive proposals with automated numbering and client meeting minutes synthesis
          </p>
        </div>

        {/* Format Selector: Quotation vs Proposal */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDocType('quotation')}
            className={`p-3.5 rounded-md border text-left transition ${
              docType === 'quotation'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase tracking-wide">Commercial Quotation</span>
              <Presentation className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              PowerPoint (.pptx) slides deck, itemized pricing and deliverables focused
            </p>
          </button>

          <button
            type="button"
            onClick={() => setDocType('proposal')}
            className={`p-3.5 rounded-md border text-left transition ${
              docType === 'proposal'
                ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-1 ring-blue-600/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs uppercase tracking-wide">Detailed Proposal</span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Comprehensive PDF proposal with executive summary, needs analysis and architecture
            </p>
          </button>
        </div>

        {/* Lead Selection */}
        <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Target Client Dealership
          </label>
          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
          >
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.businessName} — {l.contactPerson} ({l.location})
              </option>
            ))}
          </select>

          {selectedLead && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-slate-400" /> Contact: <strong className="text-slate-700 dark:text-slate-300">{selectedLead.contactPerson}</strong></div>
              <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> Phone: <strong className="text-slate-700 dark:text-slate-300">{selectedLead.phone}</strong></div>
              <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Location: <strong className="text-slate-700 dark:text-slate-300">{selectedLead.location}</strong></div>
              <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> Consultant: <strong className="text-slate-700 dark:text-slate-300">{selectedLead.consultantName}</strong></div>
            </div>
          )}
        </div>

        {/* Standard Scope Modules Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Standard Scope Selection (Pre-Owned Car Dealer Modules)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick the modules included in this quotation from the admin master list
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {selectedModules.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {scopeModules.map((mod) => {
              const isChecked = selectedModules.includes(mod.name);
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleScopeModule(mod.name)}
                  className={`p-3 rounded-md border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                    isChecked
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 text-blue-950 dark:text-blue-100 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold block">{mod.name}</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {mod.description}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing & Commercial Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
                Commercial Pricing Line Items
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure deliverable line items, quantities, rates and discounts
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Add from Price List */}
              <select
                onChange={(e) => {
                  const item = priceList.find((p) => p.id === e.target.value);
                  if (item) handleAddFromPriceList(item);
                  e.target.value = '';
                }}
                defaultValue=""
                className="py-1 px-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                <option value="" disabled>+ Add from Price List...</option>
                {priceList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.rate.toLocaleString()})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddCustomLineItem}
                className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium text-xs border border-slate-200 dark:border-slate-700"
              >
                + Custom Item
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Item / Service</th>
                  <th className="py-2.5 px-3">Scope Description</th>
                  <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lineItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.moduleOrItem}
                        onChange={(e) => handleUpdateLineItem(idx, 'moduleOrItem', e.target.value)}
                        className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateLineItem(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateLineItem(idx, 'qty', Number(e.target.value))}
                        className="w-full px-2 py-1 text-center rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleUpdateLineItem(idx, 'rate', Number(e.target.value))}
                        className="w-full px-2 py-1 text-right rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                      />
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{item.amount.toLocaleString()}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal, Discount & Total Row */}
          <div className="flex flex-col sm:flex-row items-end justify-end gap-4 p-4 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-1.5 text-right">
              <div className="text-slate-500">
                Subtotal: <strong className="text-slate-900 dark:text-white font-mono tabular-nums">₹{subtotal.toLocaleString()}</strong>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-slate-500">Special Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-right rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs tabular-nums"
                />
              </div>
              <div className="text-base font-bold text-blue-600 dark:text-blue-400 pt-1 font-mono tabular-nums">
                Total Quotation: ₹{total.toLocaleString()}
              </div>
              {settings && settings.quotationApprovalThreshold > 0 && total >= settings.quotationApprovalThreshold && (
                <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1 justify-end pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Exceeds ₹{settings.quotationApprovalThreshold.toLocaleString()} threshold. Will require Manager approval.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Proposal Scope & Narrative Assistant */}
        <div className="p-4 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Meeting Minutes (MoM) Narrative Assistant
              </span>
            </div>

            <button
              type="button"
              onClick={handleAIDraftWording}
              disabled={aiDrafting || !selectedLead}
              className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{aiDrafting ? 'Synthesizing Meeting Minutes...' : 'Draft Narrative from Minutes'}</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            Synthesizes logged client meeting notes and selected modules into executive proposal sections. Pricing and rates remain strictly controlled by the consultant.
          </p>
        </div>

        {/* Project Summary */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Project Summary *
          </label>
          <textarea
            rows={3}
            placeholder="Core summary of deliverables and scope..."
            value={projectSummary}
            onChange={(e) => setProjectSummary(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed focus:ring-1 focus:ring-blue-600"
          ></textarea>
        </div>

        {/* Additional Proposal Sections (if Proposal mode) */}
        {docType === 'proposal' && (
          <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Executive Summary (Client Challenge & Proposed Architecture)
              </label>
              <textarea
                rows={3}
                value={executiveSummary}
                onChange={(e) => setExecutiveSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Understanding of Needs (Derived from client minutes)
              </label>
              <textarea
                rows={3}
                value={understandingOfNeeds}
                onChange={(e) => setUnderstandingOfNeeds(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Proposed Solution Architecture
              </label>
              <textarea
                rows={3}
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white leading-relaxed"
              ></textarea>
            </div>
          </div>
        )}

        {/* Payment Terms & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Payment Terms & Milestones
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Delivery Timeline
            </label>
            <input
              type="text"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Terms and Conditions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Standard Commercial Terms & Conditions
          </label>
          <textarea
            rows={2}
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/quotations"
            className="px-4 py-2 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={() => handleCreateDocument(false)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition"
          >
            Save Document Record
          </button>

          <button
            type="button"
            onClick={() => handleCreateDocument(true)}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Presentation className="w-3.5 h-3.5" />
            <span>Save & Download PPTX Deck</span>
          </button>
        </div>
      </div>
    </div>
  );
}
