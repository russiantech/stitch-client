import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { authService } from '@/services/api.ts';
import type { User, UserRole } from '@/types/index.ts';

// ── Role helpers ──────────────────────────────────────────────────────────────
// User.roles is always an array (see User.get_summary() on the backend).

const hasRole = (user: User | null, ...roles: string[]): boolean => {
  if (!user?.roles) return false;
  return user.roles.some(r => roles.includes(r));
};

const isPlatformAdmin = (user: User | null): boolean => hasRole(user, 'super_admin');

// ── Storage keys ──────────────────────────────────────────────────────────────
const K = {
  token: 'access_token',
  refresh: 'refresh_token',
  userData: 'user_data',
  origToken: 'orig_access_token',
  origRefresh: 'orig_refresh_token',
  origUser: 'orig_user_data',
  impUser: 'impersonating_user',
  currentOrg: 'current_org_id',
} as const;

const clearAuth = () => Object.values(K).forEach(k => localStorage.removeItem(k));

// ── Context type ──────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  originalUser: User | null;
  loading: boolean;
  error: string | null;
  isImpersonating: boolean;

  signIn: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  impersonate: (targetUser: User) => Promise<void>;
  exitImpersonation: () => Promise<void>;
  refreshUser: () => Promise<void>;

  isAdmin: () => boolean;       // admin or super_admin
  isStaff: () => boolean;       // admin, super_admin, staff, or manager
  isDriver: () => boolean;
  isCustomer: () => boolean;
  isPlatformAdmin: () => boolean;
  canActOnBehalf: boolean;

  currentOrgId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [originalUser, setOriginalUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(K.token);
    if (!token) { setLoading(false); return; }

    authService.currentUser()
      .then(u => {
        setUser(u);
        localStorage.setItem(K.userData, JSON.stringify(u));
      })
      .catch(() => {
        const stored = localStorage.getItem(K.userData);
        if (stored) {
          try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
        } else {
          clearAuth();
        }
      })
      .finally(() => {
        const origRaw = localStorage.getItem(K.origUser);
        if (origRaw) {
          try { setOriginalUser(JSON.parse(origRaw)); } catch { /* ignore */ }
        }
        setLoading(false);
      });
  }, []);

  // ── Sign in ─────────────────────────────────────────────────────────────────
  // identifier can be email, username, or phone — all accepted by the backend.
  const signIn = useCallback(async (identifier: string, password: string) => {
    setError(null);
    try {
      const tokenData = await authService.signIn(identifier, password);
      if (!tokenData.access_token) throw new Error('No access token received');

      localStorage.setItem(K.token, tokenData.access_token);
      if (tokenData.refresh_token) localStorage.setItem(K.refresh, tokenData.refresh_token);

      const userData = tokenData.user ?? null;
      if (userData) {
        localStorage.setItem(K.userData, JSON.stringify(userData));
        setUser(userData);
      } else {
        const u = await authService.currentUser();
        localStorage.setItem(K.userData, JSON.stringify(u));
        setUser(u);
      }

      return { success: true };
    } catch (err) {
      const msg = (err as Error).message || 'Sign in failed';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  // ── Sign out ─────────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      const refresh = localStorage.getItem(K.refresh) || undefined;
      await authService.signOut(refresh);
    } catch { /* ignore */ }
    clearAuth();
    setUser(null);
    setOriginalUser(null);
  }, []);

  // ── Refresh user from server ──────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const u = await authService.currentUser();
      setUser(u);
      localStorage.setItem(K.userData, JSON.stringify(u));
    } catch { /* ignore */ }
  }, []);

  // ── Impersonation ─────────────────────────────────────────────────────────
  const impersonate = useCallback(async (targetUser: User) => {
    if (!user) throw new Error('Not authenticated');
    if (!hasRole(user, 'admin', 'super_admin', 'staff', 'manager'))
      throw new Error('Insufficient permissions to impersonate');
    if (originalUser) throw new Error('Already impersonating. Exit first.');

    // Save current session
    localStorage.setItem(K.origToken, localStorage.getItem(K.token) || '');
    localStorage.setItem(K.origRefresh, localStorage.getItem(K.refresh) || '');
    localStorage.setItem(K.origUser, JSON.stringify(user));
    localStorage.setItem(K.impUser, JSON.stringify(targetUser));
    setOriginalUser(user);

    try {
      const res = await authService.impersonate(String(targetUser.id));
      localStorage.setItem(K.token, res.access_token);
      const impUser = res.user ?? targetUser;
      localStorage.setItem(K.userData, JSON.stringify(impUser));
      setUser(impUser);
    } catch {
      // Soft fallback — set UI state without a real impersonation token
      localStorage.setItem(K.userData, JSON.stringify(targetUser));
      setUser(targetUser);
    }
  }, [user, originalUser]);

  const exitImpersonation = useCallback(async () => {
    const origTokenVal = localStorage.getItem(K.origToken);
    const origUserRaw = localStorage.getItem(K.origUser);
    if (!origUserRaw) return;

    const adminUser: User = JSON.parse(origUserRaw);
    if (origTokenVal) localStorage.setItem(K.token, origTokenVal);
    localStorage.setItem(K.userData, origUserRaw);
    [K.origToken, K.origRefresh, K.origUser, K.impUser].forEach(k => localStorage.removeItem(k));
    setUser(adminUser);
    setOriginalUser(null);
  }, []);

  // ── Derived state ─────────────────────────────────────────────────────────
  const effectiveUser = user;
  const realUser = originalUser ?? user;
  const currentOrgId = user?.organization_id ?? null;
  const canActOnBehalf = hasRole(realUser, 'admin', 'super_admin', 'staff', 'manager');

  return (
    <AuthContext.Provider value={{
      user: effectiveUser,
      originalUser,
      loading,
      error,
      isImpersonating: !!originalUser,

      signIn,
      signOut,
      impersonate,
      exitImpersonation,
      refreshUser,

      isAdmin: () => hasRole(realUser, 'admin', 'super_admin'),
      isStaff: () => hasRole(realUser, 'admin', 'super_admin', 'staff', 'manager'),
      isDriver: () => hasRole(effectiveUser, 'driver'),
      isCustomer: () => hasRole(effectiveUser, 'customer'),
      isPlatformAdmin: () => isPlatformAdmin(realUser),
      canActOnBehalf,
      currentOrgId,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export type { UserRole };
