// src/pages/AcceptInvite.tsx
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';
import PasswordInput from '@/components/shared/PasswordInput.tsx';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

export default function AcceptInvite() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Password must be at least 8 characters');
    if (password !== confirm) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await authService.acceptInvite(token, password);
      toast.success('Account activated! Please sign in.');
      navigate('/signin');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <div className="text-center mb-4">
            <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" />
          </div>
          <div className="alert alert-danger small">
            This invite link is missing or malformed. Please ask an admin to resend your invitation.
          </div>
          <p className="text-center text-muted small mt-3 mb-0">
            <Link to="/signin" className="text-primary">Back to sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="text-center mb-4">
          <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" />
        </div>
        <h5 className="fw-semibold mb-1">Activate your account</h5>
        <p className="text-muted small mb-4">Set a password to finish joining your organization.</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">New Password</label>
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} autoFocus />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-medium">Confirm Password</label>
            <PasswordInput value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Activating…</> : 'Activate Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
