'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { UserRole } from '@/lib/types';
import {
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loginWithGoogle, isDark } = useCRM();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('consultant');
  const [department, setDepartment] = useState('Automobile Strategy');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Full name, corporate email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    const res = await register({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '+91 98480 00000',
      role,
      department: department.trim(),
      password: password.trim(),
      rememberMe,
    });
    setIsLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage('');
    setIsGoogleLoading(true);
    const res = await loginWithGoogle({
      email: email.trim() || 'rajesh.kumar@ifleon.com',
      name: name.trim() || 'Rajesh Kumar',
      rememberMe,
    });
    setIsGoogleLoading(false);

    if (res.success) {
      router.push('/');
    } else {
      setErrorMessage(res.error || 'Google SSO registration failed.');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <div className="bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-xl overflow-hidden">
        {/* Brand Header */}
        <div className="px-6 pt-8 pb-6 border-b border-slate-100 dark:border-[#1E2A3E] text-center bg-slate-50/50 dark:bg-[#172132]/30">
          <div className="h-10 flex items-center justify-center mb-4">
            <img
              src={isDark ? '/logo-dark-horizontal.png' : '/logo-light-horizontal.png'}
              alt="iFleon Intelligent Frameworks"
              className="h-9 w-auto object-contain"
            />
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold tracking-wider uppercase text-blue-700 dark:text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Personnel Registration</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            Create Enterprise Account
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Register your credentials to start managing leads and quotations
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-6 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="e.g. Arun Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="name@ifleon.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Mobile / WhatsApp
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="+91 98480 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Role and Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Assigned Role
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                >
                  <option value="consultant">Consultant (Field Sales)</option>
                  <option value="manager">Manager (Approvals)</option>
                  <option value="admin">Admin (Full Control)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Department / Unit
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Automobile Strategy"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>
          </div>

          {/* Password with Eye Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Password (minimum 6 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password with Eye Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 pointer-events-none" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-300 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="pt-1 flex items-start gap-2.5">
            <input
              id="register-remember-checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="register-remember-checkbox" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Keep me signed in for 30 days
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:bg-blue-400 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition mt-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* SSO Divider */}
        <div className="px-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#1E2A3E]"></div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
            Or Sign Up With Google
          </span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-[#1E2A3E]"></div>
        </div>

        {/* Google SSO Button */}
        <div className="p-6 pt-4">
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isLoading || isGoogleLoading}
            className="w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-[#1E2A3E] bg-white dark:bg-[#172132] hover:bg-slate-50 dark:hover:bg-[#1D2B40] text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2.5 transition shadow-xs cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign Up with Google SSO</span>
              </>
            )}
          </button>
        </div>

        {/* Login Link Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#0B0F19] border-t border-slate-200 dark:border-[#1E2A3E] text-center text-xs text-slate-600 dark:text-slate-400">
          <span>Already registered? </span>
          <Link
            href="/login"
            className="text-blue-700 dark:text-blue-400 font-semibold hover:underline"
          >
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
}
