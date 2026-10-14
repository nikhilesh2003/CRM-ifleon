'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import {
  CompanySettings,
  CRMTheme,
  AIProviderConfig,
  StandardScopeModule,
  PriceListItem,
  EmailConfig,
  EmailLogEntry,
} from '@/lib/types';
import {
  Settings,
  Sparkles,
  Building2,
  Cpu,
  Palette,
  CheckCircle,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layers,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Check,
  Search,
  Bell,
  Sun,
  Moon,
  Loader2,
  Mail,
  Send,
  Key,
  ShieldCheck,
  Server,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Globe,
} from 'lucide-react';

export default function AdminSettingsWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading Settings...</div>}>
      <AdminSettingsPage />
    </Suspense>
  );
}

function AdminSettingsPage() {
  const { currentUser, settings: ctxSettings, refreshSettings, theme: activeTheme, setTheme } = useCRM();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'company' | 'email' | 'theme' | 'ai' | 'scope' | 'price'>(
    (searchParams.get('tab') as any) || 'company'
  );

  // Settings state
  const [settings, setSettings] = useState<CompanySettings>({
    name: 'iFleon',
    tagline: 'Intelligent Frameworks. Powerful Execution.',
    address: 'Trunk Road Commercial Center',
    cityState: 'Nellore, Andhra Pradesh, India - 524001',
    phone: '+91 94900 12345',
    email: 'contact@ifleon.com',
    website: 'https://ifleon.com',
    quotationApprovalThreshold: 100000,
    horizontalLogoUrl: '/logo-light-horizontal.png',
    lightLogoUrl: '/logo-light-horizontal.png',
    darkLogoUrl: '/logo-dark-horizontal.png',
    iconLogoUrl: '/logo-icon.png',
  });

  // Email Configuration state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    provider: 'hostinger_smtp',
    apiKey: 'e251b100f6be8eb4caba9e20686d5716cd0a755de99247dfea6bde9746d77e3d',
    senderEmail: 'contact@ifleon.com',
    senderName: 'iFleon Corporate CRM',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: 465,
    smtpUser: 'contact@ifleon.com',
    smtpPass: 'e251b100f6be8eb4caba9e20686d5716cd0a755de99247dfea6bde9746d77e3d',
    enabled: true,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testRecipient, setTestRecipient] = useState('contact@ifleon.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    transport?: string;
    fallbackNotice?: string;
  } | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [themes, setThemes] = useState<CRMTheme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState('theme-default');
  const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
  const [scopeModules, setScopeModules] = useState<StandardScopeModule[]>([]);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Logo upload state
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [uploadSuccessSlot, setUploadSuccessSlot] = useState<string | null>(null);

  const lightFileRef = useRef<HTMLInputElement>(null);
  const darkFileRef = useRef<HTMLInputElement>(null);
  const iconFileRef = useRef<HTMLInputElement>(null);

  // AI Theme Generator State
  const [themePrompt, setThemePrompt] = useState('clean and professional, deep blue, rounded cards');
  const [aiGeneratedTheme, setAiGeneratedTheme] = useState<CRMTheme | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [resSettings, resMaster] = await Promise.all([
          fetch('/api/admin/settings').then((r) => r.json()),
          fetch('/api/admin/master-lists').then((r) => r.json()),
        ]);

        if (resSettings.settings) {
          setSettings(resSettings.settings);
          if (resSettings.settings.emailConfig) {
            setEmailConfig((prev) => ({ ...prev, ...resSettings.settings.emailConfig }));
          }
        }
        if (resSettings.themes) setThemes(resSettings.themes);
        if (resSettings.activeThemeId) setActiveThemeId(resSettings.activeThemeId);
        if (resSettings.aiProviders) setAiProviders(resSettings.aiProviders);
        if (resMaster.scopeModules) setScopeModules(resMaster.scopeModules);
        if (resMaster.priceList) setPriceList(resMaster.priceList);

        try {
          const emailRes = await fetch('/api/email').then((r) => r.json());
          if (emailRes.logs) setEmailLogs(emailRes.logs);
        } catch (_) {}
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  if (!currentUser) return null;
  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500">
          System configuration is restricted to Administrators only. Please sign in with an administrator account.
        </p>
      </div>
    );
  }

  // Handle Logo File Upload (reads Data URL and sends to server)
  const handleLogoUpload = async (file: File, slot: 'light' | 'dark' | 'icon') => {
    if (!file) return;
    setUploadingSlot(slot);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // Immediately update local preview
        if (slot === 'light') {
          setSettings((prev) => ({ ...prev, lightLogoUrl: dataUrl, horizontalLogoUrl: dataUrl }));
        } else if (slot === 'dark') {
          setSettings((prev) => ({ ...prev, darkLogoUrl: dataUrl }));
        } else if (slot === 'icon') {
          setSettings((prev) => ({ ...prev, iconLogoUrl: dataUrl }));
        }

        // Upload to server endpoint
        try {
          const res = await fetch('/api/admin/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: dataUrl,
              fileName: file.name,
              slot,
              currentUser,
            }),
          });
          const result = await res.json();
          if (result.url) {
            if (slot === 'light') {
              setSettings((prev) => ({ ...prev, lightLogoUrl: result.url, horizontalLogoUrl: result.url }));
            } else if (slot === 'dark') {
              setSettings((prev) => ({ ...prev, darkLogoUrl: result.url }));
            } else if (slot === 'icon') {
              setSettings((prev) => ({ ...prev, iconLogoUrl: result.url }));
            }
          }
        } catch (uploadErr) {
          console.warn('Server storage error, kept local data URI:', uploadErr);
        }

        setUploadSuccessSlot(slot);
        setTimeout(() => setUploadSuccessSlot(null), 3000);
        setUploadingSlot(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error reading file:', err);
      setUploadingSlot(null);
    }
  };

  // Handle Save Core Settings
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...settings,
            emailConfig,
          },
          activeThemeId,
          aiProviders,
          currentUser,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        await refreshSettings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Send Test Email
  const handleSendTestEmail = async () => {
    if (!testRecipient.trim()) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          recipient: testRecipient.trim(),
          config: emailConfig,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          message: `Verification message successfully dispatched to ${data.recipient}`,
          transport: data.transport,
          fallbackNotice: data.fallbackNotice,
        });
        if (data.log) {
          setEmailLogs((prev) => [data.log, ...prev]);
        }
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test verification email.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error while attempting email dispatch.',
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Handle Refresh Email Logs
  const handleRefreshEmailLogs = async () => {
    setLoadingLogs(true);
    try {
      const emailRes = await fetch('/api/email').then((r) => r.json());
      if (emailRes.logs) setEmailLogs(emailRes.logs);
    } catch (_) {}
    setLoadingLogs(false);
  };

  // Handle AI Theme Generation
  const handleGenerateAITheme = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-theme', prompt: themePrompt }),
      });
      const data = await res.json();
      if (data.theme) {
        setAiGeneratedTheme(data.theme);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(false);
    }
  };

  // Apply & Save Generated AI Theme
  const handleApplyAITheme = async () => {
    if (!aiGeneratedTheme) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newTheme: aiGeneratedTheme,
          activeThemeId: aiGeneratedTheme.id,
          currentUser,
        }),
      });
      if (res.ok) {
        setThemes([...themes, aiGeneratedTheme]);
        setActiveThemeId(aiGeneratedTheme.id);
        setTheme(aiGeneratedTheme);
        setAiGeneratedTheme(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Select Preset Theme
  const handleSelectTheme = (themeId: string) => {
    setActiveThemeId(themeId);
    const found = themes.find((t) => t.id === themeId);
    if (found) setTheme(found);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Enterprise System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage company profile, brand logos, AI providers, and commercial master lists
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">System settings and brand logos successfully saved across the platform!</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 dark:border-[#1E2A3E] pb-2">
        {[
          { id: 'company', label: 'Company Profile & Brand Logos', icon: Building2 },
          { id: 'email', label: 'Email & Messaging Integration', icon: Mail },
          { id: 'theme', label: 'Appearance & Theme Studio', icon: Palette },
          { id: 'ai', label: 'AI Fallback Chain & Keys', icon: Cpu },
          { id: 'scope', label: 'Standard Scope Master List', icon: Layers },
          { id: 'price', label: 'Commercial Price List', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#172132]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Company Profile & Brand Logos */}
      {activeTab === 'company' && (
        <div className="space-y-6">
          {/* BRAND LOGOS MANAGEMENT CARD */}
          <div className="crm-card p-5 space-y-5 bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-xs">
            <div className="border-b border-slate-100 dark:border-[#1E2A3E] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <span>Corporate Brand Assets & Logo Studio</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload, preview, and configure high-resolution logos for light mode, dark mode, and browser icons
                </p>
              </div>
            </div>

            {/* Three Logo Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Slot 1: Light Mode Horizontal Logo */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2A3E] bg-slate-50/50 dark:bg-[#172132]/30 flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Horizontal Logo (Light Mode)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                      Light Surface
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Used on light mode navbar, quotation printouts, and client proposals.
                  </p>

                  {/* Visual Preview on White Canvas */}
                  <div className="w-full h-24 rounded-lg bg-white border border-slate-200 flex items-center justify-center p-3 shadow-inner relative overflow-hidden group">
                    <img
                      src={settings.lightLogoUrl || settings.horizontalLogoUrl || '/logo-light-horizontal.png'}
                      alt="Light Logo Preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-[#1E2A3E]">
                  {/* Upload File Button */}
                  <input
                    type="file"
                    ref={lightFileRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleLogoUpload(e.target.files[0], 'light');
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingSlot === 'light'}
                      onClick={() => lightFileRef.current?.click()}
                      className="flex-1 py-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {uploadingSlot === 'light' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          lightLogoUrl: '/logo-light-horizontal.png',
                          horizontalLogoUrl: '/logo-light-horizontal.png',
                        }))
                      }
                      className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Reset to default transparent logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {uploadSuccessSlot === 'light' && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Light logo updated!</span>
                    </div>
                  )}

                  {/* Direct Path Input */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Or image URL / path:
                    </label>
                    <input
                      type="text"
                      value={settings.lightLogoUrl || settings.horizontalLogoUrl || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          lightLogoUrl: e.target.value,
                          horizontalLogoUrl: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-[#1E2A3E] bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Transparent Light', url: '/logo-light-horizontal.png' },
                        { label: 'Solid Light', url: '/logo-light-horizontal-solid.png' },
                        { label: 'Standard Horizontal', url: '/logo-horizontal.png' },
                      ].map((p) => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              lightLogoUrl: p.url,
                              horizontalLogoUrl: p.url,
                            }))
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] hover:border-blue-500 text-slate-700 dark:text-slate-300 transition"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 2: Dark Mode Horizontal Logo */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2A3E] bg-slate-50/50 dark:bg-[#172132]/30 flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Horizontal Logo (Dark Mode)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                      Dark Surface
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Used on dark mode navbar, dark executive login, and reports.
                  </p>

                  {/* Visual Preview on Dark Canvas */}
                  <div className="w-full h-24 rounded-lg bg-[#111925] border border-[#1E2A3E] flex items-center justify-center p-3 shadow-inner relative overflow-hidden group">
                    <img
                      src={settings.darkLogoUrl || '/logo-dark-horizontal.png'}
                      alt="Dark Logo Preview"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-[#1E2A3E]">
                  {/* Upload File Button */}
                  <input
                    type="file"
                    ref={darkFileRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleLogoUpload(e.target.files[0], 'dark');
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingSlot === 'dark'}
                      onClick={() => darkFileRef.current?.click()}
                      className="flex-1 py-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {uploadingSlot === 'dark' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          darkLogoUrl: '/logo-dark-horizontal.png',
                        }))
                      }
                      className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Reset to default transparent dark logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {uploadSuccessSlot === 'dark' && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Dark logo updated!</span>
                    </div>
                  )}

                  {/* Direct Path Input */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Or image URL / path:
                    </label>
                    <input
                      type="text"
                      value={settings.darkLogoUrl || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          darkLogoUrl: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-[#1E2A3E] bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Transparent Dark', url: '/logo-dark-horizontal.png' },
                        { label: 'Solid Dark', url: '/logo-dark-horizontal-solid.png' },
                      ].map((p) => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              darkLogoUrl: p.url,
                            }))
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] hover:border-blue-500 text-slate-700 dark:text-slate-300 transition"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Slot 3: Brand Icon / Favicon */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1E2A3E] bg-slate-50/50 dark:bg-[#172132]/30 flex flex-col justify-between space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Brand Icon / Favicon
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                      1:1 Square
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Used for mobile app icon, browser favicon, and square badges.
                  </p>

                  {/* Visual Preview in Square Container */}
                  <div className="w-full h-24 rounded-lg bg-slate-100 dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] flex items-center justify-center p-3 shadow-inner relative overflow-hidden group">
                    <img
                      src={settings.iconLogoUrl || '/logo-icon.png'}
                      alt="Icon Logo Preview"
                      className="w-14 h-14 object-contain rounded"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-[#1E2A3E]">
                  {/* Upload File Button */}
                  <input
                    type="file"
                    ref={iconFileRef}
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleLogoUpload(e.target.files[0], 'icon');
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={uploadingSlot === 'icon'}
                      onClick={() => iconFileRef.current?.click()}
                      className="flex-1 py-1.5 px-3 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {uploadingSlot === 'icon' ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          iconLogoUrl: '/logo-icon.png',
                        }))
                      }
                      className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      title="Reset to default icon"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {uploadSuccessSlot === 'icon' && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Icon logo updated!</span>
                    </div>
                  )}

                  {/* Direct Path Input */}
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Or image URL / path:
                    </label>
                    <input
                      type="text"
                      value={settings.iconLogoUrl || ''}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          iconLogoUrl: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-[#1E2A3E] bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200 font-mono"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                      Quick Presets:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { label: 'Square Icon', url: '/logo-icon.png' },
                        { label: 'Dark Icon', url: '/logo-dark-icon.png' },
                        { label: 'Light Icon', url: '/logo-light-icon.png' },
                      ].map((p) => (
                        <button
                          key={p.url}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              iconLogoUrl: p.url,
                            }))
                          }
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] hover:border-blue-500 text-slate-700 dark:text-slate-300 transition"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* LIVE HEADER SIMULATION PREVIEW */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 dark:border-[#1E2A3E] bg-slate-100/60 dark:bg-[#0B0F19] space-y-3">
              <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block">
                Live Navbar Simulation (Light Mode vs. Dark Mode):
              </span>

              {/* Light Navbar Simulated */}
              <div className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={settings.lightLogoUrl || settings.horizontalLogoUrl || '/logo-light-horizontal.png'}
                    alt="Simulated Light Logo"
                    className="h-7 w-auto object-contain"
                  />
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    CRM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded text-[11px] bg-slate-50 border border-slate-200 text-slate-400 flex items-center gap-1.5 hidden sm:flex">
                    <Search className="w-3 h-3" />
                    <span>Search leads...</span>
                  </div>
                  <div className="p-1 rounded bg-slate-100 text-slate-500">
                    <Sun className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Dark Navbar Simulated */}
              <div className="rounded-lg border border-[#1E2A3E] bg-[#111925] p-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={settings.darkLogoUrl || '/logo-dark-horizontal.png'}
                    alt="Simulated Dark Logo"
                    className="h-7 w-auto object-contain"
                  />
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#172132] text-slate-300 border border-[#1E2A3E]">
                    CRM
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded text-[11px] bg-[#172132] border border-[#1E2A3E] text-slate-400 flex items-center gap-1.5 hidden sm:flex">
                    <Search className="w-3 h-3" />
                    <span>Search leads...</span>
                  </div>
                  <div className="p-1 rounded bg-[#172132] text-slate-400">
                    <Moon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COMPANY PROFILE & THRESHOLD CARD */}
          <div className="crm-card p-5 space-y-5 bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-xs">
            <div className="border-b border-slate-100 dark:border-[#1E2A3E] pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Company Legal Profile & Commercial Rules</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Official Tagline
                </label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Official Phone
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white font-mono tabular-nums"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  value={settings.website}
                  onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Quotation Approval Threshold (₹)
                </label>
                <input
                  type="number"
                  value={settings.quotationApprovalThreshold}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      quotationApprovalThreshold: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white font-mono tabular-nums"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Quotations totaling this amount or higher require Manager sign-off before being marked Sent.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Office Address (City & State)
                </label>
                <input
                  type="text"
                  value={settings.cityState}
                  onChange={(e) => setSettings({ ...settings, cityState: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Email & Messaging Integration */}
      {activeTab === 'email' && (
        <div className="space-y-6">
          {/* Top Gateway Overview Card */}
          <div className="crm-card p-5 bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#1E2A3E] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Corporate Email Gateway & Messaging Relays</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        emailConfig.enabled
                          ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {emailConfig.enabled ? 'Service Active' : 'Service Paused'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure Hostinger enterprise mail relays, transactional email APIs, and manage outbound automated communications.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <span>Outbound Dispatch:</span>
                  <input
                    type="checkbox"
                    checked={emailConfig.enabled}
                    onChange={(e) => setEmailConfig({ ...emailConfig, enabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    {emailConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </div>
            </div>

            {/* Provider Selector Cards Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-500 block">
                Select Dispatch Transport Engine:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'hostinger_smtp',
                    name: 'Hostinger SMTP Direct',
                    badge: 'Recommended',
                    desc: 'Direct socket connection to smtp.hostinger.com:465 with SSL/TLS and SPF/DKIM verification.',
                    icon: Server,
                  },
                  {
                    id: 'native_mail',
                    name: 'Hostinger Server MTA',
                    badge: 'Max Reliability',
                    desc: 'Native LiteSpeed mail server running on crm.ifleon.com. Zero external latency and 100% uptime.',
                    icon: ShieldCheck,
                  },
                  {
                    id: 'elasticemail',
                    name: 'Elastic Email API',
                    badge: 'API Gateway',
                    desc: 'REST API transactional delivery with 64-character token authentication and delivery telemetry.',
                    icon: Key,
                  },
                  {
                    id: 'brevo',
                    name: 'Brevo (Sendinblue)',
                    badge: 'Cloud Partner',
                    desc: 'Official Hostinger transactional email cloud partner with dedicated IP routing.',
                    icon: Globe,
                  },
                  {
                    id: 'resend',
                    name: 'Resend Cloud',
                    badge: 'Modern API',
                    desc: 'Developer transactional API with instantaneous dispatch and modern webhook feedback.',
                    icon: Send,
                  },
                  {
                    id: 'custom_smtp',
                    name: 'Custom Corporate SMTP',
                    badge: 'Enterprise',
                    desc: 'Connect any external enterprise mail exchange or secure corporate SMTP relay.',
                    icon: Inbox,
                  },
                ].map((prov) => {
                  const Icon = prov.icon;
                  const isSelected = emailConfig.provider === prov.id;
                  return (
                    <button
                      key={prov.id}
                      type="button"
                      onClick={() => setEmailConfig({ ...emailConfig, provider: prov.id as any })}
                      className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 ring-1 ring-blue-600'
                          : 'border-slate-200 dark:border-[#1E2A3E] bg-white dark:bg-[#172132]/30 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{prov.name}</span>
                          </div>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {prov.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {prov.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">
                          {isSelected ? 'Selected Active Engine' : 'Click to select'}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Gateway Credentials & Details Form */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#1E2A3E] space-y-4">
              <span className="text-[11px] font-mono font-bold uppercase text-slate-500 block">
                Gateway Parameters & Credentials:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sender Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Outbound Email Address
                  </label>
                  <input
                    type="email"
                    value={emailConfig.senderEmail}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderEmail: e.target.value })}
                    placeholder="contact@ifleon.com"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Must match an authorized mailbox on Hostinger (@ifleon.com) for SPF alignment.
                  </span>
                </div>

                {/* Sender Display Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={emailConfig.senderName}
                    onChange={(e) => setEmailConfig({ ...emailConfig, senderName: e.target.value })}
                    placeholder="iFleon Corporate CRM"
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Displayed in client inboxes as the email originator name.
                  </span>
                </div>

                {/* API Key / Token */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      API Key / Hostinger Auth Token (64-Hex Token)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {showApiKey ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Hide Token</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Show Token</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={emailConfig.apiKey}
                      onChange={(e) => setEmailConfig({ ...emailConfig, apiKey: e.target.value })}
                      placeholder="Enter 64-character Hostinger or Elastic Email API key..."
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono pr-10"
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Prefilled with your active key ({emailConfig.apiKey ? `${emailConfig.apiKey.length} characters` : 'None'}). Secured via server-side storage.
                  </span>
                </div>

                {/* SMTP Host */}
                {(emailConfig.provider === 'hostinger_smtp' || emailConfig.provider === 'custom_smtp') && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        SMTP Server Host
                      </label>
                      <input
                        type="text"
                        value={emailConfig.smtpHost || 'smtp.hostinger.com'}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpHost: e.target.value })}
                        placeholder="smtp.hostinger.com"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        SMTP Port & Protocol
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={emailConfig.smtpPort || 465}
                          onChange={(e) => setEmailConfig({ ...emailConfig, smtpPort: parseInt(e.target.value) || 465 })}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono"
                        />
                        <div className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          {emailConfig.smtpPort === 465 ? 'SSL Security' : 'STARTTLS'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        SMTP Mailbox Username
                      </label>
                      <input
                        type="text"
                        value={emailConfig.smtpUser || emailConfig.senderEmail}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpUser: e.target.value })}
                        placeholder="contact@ifleon.com"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          SMTP Mailbox Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(!showSmtpPass)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          {showSmtpPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showSmtpPass ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        value={emailConfig.smtpPass || ''}
                        onChange={(e) => setEmailConfig({ ...emailConfig, smtpPass: e.target.value })}
                        placeholder="Hostinger mailbox password or app token"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Test Dispatch Bench */}
          <div className="crm-card p-5 bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-xs space-y-4">
            <div className="border-b border-slate-100 dark:border-[#1E2A3E] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Interactive Mail Gateway Diagnostics Workbench</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dispatch an end-to-end verification message to confirm connectivity, transport TLS handshakes, and SPF delivery.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <input
                  type="email"
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="Enter test recipient email (e.g. contact@ifleon.com or your email)..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#172132] border border-slate-200 dark:border-[#1E2A3E] text-slate-900 dark:text-white text-xs font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={sendingTest || !testRecipient.trim()}
                className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Verification...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test Verification Email</span>
                  </>
                )}
              </button>
            </div>

            {/* Test Result Callout */}
            {testResult && (
              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 transition ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold">{testResult.message}</div>
                  {testResult.transport && (
                    <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300">
                      Transport Handshake: {testResult.transport}
                    </div>
                  )}
                  {testResult.fallbackNotice && (
                    <div className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                      Notice: {testResult.fallbackNotice}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Email Dispatch History / Audit Log */}
          <div className="crm-card p-5 bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-xs space-y-3">
            <div className="border-b border-slate-100 dark:border-[#1E2A3E] pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-blue-600" />
                  <span>Outbound Message Dispatch Telemetry</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recent outgoing transactional messages, proposal transmissions, and test dispatches.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshEmailLogs}
                disabled={loadingLogs}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-[#1E2A3E] hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                <span>Refresh Log</span>
              </button>
            </div>

            {emailLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No outbound email transmissions recorded yet. Use the workbench above to dispatch a test verification email.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#172132] text-slate-500 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-2.5">Sent Timestamp</th>
                      <th className="p-2.5">Recipient Address</th>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Engine</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#1E2A3E]">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-[#172132]/50">
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {new Date(log.sentAt).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'medium',
                          })}
                        </td>
                        <td className="p-2.5 font-mono font-medium text-slate-900 dark:text-white">
                          {log.recipient}
                        </td>
                        <td className="p-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {log.subject}
                        </td>
                        <td className="p-2.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                            {log.type}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-500 uppercase">
                          {log.provider}
                        </td>
                        <td className="p-2.5 text-right">
                          <span
                            className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              log.status === 'sent'
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {log.status === 'sent' ? 'Delivered' : 'Failed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Appearance & Theme Studio */}
      {activeTab === 'theme' && (
        <div className="space-y-4">
          <div className="crm-card p-5 space-y-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-[#1E2A3E] rounded-xl">
            <div className="crm-card-header pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Automated Theme Studio
                </h2>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Define appearance parameters using natural language (e.g. <em>&quot;clean enterprise dark, slate surface with royal blue accents&quot;</em>). Verifies WCAG AA contrast standards before generation.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <input
                type="text"
                value={themePrompt}
                onChange={(e) => setThemePrompt(e.target.value)}
                placeholder="Describe look and feel..."
                className="flex-1 px-3 py-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <button
                onClick={handleGenerateAITheme}
                disabled={aiGenerating}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition"
              >
                {aiGenerating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Designing Theme...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Theme</span>
                  </>
                )}
              </button>
            </div>

            {aiGeneratedTheme && (
              <div className="p-4 rounded-md border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    AI Suggested Theme: {aiGeneratedTheme.name}
                  </span>
                  <button
                    onClick={handleApplyAITheme}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
                  >
                    Apply Theme
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: aiGeneratedTheme.primaryColor }} />
                    <span className="font-mono">{aiGeneratedTheme.primaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: aiGeneratedTheme.secondaryColor }} />
                    <span className="font-mono">{aiGeneratedTheme.secondaryColor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: aiGeneratedTheme.cardBackground }} />
                    <span className="font-mono">Card: {aiGeneratedTheme.cardBackground}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: aiGeneratedTheme.backgroundColor }} />
                    <span className="font-mono">BG: {aiGeneratedTheme.backgroundColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="crm-card p-5 space-y-4 border border-slate-200 dark:border-[#1E2A3E] rounded-xl bg-white dark:bg-[#111925]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Enterprise Themes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {themes.map((t) => {
                const isActive = activeThemeId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">{t.name}</span>
                        {isActive && <CheckCircle className="w-4 h-4 text-blue-600" />}
                      </div>
                      <div className="flex gap-1.5 mb-3">
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: t.primaryColor }} title="Primary" />
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: t.secondaryColor }} title="Secondary" />
                        <div className="w-5 h-5 rounded" style={{ backgroundColor: t.cardBackground }} title="Card BG" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{t.isDark ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI Fallback Chain & Keys */}
      {activeTab === 'ai' && (
        <div className="crm-card p-5 space-y-4 border border-slate-200 dark:border-[#1E2A3E] rounded-xl bg-white dark:bg-[#111925]">
          <div className="crm-card-header pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Multi-Provider AI Fallback Pipeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure Groq, Google Gemini, OpenRouter, and local Ollama. Higher priority providers are queried first.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {aiProviders.map((prov, idx) => (
              <div
                key={prov.id}
                className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">{prov.name}</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prov.enabled}
                      onChange={(e) => {
                        const next = [...aiProviders];
                        next[idx].enabled = e.target.checked;
                        setAiProviders(next);
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-500">Enabled</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Base URL</label>
                    <input
                      type="text"
                      value={prov.baseUrl}
                      onChange={(e) => {
                        const next = [...aiProviders];
                        next[idx].baseUrl = e.target.value;
                        setAiProviders(next);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Model Name</label>
                    <input
                      type="text"
                      value={prov.model}
                      onChange={(e) => {
                        const next = [...aiProviders];
                        next[idx].model = e.target.value;
                        setAiProviders(next);
                      }}
                      className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">API Key (Stored in encrypted storage)</label>
                  <input
                    type="password"
                    placeholder={prov.hasKey ? '•••••••••••••••• (Configured)' : 'Enter API Key...'}
                    value={prov.apiKey}
                    onChange={(e) => {
                      const next = [...aiProviders];
                      next[idx].apiKey = e.target.value;
                      setAiProviders(next);
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Standard Scope Master List */}
      {activeTab === 'scope' && (
        <div className="crm-card p-5 space-y-4 border border-slate-200 dark:border-[#1E2A3E] rounded-xl bg-white dark:bg-[#111925]">
          <div className="crm-card-header pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Pre-Owned Car Dealership Scope Master Modules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Standard components available for inclusion in 16:9 quotation slides and client contracts.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {scopeModules.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{m.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {m.description}
                  </p>
                </div>
                <div className="font-mono font-bold text-slate-900 dark:text-white flex-shrink-0">
                  ₹{m.defaultPrice.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Commercial Price List */}
      {activeTab === 'price' && (
        <div className="crm-card p-5 space-y-4 border border-slate-200 dark:border-[#1E2A3E] rounded-xl bg-white dark:bg-[#111925]">
          <div className="crm-card-header pb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Commercial Rate Card & Itemized Pricing
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Default rates, billing frequencies, and line item descriptions for automobile digital solutions.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-2.5">Item Name</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Unit / Period</th>
                  <th className="p-2.5 text-right">Standard Rate (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {priceList.map((pl) => (
                  <tr key={pl.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="p-2.5 font-medium text-slate-900 dark:text-white">{pl.name}</td>
                    <td className="p-2.5 text-slate-500">{pl.category}</td>
                    <td className="p-2.5 text-slate-500 capitalize">{pl.unit}</td>
                    <td className="p-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white">
                      ₹{pl.rate.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
