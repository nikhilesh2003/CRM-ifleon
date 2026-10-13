'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, CRMTheme, CompanySettings, AuthSession, UserRole } from '@/lib/types';

interface LoginCredentials {
  email: string;
  password?: string;
  rememberMe?: boolean;
}

interface RegisterFormData {
  name: string;
  email: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  password?: string;
  rememberMe?: boolean;
}

interface CRMContextType {
  currentUser: User | null;
  session: AuthSession | null;
  allUsers: User[];
  isLoadingAuth: boolean;
  setCurrentUser: (user: User | null) => void;
  login: (creds: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (details?: { email?: string; name?: string; rememberMe?: boolean }) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUserById: (userId: string) => Promise<void>;
  isTutorialOpen: boolean;
  openTutorial: () => void;
  closeTutorial: () => void;
  completeTutorial: () => Promise<void>;
  theme: CRMTheme | null;
  setTheme: (theme: CRMTheme) => void;
  settings: CompanySettings | null;
  refreshSettings: () => Promise<void>;
  isDark: boolean;
  toggleDarkMode: () => void;
  unreadCount: number;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'ifleon_session';

export function CRMProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);

  const [theme, setTheme] = useState<CRMTheme | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);

  // Sync theme with document.documentElement on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ifleon_theme');
      if (stored === 'dark') {
        setIsDark(true);
        document.documentElement.classList.add('dark');
      } else if (stored === 'light') {
        setIsDark(false);
        document.documentElement.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  }, []);

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
          if (typeof document !== 'undefined') {
            if (found.isDark) {
              document.documentElement.classList.add('dark');
              try { localStorage.setItem('ifleon_theme', 'dark'); } catch (e) {}
            } else {
              document.documentElement.classList.remove('dark');
              try { localStorage.setItem('ifleon_theme', 'light'); } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

  // Restore and validate session from localStorage on mount
  useEffect(() => {
    async function initSession() {
      setIsLoadingAuth(true);
      try {
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem(SESSION_STORAGE_KEY);
          if (raw) {
            const parsedSession: AuthSession = JSON.parse(raw);
            const now = Date.now();

            // Check session expiration
            if (now > parsedSession.expiresAt) {
              // Session expired!
              console.warn('Session has expired, clearing stored session.');
              localStorage.removeItem(SESSION_STORAGE_KEY);
              setSession(null);
              setCurrentUser(null);
              setIsLoadingAuth(false);
              return;
            }

            // Session is valid, fetch user profile
            const res = await fetch(`/api/auth?userId=${encodeURIComponent(parsedSession.userId)}`);
            const data = await res.json();
            if (data.user && !data.user.disabled) {
              setSession(parsedSession);
              setCurrentUser(data.user);
              if (data.allUsers) setAllUsers(data.allUsers);

              // Check if first-time tutorial should be shown
              const tutorialSeen = localStorage.getItem(`ifleon_tutorial_seen_${data.user.id}`);
              if (!data.user.tutorialCompleted && !tutorialSeen) {
                setIsTutorialOpen(true);
              }
            } else {
              localStorage.removeItem(SESSION_STORAGE_KEY);
              setSession(null);
              setCurrentUser(null);
            }
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
        setSession(null);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    }

    initSession();
    refreshSettings();
  }, []);

  // Login handler
  const login = useCallback(async (creds: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: creds.email,
          password: creds.password,
          rememberMe: creds.rememberMe,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication failed.' };
      }

      setSession(data.session);
      setCurrentUser(data.user);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
      }

      // Check first-time tutorial
      const tutorialSeen = typeof window !== 'undefined' ? localStorage.getItem(`ifleon_tutorial_seen_${data.user.id}`) : null;
      if (!data.user.tutorialCompleted && !tutorialSeen) {
        setIsTutorialOpen(true);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to the authentication service.' };
    }
  }, []);

  // Google SSO login handler
  const loginWithGoogle = useCallback(async (details?: { email?: string; name?: string; rememberMe?: boolean }): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google',
          email: details?.email || 'rajesh.kumar@ifleon.com',
          name: details?.name || 'Rajesh Kumar',
          rememberMe: details?.rememberMe ?? true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Google SSO authentication failed.' };
      }

      setSession(data.session);
      setCurrentUser(data.user);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
      }

      const tutorialSeen = typeof window !== 'undefined' ? localStorage.getItem(`ifleon_tutorial_seen_${data.user.id}`) : null;
      if (!data.user.tutorialCompleted && !tutorialSeen) {
        setIsTutorialOpen(true);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to connect to Google SSO.' };
    }
  }, []);

  // Registration handler
  const register = useCallback(async (data: RegisterFormData): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: data.name,
          email: data.email,
          phone: data.phone,
          role: data.role || 'consultant',
          department: data.department,
          password: data.password,
          rememberMe: data.rememberMe,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        return { success: false, error: result.error || 'Registration failed.' };
      }

      setSession(result.session);
      setCurrentUser(result.user);

      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(result.session));
      }

      // Automatically launch onboarding tutorial for new user
      setIsTutorialOpen(true);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unable to complete registration.' };
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
      setSession(null);
      setCurrentUser(null);
      setIsTutorialOpen(false);
    }
  }, []);

  // Legacy switch user for dev/testing
  const switchUserById = async (userId: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'switch' }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openTutorial = () => setIsTutorialOpen(true);
  const closeTutorial = () => setIsTutorialOpen(false);

  const completeTutorial = async () => {
    if (!currentUser) {
      setIsTutorialOpen(false);
      return;
    }
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`ifleon_tutorial_seen_${currentUser.id}`, 'true');
      }
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tutorial_complete', userId: currentUser.id }),
      });
      setCurrentUser((prev) => (prev ? { ...prev, tutorialCompleted: true } : null));
    } catch (e) {
      console.error('Error recording tutorial completion:', e);
    } finally {
      setIsTutorialOpen(false);
    }
  };

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          document.documentElement.classList.add('dark');
          try { localStorage.setItem('ifleon_theme', 'dark'); } catch (e) {}
        } else {
          document.documentElement.classList.remove('dark');
          try { localStorage.setItem('ifleon_theme', 'light'); } catch (e) {}
        }
      }
      return next;
    });
  };

  return (
    <CRMContext.Provider
      value={{
        currentUser,
        session,
        allUsers,
        isLoadingAuth,
        setCurrentUser,
        login,
        loginWithGoogle,
        register,
        logout,
        switchUserById,
        isTutorialOpen,
        openTutorial,
        closeTutorial,
        completeTutorial,
        theme,
        setTheme,
        settings,
        refreshSettings,
        isDark,
        toggleDarkMode,
        unreadCount,
      }}
    >
      <div
        className="contents"
        style={{
          ...(theme ? {
            '--theme-primary': theme.primaryColor,
            '--theme-card': theme.cardBackground,
            '--theme-bg': theme.backgroundColor,
            '--theme-radius': theme.borderRadius,
          } : {})
        } as React.CSSProperties}
      >
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
