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
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-500" />
            <span>Projects & Outreach Campaigns</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Group dealership leads by campaign region and assign sales consultants (Admin & Manager)
          </p>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Campaign Project</span>
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => {
          const projectLeads = leads.filter((l) => l.projectId === project.id);
          const wonLeads = projectLeads.filter((l) => l.status === 'Won');
          const totalWonValue = wonLeads.reduce((acc, l) => acc + (l.finalDealAmount || 0), 0);

          return (
            <div
              key={project.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {project.clientOrCampaign}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                    {project.name}
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {project.status}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {project.description}
              </p>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Leads</span>
                  <strong className="text-base text-slate-900 dark:text-white font-black">{projectLeads.length}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Closed Won</span>
                  <strong className="text-base text-emerald-600 dark:text-emerald-400 font-black">{wonLeads.length}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Won Revenue</span>
                  <strong className="text-base text-blue-600 dark:text-blue-400 font-black">₹{(totalWonValue / 1000).toFixed(0)}k</strong>
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
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>View Leads</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Campaign */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Create New Campaign / Project
            </h3>

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Project / Campaign Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabad Premium Pre-Owned Showrooms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Client / Campaign Target Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Regional Used Car Dealers"
                  value={clientOrCampaign}
                  onChange={(e) => setClientOrCampaign(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description & Scope Goals
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline targets and geographical strategy..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign Consultants
                </label>
                <div className="space-y-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {users.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer p-1">
                      <input
                        type="checkbox"
                        checked={assignedConsultants.includes(c.id)}
                        onChange={() => toggleConsultantAssignment(c.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>{c.name} ({c.email})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold"
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
