'use client';

import React, { useState } from 'react';
import { useCRM } from '@/context/CRMContext';
import {
  Users,
  FileText,
  Calendar,
  CheckCircle2,
  Shield,
  Briefcase,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Award,
  Layers,
  Settings,
  Bot,
  TrendingUp,
  FileCheck2,
} from 'lucide-react';

interface TutorialStep {
  title: string;
  subtitle: string;
  icon: any;
  highlights: string[];
  tip: string;
}

const CONSULTANT_STEPS: TutorialStep[] = [
  {
    title: 'Dealership Pipeline & Accounts',
    subtitle: 'Manage client accounts and move deals through the pipeline',
    icon: Users,
    highlights: [
      'Filter leads by stage: New Contacted, Interested, Proposal Sent, Won, or Lost.',
      'One-click WhatsApp and Phone calling direct from each lead card.',
      'Assign location tags (e.g., Nellore, Tirupati, Hyderabad) for route efficiency.',
    ],
    tip: 'Keep your lead status updated daily so management can forecast regional automobile revenue accurately.',
  },
  {
    title: 'Minutes of Meeting (MoM) Logging',
    subtitle: 'Record physical showroom visits, phone calls, and video demos',
    icon: FileText,
    highlights: [
      'Record meeting type: Physical Visit, Phone Call, or Video Conference.',
      'Log client attendee names, key decision-makers, and detailed discussion minutes.',
      'Set an explicit "Next Action" to automatically schedule follow-up tasks.',
    ],
    tip: 'Detailed MoMs provide immediate context before subsequent client negotiations.',
  },
  {
    title: 'Instant Quotation & Proposal Engine',
    subtitle: 'Build custom commercial quotes with auto-calculated margins',
    icon: Award,
    highlights: [
      'Select pre-built automobile portal modules (Car Inventory, EMI Calculator, SEO).',
      'Automatic tax calculations, tiered discounts, and standardized payment terms.',
      'Quotes exceeding ₹1,00,000 route automatically to management for approval.',
    ],
    tip: 'Once approved, download professional printable proposals with official iFleon letterhead.',
  },
  {
    title: 'Tasks & Due Today Alerts',
    subtitle: 'Ensure no client communication slips through the cracks',
    icon: Calendar,
    highlights: [
      'Check your daily follow-up queue on the top navigation bar and dashboard.',
      'Overdue alerts highlight dealerships awaiting callbacks or demo revisions.',
      'Mark tasks completed to log activity into your consultant audit history.',
    ],
    tip: 'Review your tasks list first thing every morning to plan your dealership visits.',
  },
];

const MANAGER_STEPS: TutorialStep[] = [
  {
    title: 'Regional Sales Cockpit & Metrics',
    subtitle: 'High-level performance monitoring and pipeline velocity',
    icon: TrendingUp,
    highlights: [
      'Real-time metrics on total pipeline value, won deals, and team win-rate.',
      'Breakdown of individual consultant quotas and lead conversion cycles.',
      'Deal volume tracking across Andhra Pradesh, Telangana, and Tamil Nadu.',
    ],
    tip: 'Use the Analytics view to detect bottlenecks in proposal response times.',
  },
  {
    title: 'Review Inbox & High-Value Approvals',
    subtitle: 'Authorize deals and commercial discount requests',
    icon: FileCheck2,
    highlights: [
      'Inspect quotations exceeding ₹1,00,000 threshold prior to client dispatch.',
      'Review Won/Lost deal status transitions submitted by field consultants.',
      'One-click approval or request revisions with structured feedback.',
    ],
    tip: 'Unreviewed items appear in your Review Inbox badge on the left navigation bar.',
  },
  {
    title: 'Campaign Projects & Consultant Assignment',
    subtitle: 'Organize outreach by dealership categories and geographic territories',
    icon: Briefcase,
    highlights: [
      'Create targeted campaigns (e.g. Hyderabad Luxury Pre-Owned, Q4 Outreach).',
      'Assign multiple consultants to collaborative dealership accounts.',
      'Monitor campaign-level ROI and total revenue closed per initiative.',
    ],
    tip: 'Organizing leads by campaign projects ensures focused geographic routing.',
  },
  {
    title: 'Audit Trail & Compliance Logging',
    subtitle: 'Maintain accountability across all commercial operations',
    icon: Shield,
    highlights: [
      'Immutable log of all user activities, status changes, and approvals.',
      'Filter audit history by user, entity type (Lead, Quotation, Settings), and date.',
      'Export audit trails to CSV or PDF for executive quarterly reviews.',
    ],
    tip: 'Every quotation approval and status modification is permanently timestamped.',
  },
];

