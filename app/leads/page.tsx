'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { Lead, LeadStatus, Project } from '@/lib/types';
import { exportLeadsToExcel, parseLeadsFromExcel } from '@/lib/export-utils';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  PhoneCall,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  ChevronRight,
  ShieldAlert,
  User,
  MapPin,
  Briefcase,
  Copy,
  Check,
  MessageSquare,
} from 'lucide-react';

export default function LeadsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Leads...</div>}>
      <LeadsPage />
    </Suspense>
  );
}

function LeadsPage() {
  const { currentUser } = useCRM();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all');
  const [consultantFilter, setConsultantFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [quickFilter, setQuickFilter] = useState<'all' | 'my' | 'today' | 'overdue' | 'won'>('all');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleQuickStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, currentUser }),
      });
      fetchLeads();
    } catch (e) {
      console.error(e);
    }
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<LeadStatus>('New / Contacted');
  const [followUpDate, setFollowUpDate] = useState(new Date().toISOString().slice(0, 10));
  const [leadSource, setLeadSource] = useState('Inbound Web');
  const [notes, setNotes] = useState('');
  const [projectId, setProjectId] = useState('');
  const [finalDealAmount, setFinalDealAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // AI & Validation warnings
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);

      const resProj = await fetch('/api/projects');
      const dataProj = await resProj.json();
      if (dataProj.projects) setProjects(dataProj.projects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Filter leads based on state
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesConsultant = consultantFilter === 'all' || lead.consultantId === consultantFilter;

    let matchesQuick = true;
    if (quickFilter === 'my') {
      matchesQuick = lead.consultantId === currentUser.id;
    } else if (quickFilter === 'today') {
      matchesQuick = lead.followUpDate === todayStr && lead.status !== 'Won' && lead.status !== 'Lost';
    } else if (quickFilter === 'overdue') {
      matchesQuick = lead.followUpDate < todayStr && lead.status !== 'Won' && lead.status !== 'Lost';
    } else if (quickFilter === 'won') {
      matchesQuick = lead.status === 'Won';
    }

    return matchesSearch && matchesStatus && matchesConsultant && matchesQuick;
  });

  // Handle Export to Excel
  const handleExport = () => {
    exportLeadsToExcel(filteredLeads);
  };

  // Handle Import from Excel
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseLeadsFromExcel(file);
      for (const item of parsed) {
        await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            consultantId: currentUser.id,
            consultantName: currentUser.name,
            projectId: projects[0]?.id,
          }),
        });
      }
      fetchLeads();
      alert(`Successfully imported ${parsed.length} leads!`);
    } catch (err) {
      console.error(err);
      alert('Error parsing Excel file. Please ensure standard column headers.');
    }
  };

  // Check duplicates with AI helper
  const handlePhoneOrNameBlur = async () => {
    if (phone.length > 5 || businessName.length > 3) {
      try {
        const res = await fetch('/api/ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check-duplicates',
            lead: { phone, businessName, id: editingLead?.id },
          }),
        });
        const data = await res.json();
        if (data?.result?.isDuplicate) {
          setDuplicateWarning(data.result.reason);
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {}
    }
  };

  const handleOpenNewModal = () => {
    setEditingLead(null);
    setBusinessName('');
    setContactPerson('');
    setPhone('');
    setLocation('');
    setStatus('New / Contacted');
    setFollowUpDate(new Date().toISOString().slice(0, 10));
    setLeadSource('Inbound Web');
    setNotes('');
    setProjectId(projects[0]?.id || '');
    setFinalDealAmount('');
    setStartDate('');
    setLostReason('');
    setTagsInput('');
    setDuplicateWarning(null);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (status === 'Won') {
      if (!finalDealAmount || Number(finalDealAmount) <= 0) {
        setErrorMsg('Final deal amount is required when status is Won.');
        return;
      }
      if (!startDate) {
        setErrorMsg('Start date is required when status is Won.');
        return;
      }
    }

    if (status === 'Lost' && !lostReason) {
      setErrorMsg('Lost reason is required when status is Lost.');
      return;
    }

    const payload = {
      businessName,
      contactPerson,
      phone,
      location,
      status,
      followUpDate,
      leadSource,
      notes,
      projectId: projectId || projects[0]?.id,
      finalDealAmount: finalDealAmount ? Number(finalDealAmount) : null,
      startDate: startDate || undefined,
      lostReason: lostReason || undefined,
      tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
      currentUser,
    };

    try {
      if (editingLead) {
        const res = await fetch(`/api/leads/${editingLead.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to update lead');
          return;
        }
      } else {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            consultantId: currentUser.id,
            consultantName: currentUser.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || 'Failed to save lead');
          return;
        }
      }

      setIsModalOpen(false);
      fetchLeads();
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong');
    }
  };

  const canEditLead = (lead: Lead) => {
    if (currentUser.role === 'admin' || currentUser.role === 'manager') return true;
    return lead.consultantId === currentUser.id;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <span>Lead Log & Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track automobile dealerships, campaign prospects, and follow-up activities
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Excel Import button */}
          <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import Excel</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          </label>

          {/* Excel Export button */}
          <button
            onClick={handleExport}
            className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition"
            title="Download leads as Excel workbook"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Lead */}
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search business name, contact, phone, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Stages ({leads.length})</option>
              <option value="New / Contacted">New / Contacted</option>
              <option value="Interested / Follow-up">Interested / Follow-up</option>
              <option value="Proposal sent / Negotiation">Proposal sent / Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Consultant:</span>
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Consultants</option>
              <option value="user-nikhil">Nikhil Varma</option>
              <option value="user-arun">Arun Patel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Segmented Pills (SuiteCRM & UIUX pattern) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setQuickFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            quickFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <span>All Deals</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${quickFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('my')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            quickFilter === 'my'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <span>My Assigned Leads</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${quickFilter === 'my' ? 'bg-blue-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {leads.filter((l) => l.consultantId === currentUser.id).length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('today')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            quickFilter === 'today'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Due Today</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${quickFilter === 'today' ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
            {leads.filter((l) => l.followUpDate === todayStr && l.status !== 'Won' && l.status !== 'Lost').length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('overdue')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            quickFilter === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Overdue</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${quickFilter === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'}`}>
            {leads.filter((l) => l.followUpDate < todayStr && l.status !== 'Won' && l.status !== 'Lost').length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('won')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            quickFilter === 'won'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Won Deals</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${quickFilter === 'won' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
            {leads.filter((l) => l.status === 'Won').length}
          </span>
        </button>
      </div>

      {/* View Mode: Table */}
      {viewMode === 'table' ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Business & Contact</th>
                  <th className="py-3.5 px-4">Phone / WhatsApp</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Follow-up Date</th>
                  <th className="py-3.5 px-4">Consultant</th>
                  <th className="py-3.5 px-4">Review</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No leads matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isOverdue =
                      lead.followUpDate < new Date().toISOString().slice(0, 10) &&
                      lead.status !== 'Won' &&
                      lead.status !== 'Lost';
                    const isDueToday =
                      lead.followUpDate === new Date().toISOString().slice(0, 10) &&
                      lead.status !== 'Won' &&
                      lead.status !== 'Lost';

                    let statusBadge = 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
                    if (lead.status === 'Interested / Follow-up') {
                      statusBadge = 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';
                    } else if (lead.status === 'Proposal sent / Negotiation') {
                      statusBadge = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
                    } else if (lead.status === 'Won') {
                      statusBadge = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold';
                    } else if (lead.status === 'Lost') {
                      statusBadge = 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
                    }

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                      >
                        {/* Business & Contact */}
                        <td className="py-3.5 px-4">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition block text-sm"
                          >
                            {lead.businessName}
                          </Link>
                          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{lead.contactPerson}</span>
                          </span>
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {lead.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Phone / Click-to-call / WhatsApp / Copy */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 mb-1">
                            <span>{lead.phone}</span>
                            <button
                              onClick={() => handleCopyText(lead.phone, 'phone-' + lead.id)}
                              className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              title="Copy phone number"
                            >
                              {copiedField === 'phone-' + lead.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${lead.phone}`}
                              className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold hover:bg-emerald-200 transition flex items-center gap-1"
                              title="Click to call"
                            >
                              <PhoneCall className="w-2.5 h-2.5" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-0.5 rounded-lg bg-green-100 dark:bg-green-950/50 text-green-700 dark:text-green-300 text-[10px] font-bold hover:bg-green-200 transition flex items-center gap-1"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{lead.location}</span>
                          </span>
                        </td>

                        {/* Status with Quick Lifecycle Selector */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {canEditLead(lead) ? (
                            <select
                              value={lead.status}
                              onChange={(e) => handleQuickStatusChange(lead.id, e.target.value as LeadStatus)}
                              className={`py-1 px-2 rounded-lg text-xs font-semibold border cursor-pointer ${statusBadge} focus:outline-none`}
                            >
                              <option value="New / Contacted">New / Contacted</option>
                              <option value="Interested / Follow-up">Interested / Follow-up</option>
                              <option value="Proposal sent / Negotiation">Proposal sent / Negotiation</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </select>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                              {lead.status}
                            </span>
                          )}
                          {lead.status === 'Won' && lead.finalDealAmount && (
                            <span className="block mt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              ₹{lead.finalDealAmount.toLocaleString()}
                            </span>
                          )}
                          {lead.status === 'Lost' && lead.lostReason && (
                            <span className="block mt-1 text-[10px] text-rose-500">
                              {lead.lostReason}
                            </span>
                          )}
                        </td>

                        {/* Follow up Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{lead.followUpDate}</span>
                          </div>
                          {isDueToday && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                              Due Today
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mt-0.5">
                              Overdue
                            </span>
                          )}
                        </td>

                        {/* Consultant */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {lead.consultantName}
                          </span>
                        </td>

                        {/* Manager Review */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              lead.managerReview === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : lead.managerReview === 'Needs changes'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {lead.managerReview}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white transition font-medium"
                          >
                            <span>Open</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: Kanban Pipeline */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {(
            [
              'New / Contacted',
              'Interested / Follow-up',
              'Proposal sent / Negotiation',
              'Won',
              'Lost',
            ] as LeadStatus[]
          ).map((colStatus) => {
            const colLeads = filteredLeads.filter((l) => l.status === colStatus);
            let headerBg = 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30';
            if (colStatus === 'Won') headerBg = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
            if (colStatus === 'Lost') headerBg = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';

            return (
              <div
                key={colStatus}
                className="bg-slate-100/70 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${headerBg}`}>
                  <div>
                    <span className="font-bold line-clamp-1">{colStatus}</span>
                    {colLeads.reduce((s, l) => s + (l.finalDealAmount || 0), 0) > 0 && (
                      <span className="text-[10px] opacity-80 font-mono block">
                        ₹{colLeads.reduce((s, l) => s + (l.finalDealAmount || 0), 0).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[10px] font-black shadow-xs">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 min-h-[300px]">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md card-hover-fx space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-500 block leading-snug"
                        >
                          {lead.businessName}
                        </Link>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /> <span>{lead.contactPerson}</span></div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> <span>{lead.location}</span></div>
                        <div className="flex items-center justify-between font-mono pt-0.5">
                          <span>{lead.phone}</span>
                          <button
                            onClick={() => handleCopyText(lead.phone, 'kanban-phone-' + lead.id)}
                            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            title="Copy phone"
                          >
                            {copiedField === 'kanban-phone-' + lead.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {lead.status === 'Won' && lead.finalDealAmount && (
                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                          Won: ₹{lead.finalDealAmount.toLocaleString()}
                        </div>
                      )}

                      {/* Quick Move Stage & Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition"
                            title="Call client"
                          >
                            <PhoneCall className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 hover:bg-green-100 transition"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>

                        {canEditLead(lead) ? (
                          <select
                            value={lead.status}
                            onChange={(e) => handleQuickStatusChange(lead.id, e.target.value as LeadStatus)}
                            className="py-1 px-1.5 text-[10px] rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-200"
                            title="Move stage"
                          >
                            <option value="New / Contacted">New</option>
                            <option value="Interested / Follow-up">Interested</option>
                            <option value="Proposal sent / Negotiation">Proposal</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        ) : null}

                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-0.5"
                        >
                          <span>Open</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingLead ? 'Edit Lead Record' : 'Add New Lead Contact'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Assigned Consultant: <strong>{currentUser.name}</strong> ({currentUser.role})
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Duplicate detection alert banner */}
            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{duplicateWarning}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLead} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Business / Showroom Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sri Sai Elite Cars"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onBlur={handlePhoneOrNameBlur}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suresh Reddy"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (validated) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 94401 23456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={handlePhoneOrNameBlur}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location (City & Area) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nellore, Trunk Road"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="New / Contacted">New / Contacted</option>
                    <option value="Interested / Follow-up">Interested / Follow-up</option>
                    <option value="Proposal sent / Negotiation">Proposal sent / Negotiation</option>
                    <option value="Won">Won (Deal Closed)</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Follow-up Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Inbound Web">Inbound Web</option>
                    <option value="Referral">Referral</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Social Media">Social Media</option>
                    <option value="Event/Exhibition">Event/Exhibition</option>
                    <option value="Existing Client">Existing Client</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Campaign / Project
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Won Fields */}
              {status === 'Won' && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 space-y-3">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                    Won Deal Requirements (Manager Approval Required)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                        Final Deal Amount (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 95000"
                        value={finalDealAmount}
                        onChange={(e) => setFinalDealAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                        Project Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-xs text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Lost Fields */}
              {status === 'Lost' && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30 space-y-2">
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                    Lost Deal Feedback
                  </span>
                  <div>
                    <label className="block text-xs font-semibold text-rose-800 dark:text-rose-300 mb-1">
                      Lost Reason *
                    </label>
                    <select
                      value={lostReason}
                      onChange={(e) => setLostReason(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-700 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="">Select Lost Reason...</option>
                      <option value="Price too high">Price too high</option>
                      <option value="Competitor chosen">Competitor chosen</option>
                      <option value="Delayed timeline">Delayed timeline</option>
                      <option value="Scope mismatch">Scope mismatch</option>
                      <option value="No response / Ghosted">No response / Ghosted</option>
                      <option value="Budget cancelled">Budget cancelled</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Tags Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pre-Owned, Luxury, Hot Lead, High Value"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Call Notes & Requirements Heard
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize initial phone discussion, vehicle inventory size, requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                >
                  Save Lead Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
