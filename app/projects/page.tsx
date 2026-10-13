'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/context/CRMContext';
import { Project, User, Lead } from '@/lib/types';
import {
  FolderKanban,
  Plus,
  Users,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { currentUser } = useCRM();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [clientOrCampaign, setClientOrCampaign] = useState('');
  const [description, setDescription] = useState('');
  const [assignedConsultants, setAssignedConsultants] = useState<string[]>([]);

  const fetchProjectData = async () => {
    try {
      const [resProj, resUsers, resLeads] = await Promise.all([
        fetch('/api/projects').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/leads').then((r) => r.json()),
      ]);
      if (resProj.projects) setProjects(resProj.projects);
      if (resUsers.users) setUsers(resUsers.users.filter((u: User) => u.role === 'consultant'));
      if (resLeads.leads) setLeads(resLeads.leads);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  if (!currentUser) return null;
  const isManagerOrAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          clientOrCampaign,
          description,
          assignedConsultantIds: assignedConsultants,
          currentUser,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setClientOrCampaign('');
        setDescription('');
        setAssignedConsultants([]);
        fetchProjectData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleConsultantAssignment = (consultantId: string) => {
    if (assignedConsultants.includes(consultantId)) {
      setAssignedConsultants(assignedConsultants.filter((id) => id !== consultantId));
    } else {
      setAssignedConsultants([...assignedConsultants, consultantId]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <span>Projects & Regional Campaigns</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Group dealership accounts by territory campaign and allocate sales consultants
          </p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign Project</span>
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const projectLeads = leads.filter((l) => l.projectId === project.id);
          const wonLeads = projectLeads.filter((l) => l.status === 'Won');
          const totalWonValue = wonLeads.reduce((acc, l) => acc + (l.finalDealAmount || 0), 0);

          return (
            <div
              key={project.id}
              className="crm-card p-5 space-y-3.5"
            >
              <div className="flex items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {project.clientOrCampaign}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {project.name}
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {project.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.description}
              </p>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Total Deals</span>
                  <strong className="text-base text-slate-900 dark:text-white font-mono font-bold tabular-nums">{projectLeads.length}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Closed Won</span>
                  <strong className="text-base text-emerald-600 dark:text-emerald-400 font-mono font-bold tabular-nums">{wonLeads.length}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block font-semibold uppercase tracking-wider">Won Revenue</span>
                  <strong className="text-base text-blue-600 dark:text-blue-400 font-mono font-bold tabular-nums">₹{(totalWonValue / 1000).toFixed(0)}k</strong>
                </div>
              </div>

              {/* Assigned Consultants */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">
                    {project.assignedConsultantIds.length} Assigned Consultant(s)
                  </span>
                </div>

                <Link
                  href={`/leads`}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-xs"
                >
                  <span>View Leads</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl p-5 space-y-4">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Create New Campaign / Project
              </h3>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Project / Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Premium Pre-Owned Showrooms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Regional Pre-Owned Dealerships"
                  value={clientOrCampaign}
                  onChange={(e) => setClientOrCampaign(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description & Scope Goals
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline targets and geographical strategy..."
                  className="w-full px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assign Consultants
                </label>
                <div className="space-y-1 p-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                  {users.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white dark:hover:bg-slate-700 rounded">
                      <input
                        type="checkbox"
                        checked={assignedConsultants.includes(c.id)}
                        onChange={() => toggleConsultantAssignment(c.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-800 dark:text-slate-200">{c.name} ({c.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-xs transition"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