const ADMIN_STEPS: TutorialStep[] = [
  {
    title: 'User Management & Role Permissions',
    subtitle: 'Enterprise user provisioning and access governance',
    icon: UserCheck,
    highlights: [
      'Create, edit, and deactivate consultant and manager user accounts.',
      'Assign departments (Executive, Regional Sales, Strategy) and contact details.',
      'Enforce password security and review last login session activities.',
    ],
    tip: 'Deactivating a user instantly revokes their session without losing historical leads.',
  },
  {
    title: 'Corporate Settings & Branding',
    subtitle: 'Manage legal entity information, letterheads, and approval limits',
    icon: Settings,
    highlights: [
      'Configure official company legal name, addresses, GSTIN, and support numbers.',
      'Upload and inspect light/dark corporate logos and quotation letterheads.',
      'Adjust the managerial quotation approval threshold (default: ₹1,00,000).',
    ],
    tip: 'Branding updates apply immediately across all generated quotation documents.',
  },
  {
    title: 'Multi-Model AI Configuration',
    subtitle: 'Configure intelligent sales assistants and automated pitch drafting',
    icon: Bot,
    highlights: [
      'Integrate Groq (Llama 3.3 70B), Google Gemini 1.5, OpenRouter, or local Ollama.',
      'Set primary and fallback providers with priority scoring.',
      'Empower consultants with AI-generated dealership pitch emails and follow-ups.',
    ],
    tip: 'API keys are stored securely in your private environment configuration.',
  },
  {
    title: 'Global System Oversight',
    subtitle: 'Full visibility across all regional pipelines and security logs',
    icon: Shield,
    highlights: [
      'Complete visibility into all leads, quotations, tasks, and system changes.',
      'Access system audit trail with advanced administrative filters.',
      'Backup and restore database snapshots at any time.',
    ],
    tip: 'Administrators have full bypass and override capabilities across all modules.',
  },
];

export default function RoleTutorialModal() {
  const { isTutorialOpen, closeTutorial, completeTutorial, currentUser } = useCRM();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isTutorialOpen || !currentUser) return null;

  const role = currentUser.role || 'consultant';
  let steps = CONSULTANT_STEPS;
  let roleLabel = 'Consultant';
  let RoleIcon = UserCheck;

  if (role === 'manager') {
    steps = MANAGER_STEPS;
    roleLabel = 'Manager';
    RoleIcon = Briefcase;
  } else if (role === 'admin') {
    steps = ADMIN_STEPS;
    roleLabel = 'Administrator';
    RoleIcon = Shield;
  }

  const activeStep = steps[currentStep] || steps[0];
  const StepIcon = activeStep.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeTutorial();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = () => {
    completeTutorial();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl bg-white dark:bg-[#111925] border border-slate-200 dark:border-[#1E2A3E] rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1E2A3E] flex items-center justify-between bg-slate-50/60 dark:bg-[#172132]/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-blue-800">
              <RoleIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {roleLabel} System Tour
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({currentStep + 1} of {steps.length})
                </span>
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Welcome to iFleon CRM, {currentUser.name.split(' ')[0]}
              </h2>
            </div>
          </div>
          <button
            onClick={closeTutorial}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1E2A3E] transition"
            title="Close Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-[#1E2A3E] h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Step Header */}
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 flex-shrink-0 mt-0.5">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeStep.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeStep.subtitle}
              </p>
            </div>
          </div>

          {/* Highlights List */}
          <div className="space-y-2.5 bg-slate-50/70 dark:bg-[#172132]/60 p-4 rounded-lg border border-slate-100 dark:border-[#1E2A3E]">
            <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              Core Capabilities:
            </span>
            {activeStep.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{highlight}</span>
              </div>
            ))}
          </div>

          {/* MNC Best Practice Box */}
          <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200">
              <span className="font-semibold">Pro Tip: </span>
              <span>{activeStep.tip}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-[#1E2A3E] bg-slate-50/60 dark:bg-[#172132]/40 flex items-center justify-between">
          <button
            onClick={handleFinish}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="px-3 py-1.5 rounded-md border border-slate-200 dark:border-[#1E2A3E] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1E2A3E] text-xs font-semibold flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-md bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
            >
              <span>{isLastStep ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
