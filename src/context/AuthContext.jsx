import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api.js';
import { MOCK_USER } from '../services/mockData.js';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  token:        'access_token',
  refresh:      'refresh_token',
  userData:     'user_data',
  origToken:    'orig_access_token',
  origRefresh:  'orig_refresh_token',
  origUser:     'orig_user_data',
  impersonating:'impersonating_user',
};

export const AuthProvider = ({ children }) => {
  const [user,          setUser]          = useState(null);
  const [originalUser,  setOriginalUser]  = useState(null); // the real admin
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // Restore session on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEYS.token);
    if (!token) { setLoading(false); return; }

    authService.currentUser()
      .then(data => setUser(data))
      .catch(() => {
        const stored = localStorage.getItem(STORAGE_KEYS.userData);
        setUser(stored ? JSON.parse(stored) : MOCK_USER);
      })
      .finally(() => {
        // Restore impersonation state if it was active
        const origStored = localStorage.getItem(STORAGE_KEYS.origUser);
        if (origStored) {
          try { setOriginalUser(JSON.parse(origStored)); } catch {}
        }
        setLoading(false);
      });
  }, []);

  // ── Sign in ────────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await authService.signIn(email, password);
      if (data.access_token) {
        localStorage.setItem(STORAGE_KEYS.token,   data.access_token);
        if (data.refresh_token)
          localStorage.setItem(STORAGE_KEYS.refresh, data.refresh_token);
        const userData = data.user || data;
        localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
      throw new Error(data.message || 'Sign in failed');
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  // ── Sign out (clears everything including impersonation) ───────────────────
  const signOut = useCallback(async () => {
    try { await authService.signOut(); } catch {}
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    setUser(null);
    setOriginalUser(null);
  }, []);

  // ── Impersonate a user (admin only) ───────────────────────────────────────
  // Stores the admin's real credentials, then fetches/sets the target user's
  // session. If a real impersonation token is returned by the backend we use
  // it; otherwise we do a "soft" impersonation — same token, swapped UI user.
  const impersonate = useCallback(async (targetUser) => {
    if (!user || !['admin', 'staff'].includes(user.role)) {
      throw new Error('Only admins and staff can impersonate users');
    }
    if (originalUser) {
      throw new Error('Already impersonating. Exit current session first.');
    }

    // Save originals
    localStorage.setItem(STORAGE_KEYS.origToken,   localStorage.getItem(STORAGE_KEYS.token) || '');
    localStorage.setItem(STORAGE_KEYS.origRefresh,  localStorage.getItem(STORAGE_KEYS.refresh) || '');
    localStorage.setItem(STORAGE_KEYS.origUser,     JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.impersonating, JSON.stringify(targetUser));
    setOriginalUser(user);

    try {
      // Try backend impersonation endpoint (returns a temp token)
      const { apiRequest } = await import('../services/api.js');
      const res = await apiRequest(`/auth/impersonate/${targetUser.id}`, { method: 'POST' });
      if (res?.access_token) {
        localStorage.setItem(STORAGE_KEYS.token, res.access_token);
        const impersonated = res.user || targetUser;
        localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(impersonated));
        setUser(impersonated);
        return;
      }
    } catch {
      // Backend doesn't support impersonation tokens — do soft impersonation
    }

    // Soft impersonation: keep admin token, just swap UI context
    localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(targetUser));
    setUser(targetUser);
  }, [user, originalUser]);

  // ── Exit impersonation — restore admin session ─────────────────────────────
  const exitImpersonation = useCallback(async () => {
    const origToken   = localStorage.getItem(STORAGE_KEYS.origToken);
    const origRefresh = localStorage.getItem(STORAGE_KEYS.origRefresh);
    const origUserRaw = localStorage.getItem(STORAGE_KEYS.origUser);
    if (!origUserRaw) return;

    const adminUser = JSON.parse(origUserRaw);

    if (origToken)   localStorage.setItem(STORAGE_KEYS.token,   origToken);
    if (origRefresh) localStorage.setItem(STORAGE_KEYS.refresh, origRefresh);
    localStorage.setItem(STORAGE_KEYS.userData, origUserRaw);

    // Remove impersonation keys
    [STORAGE_KEYS.origToken, STORAGE_KEYS.origRefresh,
     STORAGE_KEYS.origUser,  STORAGE_KEYS.impersonating].forEach(k => localStorage.removeItem(k));

    setUser(adminUser);
    setOriginalUser(null);
  }, []);

  const isImpersonating = !!originalUser;
  const isAdmin  = useCallback(() => (originalUser || user)?.role === 'admin',   [user, originalUser]);
  const isStaff  = useCallback(() => ['admin', 'staff'].includes((originalUser || user)?.role), [user, originalUser]);
  const isDriver = useCallback(() => user?.role === 'driver', [user]);

  // The "true" role — unaffected by impersonation
  const realRole = originalUser?.role || user?.role || 'customer';
  const canActOnBehalf = ['admin', 'staff'].includes(realRole);

  return (
    <AuthContext.Provider value={{
      user, originalUser, loading, error,
      signIn, signOut,
      impersonate, exitImpersonation,
      isImpersonating, isAdmin, isStaff, isDriver,
      canActOnBehalf, realRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
