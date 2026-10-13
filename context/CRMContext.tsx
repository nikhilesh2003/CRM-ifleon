'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, CRMTheme, CompanySettings } from '@/lib/types';

interface CRMContextType {
  currentUser: User;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => Promise<void>;
  theme: CRMTheme | null;
  setTheme: (theme: CRMTheme) => void;
  settings: CompanySettings | null;
  refreshSettings: () => Promise<void>;
  isDark: boolean;
  toggleDarkMode: () => void;
  unreadCount: number;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user-admin',
    name: 'Rajesh Kumar',
    email: 'admin@ifleon.com',
    role: 'admin',
    phone: '+91 98480 11223',
    disabled: false,
    createdAt: '2026-01-10T10:00:00Z',
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [theme, setTheme] = useState<CRMTheme | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(3);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
      if (data.allUsers) {
        setAllUsers(data.allUsers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const refreshSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
      if (data.themes && data.activeThemeId) {
        const found = data.themes.find((t: CRMTheme) => t.id === data.activeThemeId);
        if (found) {
          setTheme(found);
          setIsDark(found.isDark);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSession();
    refreshSettings();
  }, []);

  const switchUserById = async (userId: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUser,
        switchUserById,
        theme,
        setTheme,
        settings,
        refreshSettings,
        isDark,
        toggleDarkMode,
        unreadCount,
      }}
    >
      <div className={isDark ? 'dark' : ''} style={{
        // Apply dynamic custom CSS variables if custom AI theme is active
        ...(theme ? {
          '--theme-primary': theme.primaryColor,
          '--theme-card': theme.cardBackground,
          '--theme-bg': theme.backgroundColor,
          '--theme-radius': theme.borderRadius,
        } : {})
      } as React.CSSProperties}>
        {children}
      </div>
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
