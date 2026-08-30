
// v3
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';
import { subscriptionService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';
import PasswordInput from '@/components/shared/PasswordInput.tsx';
import StitchMark from '@/components/shared/StitchMark.tsx';

export default function SignIn() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const ref = params.get('reference') || params.get('trxref');
    if (ref) {
      (async () => {
        try {
          await subscriptionService.verifyCallback(ref);
          toast.success('Subscription payment verified!');
        } catch {
          toast.info('Payment reference detected — please sign in to see your subscription status.');
        }
        window.history.replaceState({}, '', '/signin');
      })();
    }
  }, [params, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn(identifier.trim().toLowerCase(), password);
      if (result.success) {
        const redirect = params.get('redirect') || '/dashboard';
        navigate(redirect);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="text-center mb-4">
          <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            <Link to="/" className="text-decoration-none text-primary">
            {/* <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" /> */}
             <StitchMark
              // src="/images/logos/stitch-logo.png"   // ← override for auth pages
              className="auth-logo"
            />
            </Link>
          </div>
          <p className="text-muted small mb-0">Digital infrastructure for Nigeria's laundry & fashion economy</p>
        </div>

        <h5 className="fw-semibold mb-1">Welcome back</h5>
        <p className="text-muted small mb-4">Sign in to continue</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">Email, username, or phone</label>
            <input
              type="text"
              className="form-control"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Email, username, or phone"
              required
              autoFocus
            />
          </div>
          <div className="mb-4">
            <label className="form-label small fw-medium">Password</label>
            <PasswordInput
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <div className="text-end mt-1">
              <Link to="/forgot-password" className="text-muted small">Forgot password?</Link>
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
