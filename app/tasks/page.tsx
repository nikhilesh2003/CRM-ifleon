'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCRM } from '@/context/CRMContext';
import { TaskItem, Lead } from '@/lib/types';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  Building2,
  PhoneCall,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';

export default function TasksPage() {
  const { currentUser } = useCRM();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const fetchTasksAndLeads = async () => {
    try {
      const [resTasks, resLeads] = await Promise.all([
        fetch('/api/tasks').then((r) => r.json()),
        fetch('/api/leads').then((r) => r.json()),
      ]);
      if (resTasks.tasks) setTasks(resTasks.tasks);
      if (resLeads.leads) setLeads(resLeads.leads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasksAndLeads();
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Due today follow-up leads
  const dueTodayLeads = leads.filter(
    (l) => l.followUpDate === todayStr && l.status !== 'Won' && l.status !== 'Lost'
  );

  // Overdue follow-up leads
  const overdueLeads = leads.filter(
    (l) => l.followUpDate < todayStr && l.status !== 'Won' && l.status !== 'Lost'
  );

  const handleToggleTask = async (taskId: string, currentCompleted: boolean) => {
    try {
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, completed: !currentCompleted }),
      });
      fetchTasksAndLeads();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          dueDate: newTaskDueDate,
          leadId: selectedLeadId || undefined,
          priority,
          consultantId: currentUser.id,
          currentUser,
        }),
      });
      setNewTaskTitle('');
      fetchTasksAndLeads();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-blue-600" />
          <span>Follow-up Reminders & Daily Agenda</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Client follow-up notifications, overdue task warnings, and action item checklist
        </p>
      </div>

      {/* Due Today & Overdue Priority Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Due Today List */}
        <div className="crm-card p-4 space-y-3 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center justify-between border-b border-amber-200/60 dark:border-amber-900/40 pb-2">
            <h2 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Follow-ups Due Today ({dueTodayLeads.length})</span>
            </h2>
            <span className="text-xs font-mono text-amber-800 dark:text-amber-400 font-bold tabular-nums">
              {todayStr}
            </span>
          </div>

          {dueTodayLeads.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              No follow-ups due today. You are fully on schedule!
            </p>
          ) : (
            <div className="space-y-2">
              {dueTodayLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-md bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 shadow-xs flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600"
                    >
                      {lead.businessName}
                    </Link>
                    <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {lead.contactPerson}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {lead.location}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${lead.phone}`}
                      className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-medium text-[11px] flex items-center gap-1 shadow-xs transition"
                    >
                      <PhoneCall className="w-3 h-3 text-emerald-400" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] shadow-xs transition"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue List */}
        <div className="crm-card p-4 space-y-3 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-900/40 pb-2">
            <h2 className="font-bold text-xs uppercase tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Overdue Follow-ups ({overdueLeads.length})</span>
            </h2>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Action Required</span>
          </div>

          {overdueLeads.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center">
              No overdue leads. Pipeline is cleanly managed!
            </p>
          ) : (
            <div className="space-y-2">
              {overdueLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-3 rounded-md bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 shadow-xs flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600"
                    >
                      {lead.businessName}
                    </Link>
                    <p className="text-[11px] text-rose-600 font-mono tabular-nums mt-0.5">
                      Missed date: {lead.followUpDate} • Consultant: {lead.consultantName}
                    </p>
                  </div>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] shadow-xs transition"
                  >
                    Reschedule
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tasks & To-Dos Management */}
      <div className="crm-card p-5 space-y-4">
        <div className="crm-card-header pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Daily Tasks & Action Items
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Create and track action items linked to dealership prospects and campaigns
            </p>
          </div>
        </div>

        {/* Create Task Form */}
        <form onSubmit={handleCreateTask} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <input
            type="text"
            required
            placeholder="What needs to be done? (e.g. Call Rajesh regarding demo)..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="sm:col-span-2 px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          />

          <select
            value={selectedLeadId}
            onChange={(e) => setSelectedLeadId(e.target.value)}
            className="px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="">Link to Lead (Optional)...</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.businessName}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
              className="w-full px-2 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono text-xs tabular-nums"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Task List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 pt-1">
          {tasks.length === 0 ? (
            <p className="text-center py-8 text-slate-400 text-xs">No tasks recorded.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => handleToggleTask(task.id, task.completed)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span
                      className={`font-medium block ${
                        task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.leadBusinessName && (
                      <span className="text-[11px] text-blue-600 dark:text-blue-400">
                        Dealership: {task.leadBusinessName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                    Due: {task.dueDate}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'high'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : task.priority === 'medium'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
