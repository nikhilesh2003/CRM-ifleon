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
  Clock,
  LayoutGrid,
  List,
  ChevronRight,
  User,
  MapPin,
  Briefcase,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function LeadsPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading Leads...</div>}>
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

  const handleExport = () => {
    exportLeadsToExcel(filteredLeads);
  };

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
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !contactPerson.trim() || !phone.trim() || !location.trim()) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    const payload = {
      businessName: businessName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      location: location.trim(),
      status,
      followUpDate,
      leadSource,
      notes: notes.trim(),
      projectId,
      finalDealAmount: status === 'Won' && finalDealAmount ? Number(finalDealAmount) : undefined,
      startDate: status === 'Won' ? startDate : undefined,
      lostReason: status === 'Lost' ? lostReason.trim() : undefined,
      tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
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
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* Header & Main Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Lead Log & Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-owned automobile dealership leads, pipeline progression, and client logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Excel Import button */}
          <label className="cursor-pointer px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Import</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportFile} />
          </label>

          {/* Excel Export button */}
          <button
            onClick={handleExport}
            className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition border border-slate-200 dark:border-slate-700"
            title="Download Excel"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
          </button>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1 rounded ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'}`}
              title="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Add Lead */}
          <button
            onClick={handleOpenNewModal}
            className="px-3.5 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="crm-card p-3 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search business, contact, phone, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Stage:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1 px-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Stages ({leads.length})</option>
              <option value="New / Contacted">New / Contacted</option>
              <option value="Interested / Follow-up">Interested / Follow-up</option>
              <option value="Proposal sent / Negotiation">Proposal sent / Negotiation</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Consultant:</span>
            <select
              value={consultantFilter}
              onChange={(e) => setConsultantFilter(e.target.value)}
              className="py-1 px-2 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">All Consultants</option>
              <option value="user-nikhil">Nikhil Varma</option>
              <option value="user-arun">Arun Patel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Segmented Pills (SuiteCRM / Linear pattern) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setQuickFilter('all')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
            quickFilter === 'all'
              ? 'bg-blue-700 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>All Deals</span>
          <span className={`text-[10px] font-mono px-1.5 rounded ${quickFilter === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}>
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('my')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
            quickFilter === 'my'
              ? 'bg-blue-700 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <span>My Assigned Leads</span>
          <span className={`text-[10px] font-mono px-1.5 rounded ${quickFilter === 'my' ? 'bg-blue-800 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}>
            {leads.filter((l) => l.consultantId === currentUser.id).length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('today')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
            quickFilter === 'today'
              ? 'bg-amber-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Due Today</span>
          <span className={`text-[10px] font-mono px-1.5 rounded ${quickFilter === 'today' ? 'bg-amber-700 text-white' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'}`}>
            {leads.filter((l) => l.followUpDate === todayStr && l.status !== 'Won' && l.status !== 'Lost').length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('overdue')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
            quickFilter === 'overdue'
              ? 'bg-rose-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Overdue</span>
          <span className={`text-[10px] font-mono px-1.5 rounded ${quickFilter === 'overdue' ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'}`}>
            {leads.filter((l) => l.followUpDate < todayStr && l.status !== 'Won' && l.status !== 'Lost').length}
          </span>
        </button>

        <button
          onClick={() => setQuickFilter('won')}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
            quickFilter === 'won'
              ? 'bg-emerald-600 text-white'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Won Deals</span>
          <span className={`text-[10px] font-mono px-1.5 rounded ${quickFilter === 'won' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'}`}>
            {leads.filter((l) => l.status === 'Won').length}
          </span>
        </button>
      </div>

      {/* View Mode: Table */}
      {viewMode === 'table' ? (
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr>
                  <th>Dealership Account</th>
                  <th>Contact Person</th>
                  <th>Phone & WhatsApp</th>
                  <th>Location</th>
                  <th>Stage Progression</th>
                  <th>Next Follow-up</th>
                  <th>Owner</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No leads matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => {
                    const isOverdue =
                      lead.followUpDate < todayStr && lead.status !== 'Won' && lead.status !== 'Lost';
                    const isDueToday =
                      lead.followUpDate === todayStr && lead.status !== 'Won' && lead.status !== 'Lost';

                    return (
                      <tr key={lead.id}>
                        {/* Business Account */}
                        <td>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 block text-xs"
                          >
                            {lead.businessName}
                          </Link>
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {lead.tags.map((t) => (
                                <span
                                  key={t}
                                  className="text-[9px] px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Contact Person */}
                        <td className="whitespace-nowrap">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {lead.contactPerson}
                          </span>
                        </td>

                        {/* Phone with Copy & Quick Triggers */}
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200 mb-1">
                            <span>{lead.phone}</span>
                            <button
                              onClick={() => handleCopyText(lead.phone, 'phone-' + lead.id)}
                              className="p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                              title="Copy phone"
                            >
                              {copiedField === 'phone-' + lead.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <a
                              href={`tel:${lead.phone}`}
                              className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold hover:bg-emerald-100 transition flex items-center gap-1"
                              title="Call"
                            >
                              <PhoneCall className="w-2.5 h-2.5" />
                              <span>Call</span>
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 text-[10px] font-semibold hover:bg-green-100 transition flex items-center gap-1"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {lead.location}
                        </td>

                        {/* Stage with Quick Inline Selector */}
                        <td className="whitespace-nowrap">
                          {canEditLead(lead) ? (
                            <select
                              value={lead.status}
                              onChange={(e) => handleQuickStatusChange(lead.id, e.target.value as LeadStatus)}
                              className="py-1 px-1.5 rounded text-[11px] font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer focus:outline-none"
                            >
                              <option value="New / Contacted">New / Contacted</option>
                              <option value="Interested / Follow-up">Interested / Follow-up</option>
                              <option value="Proposal sent / Negotiation">Proposal sent / Negotiation</option>
                              <option value="Won">Won</option>
                              <option value="Lost">Lost</option>
                            </select>
                          ) : (
                            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                              {lead.status}
                            </span>
                          )}
                          {lead.status === 'Won' && lead.finalDealAmount && (
                            <span className="block mt-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{lead.finalDealAmount.toLocaleString()}
                            </span>
                          )}
                        </td>

                        {/* Follow up Date */}
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{lead.followUpDate}</span>
                          </div>
                          {isDueToday && (
                            <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                              Due Today
                            </span>
                          )}
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                              Overdue
                            </span>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {lead.consultantName}
                        </td>

                        {/* Actions */}
                        <td className="text-right whitespace-nowrap">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-600 hover:text-white transition font-medium text-xs"
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-4">
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
            const colValue = colLeads.reduce((s, l) => s + (l.finalDealAmount || 0), 0);

            return (
              <div
                key={colStatus}
                className="crm-card bg-slate-50/60 dark:bg-slate-900/60 p-2.5 space-y-2.5 min-w-[220px]"
              >
                <div className="p-2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold line-clamp-1 text-slate-900 dark:text-white">{colStatus}</span>
                    {colValue > 0 && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold block">
                        ₹{colValue.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-bold font-mono">
                    {colLeads.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[300px]">
                  {colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="crm-card p-3 space-y-2 bg-white dark:bg-slate-800"
                    >
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 block"
                      >
                        {lead.businessName}
                      </Link>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div className="flex items-center gap-1.5"><User className="w-3 h-3 text-slate-400" /> <span>{lead.contactPerson}</span></div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" /> <span>{lead.location}</span></div>
                        <div className="flex items-center justify-between font-mono pt-0.5">
                          <span>{lead.phone}</span>
                          <button
                            onClick={() => handleCopyText(lead.phone, 'k-phone-' + lead.id)}
                            className="p-0.5 text-slate-400 hover:text-slate-600"
                            title="Copy"
                          >
                            {copiedField === 'k-phone-' + lead.id ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      {lead.status === 'Won' && lead.finalDealAmount && (
                        <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          Won: ₹{lead.finalDealAmount.toLocaleString()}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${lead.phone}`}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 hover:text-emerald-600"
                            title="Call"
                          >
                            <PhoneCall className="w-3 h-3" />
                          </a>
                          <a
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 hover:text-green-600"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        </div>

                        {canEditLead(lead) && (
                          <select
                            value={lead.status}
                            onChange={(e) => handleQuickStatusChange(lead.id, e.target.value as LeadStatus)}
                            className="py-0.5 px-1 text-[10px] rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 font-semibold"
                          >
                            <option value="New / Contacted">New</option>
                            <option value="Interested / Follow-up">Interested</option>
                            <option value="Proposal sent / Negotiation">Proposal</option>
                            <option value="Won">Won</option>
                            <option value="Lost">Lost</option>
                          </select>
                        )}

                        <Link
                          href={`/leads/${lead.id}`}
                          className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center"
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

      {/* Add Lead Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg crm-card p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Log New Dealership Lead</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dealership / Business Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Motors Pre-Owned"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location / City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Andheri West, Mumbai"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Next Follow-up Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Sales Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="New / Contacted">New / Contacted</option>
                    <option value="Interested / Follow-up">Interested / Follow-up</option>
                    <option value="Proposal sent / Negotiation">Proposal sent / Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Inbound Web">Inbound Web</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Field Visit">Field Visit</option>
                    <option value="Referral">Referral</option>
                    <option value="Marketing Campaign">Marketing Campaign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Dealership Profile
                </label>
                <textarea
                  rows={2}
                  placeholder="Dealership inventory size, current software, pain points..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
