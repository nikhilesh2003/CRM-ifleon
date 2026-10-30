'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { useToast } from '@/context/ToastContext';
import { Lead, MeetingNote, TaskItem, GeneratedDocument, MeetingType, LeadStatus } from '@/lib/types';
import {
  Users,
  Building2,
  PhoneCall,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  MessageSquare,
  Plus,
  Send,
  FileCheck2,
  ChevronLeft,
  ArrowRight,
  Phone,
  MapPin,
  Briefcase,
  User,
  Compass,
  Video,
  Presentation,
  Check,
  XCircle,
  Copy,
  X,
  Sparkles,
} from 'lucide-react';

const LIFECYCLE_STAGES: LeadStatus[] = [
  'New / Contacted',
  'Interested / Follow-up',
  'Proposal sent / Negotiation',
  'Won',
  'Lost',
];

export default function LeadDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, allUsers } = useCRM();
  const { toast } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Workspace Tab: 'mom' | 'tasks' | 'quotes' | 'ai'
  const [activeTab, setActiveTab] = useState<'mom' | 'tasks' | 'quotes' | 'ai'>('mom');

  // MoM Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [meetType, setMeetType] = useState<MeetingType>('Call');
  const [meetAttendees, setMeetAttendees] = useState('');
  const [meetMinutes, setMeetMinutes] = useState('');
  const [meetNextAction, setMeetNextAction] = useState('');
  const [meetDate, setMeetDate] = useState(new Date().toISOString().slice(0, 16));
  const [updateFollowUpDate, setUpdateFollowUpDate] = useState(true);
  const [newFollowUpDate, setNewFollowUpDate] = useState(
    new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  );

  // Won / Lost Prompt Modals
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [wonAmountInput, setWonAmountInput] = useState('');
  const [wonStartDateInput, setWonStartDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [lostReasonInput, setLostReasonInput] = useState('');

  // AI Helper States
  const [aiSuggestMsg, setAiSuggestMsg] = useState<string | null>(null);
  const [aiManagerBrief, setAiManagerBrief] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Task inline state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Manager Review inline state
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [isCopiedLead, setIsCopiedLead] = useState(false);

  const handleCopyLeadSummary = () => {
    if (!lead) return;
    const summary = `Dealership: ${lead.businessName}\nContact: ${lead.contactPerson}\nPhone: ${lead.phone}\nLocation: ${lead.location}\nStage: ${lead.status}\nNext Follow-up: ${lead.followUpDate}\nConsultant: ${lead.consultantName}`;
    navigator.clipboard.writeText(summary);
    setIsCopiedLead(true);
    setTimeout(() => setIsCopiedLead(false), 2000);
  };

  const fetchLeadData = async () => {
    try {
      const res = await fetch(`/api/leads/${params.id}`);
      const data = await res.json();
      if (data.lead) {
        setLead(data.lead);
        setMeetings(data.lead.meetings || []);
        setTasks(data.lead.tasks || []);
        setDocuments(data.lead.documents || []);
        setReviewComment(data.lead.managerComment || '');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchLeadData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        Loading record...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-rose-600 font-semibold text-xs">Lead record not found.</p>
        <Link href="/leads" className="text-blue-600 underline text-xs">
          Return to lead log
        </Link>
      </div>
    );
  }

  const isConsultant = currentUser.role === 'consultant';
  const isManager = currentUser.role === 'manager';
  const isAdmin = currentUser.role === 'admin';
  const canEdit = isAdmin || isManager || lead.consultantId === currentUser.id;

  // Pipeline Stepper stage click
  const handleStageClick = async (targetStage: LeadStatus) => {
    if (!canEdit) {
      toast.warning('You only have permission to edit leads assigned to your account.', 'Access Restricted');
      return;
    }

    if (targetStage === 'Won') {
      setIsWonModalOpen(true);
      return;
    }

    if (targetStage === 'Lost') {
      setIsLostModalOpen(true);
      return;
    }

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: targetStage,
          currentUser,
        }),
      });
      toast.success(`Pipeline stage transitioned to "${targetStage}".`, 'Stage Updated');
      fetchLeadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update pipeline stage.');
    }
  };

  // Submit Won Status
  const handleConfirmWon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wonAmountInput || Number(wonAmountInput) <= 0) {
      toast.error('Final deal amount is required when marking a lead as Won.', 'Missing Deal Value');
      return;
    }

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Won',
          finalDealAmount: Number(wonAmountInput),
          startDate: wonStartDateInput,
          currentUser,
        }),
      });
      setIsWonModalOpen(false);
      toast.success(`Deal marked as Won (₹${Number(wonAmountInput).toLocaleString('en-IN')}) and routed for managerial review.`, 'Deal Won');
      fetchLeadData();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update deal status.');
    }
  };

  // Submit Lost Status
  const handleConfirmLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostReasonInput.trim()) {
      toast.error('Reason for lost status is mandatory for audit compliance.', 'Missing Lost Reason');
      return;
    }

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Lost',
          lostReason: lostReasonInput.trim(),
          currentUser,
        }),
      });
      setIsLostModalOpen(false);
      fetchLeadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Save Minutes of Meeting
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetMinutes.trim()) return;

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          meetingType: meetType,
          attendees: meetAttendees.trim(),
          minutes: meetMinutes.trim(),
          nextAction: meetNextAction.trim(),
          date: meetDate,
          currentUser,
        }),
      });

      if (res.ok) {
        if (updateFollowUpDate && newFollowUpDate) {
          await fetch(`/api/leads/${lead.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              followUpDate: newFollowUpDate,
              currentUser,
            }),
          });
        }
        setIsMeetingModalOpen(false);
        setMeetMinutes('');
        setMeetNextAction('');
        fetchLeadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Inline Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          consultantId: lead.consultantId,
          title: newTaskTitle.trim(),
          dueDate: newTaskDueDate,
          currentUser,
        }),
      });
      if (res.ok) {
        setNewTaskTitle('');
        fetchLeadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: !currentCompleted }),
      });
      fetchLeadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Manager Review Action
  const handleManagerReviewSubmit = async (reviewStatus: 'Approved' | 'Needs changes') => {
    setIsReviewSubmitting(true);
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          managerReview: reviewStatus,
          managerComment: reviewComment,
          currentUser,
        }),
      });
      fetchLeadData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  // Reassign Consultant
  const handleReassignConsultant = async (newConsultantId: string) => {
    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultantId: newConsultantId,
          currentUser,
        }),
      });
      fetchLeadData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Lead Pipeline</span>
        </Link>
        <span className="text-slate-400 font-mono text-[11px]">
          Record ID: {lead.id}
        </span>
      </div>

      {/* SuiteCRM Lifecycle Stepper Chevron */}
      <div className="crm-card p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
          <span className="font-semibold uppercase tracking-wider">Lifecycle Stage Progression:</span>
          <span>Click stage to advance</span>
        </div>
        <div className="pipeline-stepper">
          {LIFECYCLE_STAGES.map((stage) => {
            const isActive = lead.status === stage;
            const currentIndex = LIFECYCLE_STAGES.indexOf(lead.status);
            const stageIndex = LIFECYCLE_STAGES.indexOf(stage);
            const isCompleted = stageIndex < currentIndex && lead.status !== 'Lost';

            return (
              <button
                key={stage}
                type="button"
                onClick={() => handleStageClick(stage)}
                className={`pipeline-step ${
                  isActive
                    ? 'active'
                    : isCompleted
                    ? 'completed'
                    : ''
                }`}
              >
                {stage === 'New / Contacted' && <Users className="w-3.5 h-3.5" />}
                {stage === 'Interested / Follow-up' && <Clock className="w-3.5 h-3.5" />}
                {stage === 'Proposal sent / Negotiation' && <FileText className="w-3.5 h-3.5" />}
                {stage === 'Won' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                {stage === 'Lost' && <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                <span>{stage}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Record Top Summary Banner */}
      <div className="crm-card p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lead.businessName}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                  lead.status === 'Won'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : lead.status === 'Lost'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                }`}
              >
                {lead.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700 dark:text-slate-300">{lead.contactPerson}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {lead.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Owner: <strong>{lead.consultantName}</strong>
              </span>
            </div>
          </div>

          {/* Quick Triggers */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={handleCopyLeadSummary}
              className="px-2.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
              title="Copy Summary"
            >
              {isCopiedLead ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <a
              href={`tel:${lead.phone}`}
              className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition"
              title="Call"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call ({lead.phone})</span>
            </a>

            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition"
              title="WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => setIsMeetingModalOpen(true)}
              className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1.5 transition"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Log MoM</span>
            </button>

            <Link
              href={`/quotations/new?leadId=${lead.id}`}
              className="px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>New Quotation / PPTX</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SuiteCRM 2-Column Record Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Account Profile Snapshot */}
        <div className="space-y-4">
          <div className="crm-card p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-100 dark:border-slate-800 pb-2">
              Account Snapshot
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Contact</span>
                <span className="font-semibold text-slate-900 dark:text-white">{lead.contactPerson}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Direct Mobile / WhatsApp</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{lead.phone}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Dealership Location</span>
                <span className="text-slate-800 dark:text-slate-200">{lead.location}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Next Touchpoint Date</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{lead.followUpDate}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px]">Lead Source</span>
                <span className="text-slate-800 dark:text-slate-200">{lead.leadSource}</span>
              </div>

              {lead.status === 'Won' && lead.finalDealAmount && (
                <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-emerald-700 dark:text-emerald-400 block text-[11px] font-bold">Closed Deal Value</span>
                  <span className="text-base font-extrabold font-mono text-emerald-700 dark:text-emerald-300">
                    ₹{lead.finalDealAmount.toLocaleString()}
                  </span>
                  {lead.startDate && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Start Date: {lead.startDate}
                    </span>
                  )}
                </div>
              )}

              {lead.status === 'Lost' && lead.lostReason && (
                <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300">
                  <span className="block text-[11px] font-bold">Reason for Lost</span>
                  <span className="text-xs">{lead.lostReason}</span>
                </div>
              )}
            </div>

            {/* Reassign Consultant (Manager/Admin) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 block text-[11px]">Assigned Consultant</span>
              {isAdmin || isManager ? (
                <select
                  value={lead.consultantId}
                  onChange={(e) => handleReassignConsultant(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-slate-900 dark:text-white">
                  {lead.consultantName}
                </span>
              )}
            </div>

            {/* Manager Review Status */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Manager Review:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    lead.managerReview === 'Approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : lead.managerReview === 'Needs changes'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {lead.managerReview}
                </span>
              </div>

              {lead.managerComment && (
                <p className="text-[11px] text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800 p-2 rounded">
                  "{lead.managerComment}"
                </p>
              )}

              {/* Manager Approval Trigger */}
              {isManager && lead.managerReview === 'Pending' && (lead.status === 'Won' || lead.status === 'Lost') && (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    placeholder="Review comment..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleManagerReviewSubmit('Approved')}
                      disabled={isReviewSubmitting}
                      className="flex-1 py-1 rounded bg-emerald-600 text-white font-bold text-xs"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleManagerReviewSubmit('Needs changes')}
                      disabled={isReviewSubmitting}
                      className="flex-1 py-1 rounded bg-rose-600 text-white font-bold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Activity Center (SuiteCRM Architecture) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="crm-card">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-3 pt-2 gap-1 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('mom')}
                className={`px-3 py-2 border-b-2 transition ${
                  activeTab === 'mom'
                    ? 'border-blue-600 text-blue-600 font-bold bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Meeting Minutes (MoM) ({meetings.length})
              </button>

              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-2 border-b-2 transition ${
                  activeTab === 'tasks'
                    ? 'border-blue-600 text-blue-600 font-bold bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Action Tasks ({tasks.length})
              </button>

              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-3 py-2 border-b-2 transition ${
                  activeTab === 'quotes'
                    ? 'border-blue-600 text-blue-600 font-bold bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Quotations & Proposals ({documents.length})
              </button>

              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-2 border-b-2 transition ${
                  activeTab === 'ai'
                    ? 'border-blue-600 text-blue-600 font-bold bg-white dark:bg-slate-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Sales Assistant
              </button>
            </div>

            {/* Tab 1: Meeting Minutes (MoM) Timeline */}
            {activeTab === 'mom' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Chronological Discussion Logs
                  </span>
                  <button
                    onClick={() => setIsMeetingModalOpen(true)}
                    className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1 transition shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Log Meeting / Call</span>
                  </button>
                </div>

                {meetings.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    <Calendar className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
                    <p className="font-semibold text-slate-600 dark:text-slate-400">No meeting minutes logged yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Click "Log Meeting / Call" above to record client interactions.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
                    {meetings.map((m) => (
                      <div key={m.id} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold text-[10px] font-mono">
                              {m.type}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              Logged by {m.addedByName}
                            </span>
                          </div>
                          <span className="text-slate-400 font-mono text-[11px] tabular-nums">
                            {m.meetingDateTime || m.createdAt}
                          </span>
                        </div>

                        {m.attendees && (
                          <div className="text-[11px] text-slate-500">
                            Attendees: <strong>{m.attendees}</strong>
                          </div>
                        )}

                        <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-xs">
                          {m.minutes}
                        </div>

                        {m.nextAction && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded flex items-center gap-1.5">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>Action Item: {m.nextAction}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Action Tasks Checklist */}
            {activeTab === 'tasks' && (
              <div className="p-4 space-y-4">
                <form onSubmit={handleCreateTask} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Add follow-up task or deliverable..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-36 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs shadow-xs"
                  >
                    Add Task
                  </button>
                </form>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No active tasks. Add one using the field above.
                    </div>
                  ) : (
                    tasks.map((t) => (
                      <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => handleToggleTask(t.id, t.completed)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                          <span className={t.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200 font-medium'}>
                            {t.title}
                          </span>
                        </label>
                        <span className="font-mono text-[11px] text-slate-400">
                          Due: {t.dueDate}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Commercial Quotations & Proposals */}
            {activeTab === 'quotes' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Commercial Documents for {lead.businessName}
                  </span>
                  <Link
                    href={`/quotations/new?leadId=${lead.id}`}
                    className="px-2.5 py-1 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Quotation / PPTX</span>
                  </Link>
                </div>

                {documents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    No quotations generated for this account yet.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((doc) => (
                      <div key={doc.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                              {doc.docNumber}
                            </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              ₹{doc.total.toLocaleString()}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800">
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {doc.selectedModules.length} Modules • Prepared by {doc.consultantName}
                          </p>
                        </div>
                        <Link
                          href="/quotations"
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium text-xs"
                        >
                          View Document →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: AI Sales Intelligence (Subtle Assistant) */}
            {activeTab === 'ai' && (
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>AI Discussion Synthesizer</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Analyzes logged minutes of meeting and suggests next tactical follow-up questions.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      setAiLoading(true);
                      try {
                        const res = await fetch('/api/ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'suggestFollowUp',
                            lead,
                            meetingMinutes: meetings.map((m) => m.minutes).join('\n'),
                          }),
                        });
                        const data = await res.json();
                        setAiSuggestMsg(data.result);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-medium text-xs disabled:opacity-50"
                  >
                    {aiLoading ? 'Analyzing...' : 'Generate Follow-up Angle'}
                  </button>

                  <button
                    onClick={async () => {
                      setAiLoading(true);
                      try {
                        const res = await fetch('/api/ai', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            action: 'generateManagerBrief',
                            lead,
                            meetingMinutes: meetings.map((m) => m.minutes).join('\n'),
                          }),
                        });
                        const data = await res.json();
                        setAiManagerBrief(data.result);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setAiLoading(false);
                      }
                    }}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs disabled:opacity-50"
                  >
                    {aiLoading ? 'Generating...' : 'Executive Brief for Manager'}
                  </button>
                </div>

                {aiSuggestMsg && (
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      Suggested Follow-up Action
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-xs leading-relaxed font-mono">
                      {aiSuggestMsg}
                    </p>
                  </div>
                )}

                {aiManagerBrief && (
                  <div className="p-3 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                      Executive Deal Summary
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line text-xs leading-relaxed">
                      {aiManagerBrief}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log MoM Modal */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg crm-card p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Log Minutes of Meeting (MoM)</span>
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMeeting} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Meeting Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={meetDate}
                    onChange={(e) => setMeetDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Interaction Type
                  </label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value as MeetingType)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="In-person">In-person Dealership Visit</option>
                    <option value="Online Demo">Online Demo / Google Meet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attendees (Client & iFleon)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh (Owner), Nikhil (iFleon)"
                  value={meetAttendees}
                  onChange={(e) => setMeetAttendees(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Discussion Points & Client Remarks *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Summarize key pain points, inventory size, requested features, and client commitments..."
                  value={meetMinutes}
                  onChange={(e) => setMeetMinutes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Next Action Item / Commitment
                </label>
                <input
                  type="text"
                  placeholder="e.g. Send revised quotation with WhatsApp integration included"
                  value={meetNextAction}
                  onChange={(e) => setMeetNextAction(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateFollowUpDate}
                    onChange={(e) => setUpdateFollowUpDate(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Update lead follow-up date to:
                  </span>
                </label>
                {updateFollowUpDate && (
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 font-mono"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-semibold shadow-xs"
                >
                  Save Meeting Minutes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Won Deal Prompt Modal */}
      {isWonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md crm-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark Deal as Won</span>
            </h3>
            <p className="text-xs text-slate-500">
              Per iFleon CRM requirements, final deal amount is strictly required when a lead is marked Won.
            </p>

            <form onSubmit={handleConfirmWon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Final Closed Deal Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 85000"
                  value={wonAmountInput}
                  onChange={(e) => setWonAmountInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Go-Live / Project Start Date
                </label>
                <input
                  type="date"
                  value={wonStartDateInput}
                  onChange={(e) => setWonStartDateInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsWonModalOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Confirm Deal Won
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Deal Prompt Modal */}
      {isLostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md crm-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Mark Deal as Lost</span>
            </h3>
            <p className="text-xs text-slate-500">
              Reason for lost is mandatory for management review and loss-rate analytics.
            </p>

            <form onSubmit={handleConfirmLost} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Lost *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Budget constraints, opted for competitor, dealership closed..."
                  value={lostReasonInput}
                  onChange={(e) => setLostReasonInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsLostModalOpen(false)}
                  className="px-3 py-1.5 rounded text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Confirm Deal Lost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
