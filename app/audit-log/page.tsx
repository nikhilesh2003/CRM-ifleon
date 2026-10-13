'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/context/CRMContext';
import { AuditLogEntry } from '@/lib/types';
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  Briefcase,
  FileCheck2,
} from 'lucide-react';

export default function AuditLogPage() {
  const { currentUser } = useCRM();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [entityFilter, setEntityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        if (data.auditLogs) setLogs(data.auditLogs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);

  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager';

  if (!isAuthorized) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-slate-500">
          The system audit log is accessible only to Administrators and Managers (read-only). Consultants do not have access. Switch your role using the top bar to inspect audit logs.
        </p>
      </div>
    );
  }

  const filteredLogs = logs.filter((log) => {
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    const matchesSearch =
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityName.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase());

    return matchesEntity && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Activity & System Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of system actions: stage changes, deal approvals, quotations, and account reassignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
            {currentUser.role === 'admin' ? (
              <>
                <Shield className="w-3.5 h-3.5 text-blue-600" /> Admin Full Audit
              </>
            ) : (
              <>
                <Briefcase className="w-3.5 h-3.5 text-blue-600" /> Manager Read-Only
              </>
            )}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="crm-card p-3.5 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-900/50">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search user, action, details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Filter Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="py-1.5 px-2.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="all">All Entities</option>
            <option value="Lead">Leads</option>
            <option value="Quotation">Quotations</option>
            <option value="Meeting">Meetings</option>
            <option value="User">Users</option>
            <option value="Project">Projects</option>
            <option value="Settings">Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="crm-card overflow-hidden">
        <table className="crm-table w-full text-left text-xs">
          <thead>
            <tr>
              <th className="py-2.5 px-3">Timestamp</th>
              <th className="py-2.5 px-3">User & Role</th>
              <th className="py-2.5 px-3">Action</th>
              <th className="py-2.5 px-3">Entity</th>
              <th className="py-2.5 px-3">Change Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No activity matching current filters.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap text-[11px] tabular-nums">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {log.userName}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {log.entityType}: {log.entityName}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
