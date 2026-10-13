'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
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
  Sparkles,
  MessageSquare,
  Plus,
  Send,
  FileCheck2,
  Paperclip,
  Share2,
  Edit3,
  UserCheck,
  ChevronLeft,
  ArrowRight,
  Download,
  Phone,
  MapPin,
  Briefcase,
  User,
  Compass,
  Video,
  Presentation,
  Check,
  XCircle,
  AlertCircle,
  Copy,
  X,
} from 'lucide-react';

const LIFECYCLE_STAGES: LeadStatus[] = [
  'New / Contacted',
  'Interested / Follow-up',
  'Proposal sent / Negotiation',
  'Won',
  'Lost',
];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, allUsers } = useCRM();

  const [lead, setLead] = useState<Lead | null>(null);
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);

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
    const summary = `🏢 Dealership: ${lead.businessName}\n👤 Contact: ${lead.contactPerson}\n📞 Phone: ${lead.phone}\n📍 Location: ${lead.location}\n📊 Status: ${lead.status}\n📅 Next Follow-up: ${lead.followUpDate}\n👔 Consultant: ${lead.consultantName}`;
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
        Loading lead record...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-semibold text-sm">Lead record not found.</p>
        <Link href="/leads" className="text-blue-500 underline text-xs">
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
      alert('You only have permission to edit leads assigned to you.');
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
      fetchLeadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Won Status
  const handleConfirmWon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wonAmountInput || Number(wonAmountInput) <= 0) {
      alert('Final deal amount is required when status is Won.');
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
      fetchLeadData();
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Lost Status
  const handleConfirmLost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lostReasonInput) {
      alert('Lost reason is required when status is Lost.');
      return;
    }

    try {
      await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Lost',
          lostReason: lostReasonInput,
          currentUser,
        }),
      });
      setIsLostModalOpen(false);
      fetchLeadData();
    } catch (e) {
      console.error(e);
    }
  };

  // AI Action 1: Suggest Follow-up Message
  const handleSuggestFollowUp = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest-follow-up', leadId: lead.id }),
      });
      const data = await res.json();
      if (data.message) {
        setAiSuggestMsg(data.message);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Action 2: Summarize Lead for Manager
  const handleSummarizeBrief = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize-lead', leadId: lead.id }),
      });
      const data = await res.json();
      if (data.summary) {
        setAiManagerBrief(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Action 3: Tidy Typed Meeting Minutes
  const handleTidyMinutes = async () => {
    if (!meetMinutes.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tidy-minutes', minutes: meetMinutes }),
      });
      const data = await res.json();
      if (data.tidied) {
        setMeetMinutes(data.tidied);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  // Log Meeting Note submit
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          meetingDateTime: meetDate,
          type: meetType,
          attendees: meetAttendees,
          minutes: meetMinutes,
          nextAction: meetNextAction,
          updateFollowUpDate,
          newFollowUpDate,
          currentUser,
        }),
      });
      if (res.ok) {
        setIsMeetingModalOpen(false);
        setMeetMinutes('');
        setMeetAttendees('');
        setMeetNextAction('');
        fetchLeadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Task submit
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          consultantId: lead.consultantId,
          title: newTaskTitle,
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

  // Manager Review Action (Approve / Needs changes)
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
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Lead Pipeline</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Ref: {lead.id}
        </span>
      </div>

      {/* SuiteCRM-style Pipeline Lifecycle Stepper */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-semibold uppercase tracking-wider text-[10px]">Sales Stage Progression:</span>
          <span>Click to advance lifecycle stage</span>
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
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {stage === 'New / Contacted' && <Users className="w-3.5 h-3.5" />}
                {stage === 'Interested / Follow-up' && <Clock className="w-3.5 h-3.5" />}
                {stage === 'Proposal sent / Negotiation' && <FileText className="w-3.5 h-3.5" />}
                {stage === 'Won' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                {stage === 'Lost' && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                <span>{stage}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dealership Overview Banner */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {lead.businessName}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold uppercase ${
                  lead.status === 'Won'
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : lead.status === 'Lost'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                }`}
              >
                {lead.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 pt-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <strong className="text-slate-700 dark:text-slate-300">{lead.contactPerson}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {lead.location}
              </span>
              <span className="flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-slate-400" />
                Source: {lead.leadSource}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Campaign: {lead.projectName || 'General'}
              </span>
            </div>
          </div>

          {/* Quick Actions (Call, WhatsApp, Copy, Quotation) */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyLeadSummary}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1.5 transition"
              title="Copy formatted profile for WhatsApp/Slack"
            >
              {isCopiedLead ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>

            <a
              href={`tel:${lead.phone}`}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
              title="Click to call contact"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call ({lead.phone})</span>
            </a>

            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
              title="Open WhatsApp chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <Link
              href={`/quotations/new?leadId=${lead.id}`}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>New Quotation / PPTX</span>
            </Link>
          </div>
        </div>

        {/* Ownership & Review Status Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Assigned Consultant:</span>
            {isAdmin || isManager ? (
              <select
                value={lead.consultantId}
                onChange={(e) => handleReassignConsultant(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900 dark:text-white">
                {lead.consultantName}
              </span>
            )}
            <span className="text-slate-400 font-mono">
              Next Follow-up: <strong>{lead.followUpDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Manager Review:</span>
            <span
              className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                lead.managerReview === 'Approved'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : lead.managerReview === 'Needs changes'
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              }`}
            >
              {lead.managerReview}
            </span>
          </div>
        </div>
      </div>

      {/* Main SuiteCRM-style 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Meeting Notes (MoM) & Quotations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meeting Notes (MoM) Timeline Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Meeting Notes Timeline (MoM)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chronological interaction log (calls, showroom visits, video meetings)
                </p>
              </div>

              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log MoM Meeting</span>
              </button>
            </div>

            {/* Initial Lead Notes */}
            {lead.notes && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Initial Dealership Notes:
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {lead.notes}
                </p>
              </div>
            )}

            {/* Meetings List */}
            {meetings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No meetings or MoM recorded yet. Click "Log MoM Meeting" to document a discussion.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {meetings.map((meeting) => {
                  let MeetingIcon = Phone;
                  if (meeting.type === 'Visit') MeetingIcon = Building2;
                  else if (meeting.type === 'Video meeting') MeetingIcon = Video;

                  return (
                    <div
                      key={meeting.id}
                      className="relative pl-6 pb-4 border-l-2 border-blue-500/40 last:border-transparent last:pb-0"
                    >
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900"></div>

                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <MeetingIcon className="w-3.5 h-3.5 text-blue-500" />
                              <span>{meeting.type} Session</span>
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                              {meeting.meetingDateTime.slice(0, 10)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Logged by: {meeting.addedByName}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          <strong>Attendees:</strong> {meeting.attendees}
                        </div>

                        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800 font-sans">
                          {meeting.minutes}
                        </div>

                        {meeting.nextAction && (
                          <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
                            <ArrowRight className="w-3.5 h-3.5" />
                            <span>Action Item: {meeting.nextAction}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quotations Subpanel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span>Quotations & Commercial Proposals ({documents.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generated PowerPoint presentations and comprehensive proposals
                </p>
              </div>

              <Link
                href={`/quotations/new?leadId=${lead.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quote / PPTX</span>
              </Link>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                No quotations generated yet for this dealership.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {doc.docNumber}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                          {doc.type} v{doc.version}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{doc.total.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-500 mt-0.5 line-clamp-1">
                        {doc.projectSummary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {doc.status}
                      </span>
                      <Link
                        href={`/quotations?docId=${doc.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        View / PPTX
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Commercial Summary, Manager Approvals & AI Copilot */}
        <div className="space-y-6">
          {/* Commercial Attributes Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Commercial Overview
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">Deal Value:</span>
                <strong className="text-slate-900 dark:text-white font-mono">
                  {lead.finalDealAmount ? `₹${lead.finalDealAmount.toLocaleString()}` : 'Pending Negotiation'}
                </strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500">Expected Close:</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono">
                  {lead.expectedCloseDate || 'Not specified'}
                </span>
              </div>
              {lead.startDate && (
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500">Project Launch Date:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono">{lead.startDate}</span>
                </div>
              )}
              {lead.lostReason && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  <strong>Lost Reason:</strong> {lead.lostReason}
                </div>
              )}
            </div>
          </div>

          {/* Manager Review Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                <span>Manager Review & Feedback</span>
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {lead.managerReview}
              </span>
            </div>

            {lead.managerComment && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Manager Feedback:
                </span>
                <p className="text-slate-600 dark:text-slate-400 italic">
                  "{lead.managerComment}"
                </p>
              </div>
            )}

            {(isAdmin || isManager) ? (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <textarea
                  rows={2}
                  placeholder="Enter manager feedback or requested revisions..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
                ></textarea>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManagerReviewSubmit('Approved')}
                    disabled={isReviewSubmitting}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
                  >
                    Approve Deal
                  </button>
                  <button
                    onClick={() => handleManagerReviewSubmit('Needs changes')}
                    disabled={isReviewSubmitting}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition"
                  >
                    Request Changes
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Manager reviews and sign-offs are submitted for Won and Lost lifecycle events.
              </p>
            )}
          </div>

          {/* AI Copilot Toolbar */}
          <div className="p-5 rounded-2xl bg-slate-900 dark:bg-[#0D131F] border border-blue-500/20 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>AI Sales Copilot</span>
              </span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleSuggestFollowUp}
                disabled={aiLoading}
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-sky-300" />
                <span>Draft Follow-up Message</span>
              </button>

              <button
                onClick={handleSummarizeBrief}
                disabled={aiLoading}
                className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FileCheck2 className="w-3.5 h-3.5 text-indigo-300" />
                <span>Generate Executive Brief</span>
              </button>
            </div>

            {aiSuggestMsg && (
              <div className="p-3 rounded-xl bg-white/5 border border-sky-400/30 text-xs space-y-2">
                <div className="flex justify-between items-center text-sky-300 font-semibold text-[11px]">
                  <span>Follow-up Draft</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiSuggestMsg);
                      alert('Copied to clipboard!');
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 hover:bg-sky-500/30"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="whitespace-pre-line text-slate-300 font-mono text-[11px] leading-relaxed">
                  {aiSuggestMsg}
                </p>
              </div>
            )}

            {aiManagerBrief && (
              <div className="p-3 rounded-xl bg-white/5 border border-indigo-400/30 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-indigo-300 font-semibold text-[11px]">
                  <span>Executive Brief</span>
                  <button onClick={() => setAiManagerBrief(null)} className="text-slate-400 hover:text-white" title="Close"><X className="w-3.5 h-3.5" /></button>
                </div>
                <p className="whitespace-pre-line text-slate-300 text-[11px] leading-relaxed">
                  {aiManagerBrief}
                </p>
              </div>
            )}
          </div>

          {/* Tasks & Action Checklist */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0B0F17] border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Action Items ({tasks.filter((t) => !t.completed).length})</span>
              </h3>
            </div>

            <form onSubmit={handleAddTask} className="space-y-2">
              <input
                type="text"
                placeholder="Add follow-up task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </form>

            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No tasks logged.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id, task.completed)}
                      className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className={`block ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Due: {task.dueDate}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Log Meeting Note (MoM) */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Log Minutes of Meeting (MoM)</span>
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Session Type
                  </label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value as MeetingType)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Visit">Showroom Visit</option>
                    <option value="Video meeting">Video Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attendees
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Reddy (Managing Director), Nikhil Varma (iFleon)"
                  value={meetAttendees}
                  onChange={(e) => setMeetAttendees(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Discussion Minutes
                  </label>
                  <button
                    type="button"
                    onClick={handleTidyMinutes}
                    disabled={aiLoading || !meetMinutes.trim()}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-40"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Tidy Minutes</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Type notes, client specs, vehicle inventory details..."
                  value={meetMinutes}
                  onChange={(e) => setMeetMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-sans leading-relaxed focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Next Action
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dispatch quotation with EMI financing module"
                  value={meetNextAction}
                  onChange={(e) => setMeetNextAction(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateFollowUpDate}
                    onChange={(e) => setUpdateFollowUpDate(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Update lead follow-up date directly from this action
                  </span>
                </label>
                {updateFollowUpDate && (
                  <input
                    type="date"
                    value={newFollowUpDate}
                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow"
                >
                  Save Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Won Stage Confirmation Modal */}
      {isWonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Mark Deal as Won (Closed)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Moving to Won stage requires the final contract amount and start date for audit & revenue tracking.
            </p>

            <form onSubmit={handleConfirmWon} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Final Deal Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 95000"
                  value={wonAmountInput}
                  onChange={(e) => setWonAmountInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={wonStartDateInput}
                  onChange={(e) => setWonStartDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsWonModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Confirm Won Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Stage Confirmation Modal */}
      {isLostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Mark Deal as Lost</span>
            </h3>
            <p className="text-xs text-slate-500">
              Moving to Lost stage requires recording the primary loss factor for sales reporting.
            </p>

            <form onSubmit={handleConfirmLost} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lost Reason *
                </label>
                <select
                  required
                  value={lostReasonInput}
                  onChange={(e) => setLostReasonInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">Select Reason...</option>
                  <option value="Price too high">Price too high</option>
                  <option value="Competitor chosen">Competitor chosen</option>
                  <option value="Delayed timeline">Delayed timeline</option>
                  <option value="Scope mismatch">Scope mismatch</option>
                  <option value="No response / Ghosted">No response / Ghosted</option>
                  <option value="Budget cancelled">Budget cancelled</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsLostModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Confirm Lost Stage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
