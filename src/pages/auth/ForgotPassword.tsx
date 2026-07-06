import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';
import PasswordInput from '@/components/shared/PasswordInput.tsx';

type ForgotPasswordStep = 'request' | 'verify' | 'reset';

const RESEND_COOLDOWN_SECONDS = 60;

const errMsg = (err: unknown): string =>
  err instanceof Error ? err.message : 'Something went wrong. Please try again.';

export default function ForgotPassword() {
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [verificationCode, setVC] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (secs = RESEND_COOLDOWN_SECONDS) => {
    setCanResend(false);
    setCountdown(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Step 1: Request a reset code ──────────────────────────────────────────
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error('Please enter a valid email address');

    setLoading(true);
    try {
      const response = await authService.forgotPassword(email.trim().toLowerCase());
      setResetToken(response.token);
      setEmail(response.email);
      setStep('verify');
      startCountdown();
      toast.success('Reset code sent! Check your email.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify the code ────────────────────────────────────────────────
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      return toast.error('Please enter the 6-character verification code');
    }

    setLoading(true);
    try {
      const result = await authService.verifyResetCode({ token: resetToken, email_code: verificationCode });
      if (!result.valid) {
        toast.error('Invalid or expired code. Please try again.');
        return;
      }
      setStep('reset');
    } catch (err) {
      toast.error(errMsg(err) || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Set new password ──────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 4) return toast.error('Password must be at least 4 characters');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      await authService.resetPassword({
        token: resetToken,
        email_code: verificationCode,
        new_password: newPassword,
      });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/signin');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !resetToken) return;
    setLoading(true);
    try {
      await authService.resendResetCode({ token: resetToken });
      startCountdown();
      toast.success('New reset code sent!');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRequest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('request'); setResetToken(''); setVC('');
    setCanResend(false); setCountdown(RESEND_COOLDOWN_SECONDS);
  };

  // ── Brand header — shared across all steps ────────────────────────────────
  const BrandHeader = () => (
    <div className="text-center mb-4">
      <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        {/* <span className="brand-scissors me-2"><i className="fas fa-scissors" /></span>Stitch */}
        <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" />
      </div>
      <p className="text-muted small mb-0">Digital infrastructure for Nigeria's laundry & fashion economy</p>
    </div>
  );

  // ── Step: verify code ──────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <BrandHeader />
          <h5 className="fw-semibold mb-1">Enter reset code</h5>
          <p className="text-muted small mb-4">
            Enter the 6-character code sent to <strong>{email}</strong>
          </p>

          <form onSubmit={handleVerifyCode}>
            <div className="mb-4">
              <label className="form-label small fw-medium">Verification Code</label>
              <input
                type="text"
                autoCapitalize="characters"
                autoComplete="one-time-code"
                className="form-control form-control-lg text-center"
                style={{ letterSpacing: '0.3em', fontFamily: 'monospace' }}
                value={verificationCode}
                onChange={e => setVC(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6))}
                placeholder="A1B2C3"
                maxLength={6}
                required
                autoFocus
              />
              <div className="form-text text-center small mt-2">Code expires in 15 minutes</div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</>
                : 'Verify Code'}
            </button>
          </form>

          <div className="text-center mt-3">
            <button
              className="btn btn-link btn-sm text-decoration-none"
              onClick={handleResend}
              disabled={!canResend || loading}
              type="button"
            >
              {canResend
                ? "Didn't receive it? Resend code"
                : <>Resend in <span className="fw-semibold">{countdown}s</span></>}
            </button>
          </div>

          <hr className="my-3" />

          <div className="text-center">
            <button className="btn btn-link btn-sm text-muted text-decoration-none" onClick={handleBackToRequest} type="button">
              <i className="fas fa-arrow-left me-1" /> Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: set new password ─────────────────────────────────────────────────
  if (step === 'reset') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <BrandHeader />
          <h5 className="fw-semibold mb-1">Set a new password</h5>
          <p className="text-muted small mb-4">Choose a new password for <strong>{email}</strong></p>

          <form onSubmit={handleResetPassword}>
            <div className="mb-3">
                <label className="form-label small fw-medium">New Password</label>
                <PasswordInput
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={4}
                autoFocus
                />
            </div>
            <div className="mb-4">
                <label className="form-label small fw-medium">Confirm Password</label>
                <PasswordInput
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Resetting…</>
                : 'Reset Password'}
            </button>
            </form>

        </div>
      </div>
    );
  }

  // ── Step: request code (default) ───────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <BrandHeader />
        <h5 className="fw-semibold mb-1">Forgot your password?</h5>
        <p className="text-muted small mb-4">Enter your email and we'll send you a reset code.</p>

        <form onSubmit={handleRequestCode}>
          <div className="mb-4">
            <label className="form-label small fw-medium">Email address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Sending code…</>
              : 'Send Reset Code'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Remember your password? <Link to="/signin" className="text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

