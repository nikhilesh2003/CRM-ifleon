'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCRM } from '@/context/CRMContext';
import { CompanySettings, CRMTheme, AIProviderConfig, StandardScopeModule, PriceListItem } from '@/lib/types';
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
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react';

export default function AdminSettingsWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading Settings...</div>}>
      <AdminSettingsPage />
    </Suspense>
  );
}

function AdminSettingsPage() {
  const { currentUser, settings: ctxSettings, refreshSettings, theme: activeTheme, setTheme } = useCRM();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'company' | 'theme' | 'ai' | 'scope' | 'price'>(
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
    horizontalLogoUrl: '/logo-horizontal.svg',
    iconLogoUrl: '/logo-icon.svg',
  });

  const [themes, setThemes] = useState<CRMTheme[]>([]);
  const [activeThemeId, setActiveThemeId] = useState('theme-default');
  const [aiProviders, setAiProviders] = useState<AIProviderConfig[]>([]);
  const [scopeModules, setScopeModules] = useState<StandardScopeModule[]>([]);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

        if (resSettings.settings) setSettings(resSettings.settings);
        if (resSettings.themes) setThemes(resSettings.themes);
        if (resSettings.activeThemeId) setActiveThemeId(resSettings.activeThemeId);
        if (resSettings.aiProviders) setAiProviders(resSettings.aiProviders);
        if (resMaster.scopeModules) setScopeModules(resMaster.scopeModules);
        if (resMaster.priceList) setPriceList(resMaster.priceList);
      } catch (e) {
        console.error(e);
      }
    }
    loadData();
  }, []);

  const isAdmin = currentUser.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Admin Privileges Required</h2>
        <p className="text-xs text-slate-500">
          Settings are restricted to Administrators only. Use the top role switcher to select Rajesh Kumar (Admin).
        </p>
      </div>
    );
  }

  // Handle Save Core Settings
  const handleSaveSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          activeThemeId,
          aiProviders,
          currentUser,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        refreshSettings();
      }
    } catch (e) {
      console.error(e);
    }
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
        alert('AI Theme applied and saved successfully!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reorder Provider Priority
  const handleMoveProvider = (index: number, direction: 'up' | 'down') => {
    const list = [...aiProviders];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    // Reassign priorities 1, 2, 3...
    list.forEach((p, idx) => {
      p.priority = idx + 1;
    });

    setAiProviders(list);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-500" />
            <span>Admin Control Panel & System Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure company branding, AI theme generator, multi-provider fallback layers, and master scope lists
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Settings successfully updated and saved!</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'company', label: 'Company Profile & Branding', icon: Building2 },
          { id: 'theme', label: 'Appearance & AI Theme Builder', icon: Palette },
          { id: 'ai', label: 'AI Provider Layers & Priorities', icon: Cpu },
          { id: 'scope', label: 'Standard Scope Master List', icon: Layers },
          { id: 'price', label: 'Commercial Price List', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Company Profile & Branding */}
      {activeTab === 'company' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Company Identity & Quotation Approval Threshold
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Quotations above this total require Manager approval before being marked Sent.
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Office Address (City & State)
              </label>
              <input
                type="text"
                value={settings.cityState}
                onChange={(e) => setSettings({ ...settings, cityState: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Appearance & AI Theme Builder */}
      {activeTab === 'theme' && (
        <div className="space-y-6">
          {/* AI Theme Creation Box matching PDF page 4 & 5 */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 text-white space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">
                AI Theme Creation System
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Describe the desired look in words (e.g. <em>"clean and professional, deep navy blue, rounded cards"</em> or <em>"warm amber luxury automotive gallery"</em>). The AI checks contrast rules against a fixed design schema and returns a structured theme.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                placeholder="Describe look in words..."
                value={themePrompt}
                onChange={(e) => setThemePrompt(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={handleGenerateAITheme}
                disabled={aiGenerating}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{aiGenerating ? 'AI Generating Theme...' : 'Generate Theme'}</span>
              </button>
            </div>

            {/* Generated Theme Live Preview */}
            {aiGeneratedTheme && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-indigo-400/40 space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Contrast Checked & Schema Validated
                  </span>
                  <button
                    onClick={handleApplyAITheme}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                  >
                    Save & Set as Active Theme
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 rounded-lg border border-slate-700" style={{ backgroundColor: aiGeneratedTheme.primaryColor }}>
                    <span className="font-bold text-white block">Primary</span>
                    <span className="text-[10px] text-white/80 font-mono">{aiGeneratedTheme.primaryColor}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-slate-700" style={{ backgroundColor: aiGeneratedTheme.cardBackground }}>
                    <span className="font-bold text-slate-200 block">Card BG</span>
                    <span className="text-[10px] text-slate-400 font-mono">{aiGeneratedTheme.cardBackground}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-slate-700" style={{ backgroundColor: aiGeneratedTheme.secondaryColor }}>
                    <span className="font-bold text-white block">Secondary</span>
                    <span className="text-[10px] text-white/80 font-mono">{aiGeneratedTheme.secondaryColor}</span>
                  </div>
                  <div className="p-2 rounded-lg border border-slate-700" style={{ backgroundColor: aiGeneratedTheme.accentColor }}>
                    <span className="font-bold text-slate-900 block">Accent</span>
                    <span className="text-[10px] text-slate-900 font-mono">{aiGeneratedTheme.accentColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Picker */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Available Themes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {themes.map((t) => {
                const isActive = activeThemeId === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setActiveThemeId(t.id);
                      setTheme(t);
                    }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition text-xs space-y-2 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-900 dark:text-white">{t.name}</span>
                      {isActive && <CheckCircle className="w-4 h-4 text-blue-600" />}
                    </div>
                    <div className="flex gap-1.5 pt-1">
                      <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: t.primaryColor }}></span>
                      <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: t.secondaryColor }}></span>
                      <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: t.accentColor }}></span>
                      <span className="w-5 h-5 rounded-full border" style={{ backgroundColor: t.cardBackground }}></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI Provider Layer matching PDF page 4 */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-500" />
              <span>Provider-Agnostic AI Layer & Automatic Fallback Chain</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Connect free open-source model hosts. If a provider hits rate limits or fails, the CRM automatically tries the next one in order.
            </p>
          </div>

          <div className="space-y-3">
            {aiProviders.map((provider, index) => (
              <div
                key={provider.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {provider.priority}
                    </span>
                    <strong className="text-sm text-slate-900 dark:text-white">
                      {provider.name}
                    </strong>
                    <span
                      className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                        provider.enabled
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {provider.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Model: {provider.model} • URL: {provider.baseUrl}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder={provider.hasKey ? '••••••••••••' : 'Enter API Key...'}
                    onChange={(e) => {
                      const updated = [...aiProviders];
                      updated[index].apiKey = e.target.value;
                      setAiProviders(updated);
                    }}
                    className="w-40 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                  />

                  {/* Priority order controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveProvider(index, 'up')}
                      className="p-1.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-30"
                      title="Move Priority Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === aiProviders.length - 1}
                      onClick={() => handleMoveProvider(index, 'down')}
                      className="p-1.5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 disabled:opacity-30"
                      title="Move Priority Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Standard Scope Master List (Page 3 of PDF) */}
      {activeTab === 'scope' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Standard Scope Master List (Pre-Owned Car Dealer Websites)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Master catalog of functional modules that quotations and proposals draw from
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {scopeModules.map((mod) => (
              <div
                key={mod.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white">{mod.name}</span>
                  <span className="text-[10px] text-blue-600 font-mono">₹{mod.defaultPrice.toLocaleString()}</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  {mod.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Commercial Price List */}
      {activeTab === 'price' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Commercial Price List Master
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Standard pricing rates and packages selectable during quotation creation
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {priceList.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <strong className="text-slate-900 dark:text-white block font-semibold">{item.name}</strong>
                  <span className="text-[11px] text-slate-500">{item.description}</span>
                </div>
                <div className="text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{item.rate.toLocaleString()} / {item.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
