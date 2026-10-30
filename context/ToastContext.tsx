'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (message: string, title?: string) => showToast({ type: 'success', message, title }),
    error: (message: string, title?: string) => showToast({ type: 'error', message, title }),
    warning: (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    info: (message: string, title?: string) => showToast({ type: 'info', message, title }),
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2 sm:p-0">
      {toasts.map((t) => {
        let Icon = CheckCircle2;
        let borderClass = 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200';
        let iconClass = 'text-emerald-600 dark:text-emerald-400';
        let barClass = 'bg-emerald-600';

        if (t.type === 'error') {
          Icon = AlertTriangle;
          borderClass = 'border-rose-200 dark:border-rose-800 bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200';
          iconClass = 'text-rose-600 dark:text-rose-400';
          barClass = 'bg-rose-600';
        } else if (t.type === 'warning') {
          Icon = AlertCircle;
          borderClass = 'border-amber-200 dark:border-amber-800 bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200';
          iconClass = 'text-amber-600 dark:text-amber-400';
          barClass = 'bg-amber-600';
        } else if (t.type === 'info') {
          Icon = Info;
          borderClass = 'border-blue-200 dark:border-blue-800 bg-white dark:bg-[#111925] text-slate-800 dark:text-slate-200';
          iconClass = 'text-blue-600 dark:text-blue-400';
          barClass = 'bg-blue-600';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border shadow-lg p-3.5 flex items-start gap-3 transition-all transform animate-in slide-in-from-bottom-2 duration-200 ${borderClass}`}
          >
            <div className={`p-1 rounded-md flex-shrink-0 mt-0.5 ${iconClass}`}>
              <Icon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              {t.title && (
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight mb-0.5">
                  {t.title}
                </div>
              )}
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {t.message}
              </div>
            </div>

            <button
              onClick={() => onRemove(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition flex-shrink-0 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
