'use client';

import React, { useState, useEffect } from 'react';
import { useCRM } from '@/context/CRMContext';
import { User, UserRole } from '@/lib/types';
import {
  UserCog,
  Plus,
  Shield,
  Briefcase,
  UserCheck,
  KeyRound,
  Ban,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react';

export default function UserManagementPage() {
  const { currentUser } = useCRM();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('consultant');

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500">
          User management is restricted to Administrators only. Use the role switcher in the header to switch to Rajesh Kumar (Admin).
        </p>
      </div>
    );
  }

  const handleToggleDisable = async (user: User) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, disabled: !user.disabled, currentUser }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, role: newRole, currentUser }),
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetPassword = async (user: User) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, action: 'reset_password', currentUser }),
      });
      alert(`Password reset link dispatched to ${user.email}`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role, currentUser }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setName('');
        setEmail('');
        setPhone('');
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-purple-500" />
            <span>User & Access Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Invite colleagues, disable users, reset passwords and assign CRM roles (Admin only)
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Invite New User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="p-3.5">User Profile</th>
              <th className="p-3.5">Email & Phone</th>
              <th className="p-3.5">Role</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/50">
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs">
                      {u.name[0]}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {u.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {u.id}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="text-slate-700 dark:text-slate-300">{u.email}</div>
                  <div className="text-slate-400 font-mono text-[11px]">{u.phone}</div>
                </td>

                <td className="p-3.5">
                  <select
                    value={u.role}
                    onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                    className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-xs"
                  >
                    <option value="admin">👑 Admin</option>
                    <option value="manager">👔 Manager</option>
                    <option value="consultant">🎯 Consultant</option>
                  </select>
                </td>

                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.disabled
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {u.disabled ? 'Disabled' : 'Active'}
                  </span>
                </td>

                <td className="p-3.5 text-right space-x-2">
                  <button
                    onClick={() => handleResetPassword(u)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold"
                    title="Send password reset email"
                  >
                    Reset Password
                  </button>

                  <button
                    onClick={() => handleToggleDisable(u)}
                    className={`px-2.5 py-1 rounded-lg font-semibold ${
                      u.disabled
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                    }`}
                  >
                    {u.disabled ? 'Enable' : 'Disable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Invite User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Invite & Create New Team Member
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Reddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@ifleon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 94400 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned CRM Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="consultant">🎯 Consultant (Manage own leads & quotes)</option>
                  <option value="manager">👔 Manager (Review work, approve leads, campaigns)</option>
                  <option value="admin">👑 Admin (Full system control)</option>
                </select>
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
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
