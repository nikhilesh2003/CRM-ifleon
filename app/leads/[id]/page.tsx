'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { Lead, MeetingNote, TaskItem, GeneratedDocument, MeetingType } from '@/lib/types';
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
} from 'lucide-react';

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
      <div className="p-8 text-center text-slate-500">
        Loading lead details...
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-rose-500 font-bold">Lead record not found.</p>
        <Link href="/leads" className="text-blue-500 underline text-sm">
          Return to lead log
        </Link>
      </div>
    );
  }

  const isConsultant = currentUser.role === 'consultant';
  const isManager = currentUser.role === 'manager';
  const isAdmin = currentUser.role === 'admin';
  const canEdit = isAdmin || isManager || lead.consultantId === currentUser.id;

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

  // Toggle Task Completed
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

  // Consultant Reassignment by Manager or Admin
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Lead Log</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          Lead ID: {lead.id}
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {lead.businessName}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  lead.status === 'Won'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : lead.status === 'Lost'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {lead.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 pt-1">
              <span>👤 <strong>{lead.contactPerson}</strong></span>
              <span>📍 {lead.location}</span>
              <span>🏷️ Source: {lead.leadSource}</span>
              <span>📁 Campaign: {lead.projectName || 'General'}</span>
            </p>
          </div>

          {/* Quick Communication Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${lead.phone}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
              title="Click to call contact"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call ({lead.phone})</span>
            </a>

            <a
              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition"
              title="Open WhatsApp chat"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <Link
              href={`/quotations/new?leadId=${lead.id}`}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>New Quotation / Proposal</span>
            </Link>
          </div>
        </div>

        {/* Ownership & Manager Review Bar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500">Assigned Consultant:</span>
            {isAdmin || isManager ? (
              <select
                value={lead.consultantId}
                onChange={(e) => handleReassignConsultant(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200"
                title="Reassign to another consultant (Admin/Manager only)"
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
            <span className="text-slate-400">• Follow-up: <strong>{lead.followUpDate}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">Manager Review:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                lead.managerReview === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : lead.managerReview === 'Needs changes'
                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}
            >
              {lead.managerReview}
            </span>
          </div>
        </div>
      </div>

      {/* AI Assistance Toolbar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/20 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-bold text-sky-200">AI Assistants:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSuggestFollowUp}
            disabled={aiLoading}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-sky-300" />
            <span>Suggest Follow-up Text</span>
          </button>

          <button
            onClick={handleSummarizeBrief}
            disabled={aiLoading}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/15 transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Generate Executive Brief</span>
          </button>
        </div>
      </div>

      {/* AI Suggestion Box (If generated) */}
      {aiSuggestMsg && (
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-sky-800 dark:text-sky-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Ready-to-Send Follow-up Message
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(aiSuggestMsg);
                alert('Copied message to clipboard!');
              }}
              className="text-xs px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900 text-sky-900 dark:text-sky-200"
            >
              Copy Text
            </button>
          </div>
          <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-3 rounded-xl border border-sky-200 dark:border-sky-900">
            {aiSuggestMsg}
          </p>
        </div>
      )}

      {/* AI Executive Brief Box (If generated) */}
      {aiManagerBrief && (
        <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-300 dark:border-indigo-800 space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold text-indigo-800 dark:text-indigo-300">
            <span className="flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4" /> AI Manager Brief
            </span>
            <button
              onClick={() => setAiManagerBrief(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
          <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-sans bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 leading-relaxed">
            {aiManagerBrief}
          </div>
        </div>
      )}

      {/* Grid: MoM Timeline & Tasks/Review Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Meeting Notes (MoM) Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>Meeting Notes Timeline (MoM)</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Chronological history of calls, visits, and decisions (newest first)
                </p>
              </div>

              <button
                onClick={() => setIsMeetingModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Meeting (MoM)</span>
              </button>
            </div>

            {/* Initial Lead Notes */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Initial Lead Context:
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {lead.notes || 'No initial notes logged.'}
              </p>
            </div>

            {/* Meetings list */}
            {meetings.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No meetings or MoM recorded yet. Click "Log Meeting" to add one.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {meetings.map((meeting, index) => (
                  <div
                    key={meeting.id}
                    className="relative pl-6 pb-4 border-l-2 border-blue-500/40 last:border-transparent last:pb-0"
                  >
                    {/* Circle Node */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900 shadow"></div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {meeting.type} Meeting
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold">
                            {meeting.meetingDateTime.slice(0, 10)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Added by: {meeting.addedByName}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        <strong>Attendees:</strong> {meeting.attendees}
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        {meeting.minutes}
                      </div>

                      {meeting.nextAction && (
                        <div className="text-xs text-blue-700 dark:text-blue-300 font-semibold bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200 dark:border-blue-900 flex items-center gap-1.5">
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Next Action: {meeting.nextAction}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quotations & Proposals generated for this lead */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <span>Quotations & Proposals ({documents.length})</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Commercial quotes and formal proposals with versioning
                </p>
              </div>

              <Link
                href={`/quotations/new?leadId=${lead.id}`}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Quote / PPTX</span>
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
                        <span className="font-bold text-slate-900 dark:text-white">
                          {doc.docNumber}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {doc.type}
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
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {doc.status}
                      </span>
                      <Link
                        href={`/quotations?docId=${doc.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
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

        {/* Right Col: Tasks & Manager Review Panel */}
        <div className="space-y-6">
          {/* Manager Review Box */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                <span>Manager Review & Feedback</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {lead.managerReview}
              </span>
            </div>

            {/* Display feedback */}
            {lead.managerComment && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Manager Feedback:
                </span>
                <p className="text-slate-600 dark:text-slate-400 italic">
                  "{lead.managerComment}"
                </p>
              </div>
            )}

            {/* Manager review actions (Only for Manager & Admin) */}
            {(isAdmin || isManager) ? (
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manager Comment / Feedback:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter review notes or requested revisions..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  ></textarea>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManagerReviewSubmit('Approved')}
                    disabled={isReviewSubmitting}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
                  >
                    Approve Lead
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
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Manager reviews and approves leads when status reaches Won or Lost.
              </p>
            )}
          </div>

          {/* Tasks & Follow-up To-Dos */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Tasks & To-Dos</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {tasks.filter((t) => !t.completed).length} pending
              </span>
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="space-y-2">
              <input
                type="text"
                placeholder="New follow-up task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex-shrink-0"
                >
                  Add
                </button>
              </div>
            </form>

            {/* Tasks list */}
            <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
              {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No tasks added yet.</p>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs"
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
                <span>Log Meeting Notes (Minutes of Meeting)</span>
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
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
                    Meeting Type
                  </label>
                  <select
                    value={meetType}
                    onChange={(e) => setMeetType(e.target.value as MeetingType)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Call">Call</option>
                    <option value="Visit">Showroom Visit</option>
                    <option value="Video meeting">Video Meeting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Attendees (Free Text)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Reddy (Owner), Nikhil Varma (iFleon)"
                  value={meetAttendees}
                  onChange={(e) => setMeetAttendees(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Meeting Minutes (Typed Rich Text)
                  </label>
                  <button
                    type="button"
                    onClick={handleTidyMinutes}
                    disabled={aiLoading || !meetMinutes.trim()}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 disabled:opacity-40"
                    title="Clean typed notes into bullet points"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>AI Tidy Minutes</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="Type notes, client specs, feedback, topics discussed..."
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
                  placeholder="e.g. Send updated quotation with EMI calculator module"
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
                  Save Meeting Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
