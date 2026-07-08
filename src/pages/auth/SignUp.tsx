import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService, orgService } from '@/services/api.ts';
import type { SignupPayload } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';
import PasswordInput from '@/components/shared/PasswordInput.tsx';

// ── Mode derives from URL, never from user input ──────────────────────────────
// /signup                → new_org   (creating a brand-new organization)
// /signup?org=INVITE8    → join_org  (joining via invite code/link)
// /signup?invite=TOKEN   → accept    (admin-created account, pre-filled)
type SignupMode = 'new_org' | 'join_org' | 'accept';

interface SignUpForm {
  names: string;
  email: string;
  phone: string;
  password: string;
  confirm: string;
  org_name: string;   // only shown in new_org mode
}

const RESEND_COOLDOWN_SECONDS = 60;

const MODE_COPY: Record<SignupMode, { heading: string; sub: string }> = {
  new_org: { heading: 'Create your organization', sub: 'Set up Stitch for your business' },
  join_org: { heading: 'Join your organization', sub: 'Create your account to get started' },
  accept: { heading: 'Accept your invitation', sub: 'Complete your account setup' },
};

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

export default function SignUp() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const orgCode = searchParams.get('org')?.toUpperCase() ?? '';
  const inviteToken = searchParams.get('invite') ?? '';
  const mode: SignupMode = inviteToken ? 'accept' : orgCode ? 'join_org' : 'new_org';
  const copy = MODE_COPY[mode];

  const [form, setForm] = useState<SignUpForm>({
    names: '', email: '', phone: '', password: '', confirm: '', org_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [signupToken, setSignupToken] = useState('');
  const [verificationCode, setVC] = useState('');
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgLookupError, setOrgLookupError] = useState<string | null>(null);
  const [orgLookupLoading, setOrgLookupLoading] = useState(false);


  const update = (field: keyof SignUpForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validate = (): string | null => {
    if (!form.names.trim()) return 'Full name is required';
    if (!form.email.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address';
    if (form.password.length < 4) return 'Password must be at least 4 characters';
    if (form.password !== form.confirm) return 'Passwords do not match';
    if (mode === 'new_org' && !form.org_name.trim()) return 'Organization name is required';
    return null;
  };

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

  // Organization Name Lookup
  useEffect(() => {
    if (mode !== 'join_org' || !orgCode) return;
    setOrgLookupLoading(true);
    orgService.lookupByCode(orgCode)
      .then(res => setOrgName(res.name))
      .catch(err => setOrgLookupError(errMsg(err)))
      .finally(() => setOrgLookupLoading(false));
  }, [mode, orgCode]);


  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Step 1: Submit the signup form ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validate();
    if (error) return toast.error(error);

    setLoading(true);
    try {
      const payload: SignupPayload = {
        names: form.names.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
        password: form.password,
        phone: form.phone || undefined,
      };

      if (mode === 'new_org') payload.org_name = form.org_name.trim();
      if (mode === 'join_org') payload.org_code = orgCode;

      const response = await authService.signUp(payload);
      setSignupToken(response.token);
      setEmail(response.email);
      setStep('verify');
      startCountdown();
      toast.success('Verification code sent! Check your email.');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify the email code ─────────────────────────────────────────
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      return toast.error('Please enter the 6-character verification code');
    }

    setLoading(true);
    try {
      const response = await authService.verifySignup({
        token: signupToken,
        email_code: verificationCode,
      });

      if (response.user && (response.user as any).status !== 'active') {
        toast.success('Account created! An administrator must activate it before you can sign in.');
        navigate('/signin');
      } else if (response.access_token && response.refresh_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        localStorage.setItem('user_data', JSON.stringify(response.user));
        toast.success('Account created successfully! Welcome to Stitch.');
        navigate('/dashboard');
      } else {
        toast.success('Account verified! Please sign in.');
        navigate('/signin');
      }
    } catch (err) {
      toast.error(errMsg(err) || 'Verification failed. Please check your code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !signupToken) return;
    setLoading(true);
    try {
      await authService.resendSignupCode({ token: signupToken });
      startCountdown();
      toast.success('New verification code sent!');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep('form'); setSignupToken(''); setVC('');
    setCanResend(false); setCountdown(RESEND_COOLDOWN_SECONDS);
  };

  // ── Brand header — shared across both steps ───────────────────────────────
  const BrandHeader = () => (
    <div className="text-center mb-4">
      <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
        {/* <span className="brand-scissors me-2"><i className="fas fa-scissors" /></span>Stitch */}
        <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" />
      </div>
      <p className="text-muted small mb-0">Digital infrastructure for Nigeria's laundry & fashion economy</p>
    </div>
  );

  // ── Org context badge (shown when joining via invite) ─────────────────────
/*   const OrgBadge = () => {
    if (mode === 'new_org') return null;
    return (
      <div className="alert alert-primary py-2 px-3 mb-4 d-flex align-items-center gap-2 small">
        <i className="fas fa-building" />
        {mode === 'join_org'
          ? <span>Joining organization with code <strong>{orgCode}</strong></span>
          : <span>Accepting invitation</span>}
      </div>
    );
  };
 */

  const OrgBadge = () => {
  if (mode === 'new_org') return null;

  if (mode === 'join_org') {
    if (orgLookupLoading) {
      return (
        <div className="alert alert-light border py-2 px-3 mb-4 small text-muted">
          <span className="spinner-border spinner-border-sm me-2" />Looking up organization…
        </div>
      );
    }
    if (orgLookupError) {
      return (
        <div className="alert alert-danger py-2 px-3 mb-4 small">
          <i className="fas fa-exclamation-triangle me-2" />
          Invalid or expired invite code (<strong>{orgCode}</strong>). Please check the link with whoever invited you.
        </div>
      );
    }
    return (
      <div className="alert alert-primary py-2 px-3 mb-4 d-flex align-items-center gap-2 small">
        <i className="fas fa-building" />
        <span>Joining <strong>{orgName}</strong></span>
      </div>
    );
  }

  return (
    <div className="alert alert-primary py-2 px-3 mb-4 d-flex align-items-center gap-2 small">
      <i className="fas fa-building" />
      <span>Accepting invitation</span>
    </div>
  );
};

  // ── Verify step ───────────────────────────────────────────────────────────
  if (step === 'verify') {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          <BrandHeader />
          <h5 className="fw-semibold mb-1">Verify your email</h5>
          <p className="text-muted small mb-4">
            Enter the 6-character code sent to <strong>{email}</strong>
          </p>

          <form onSubmit={handleVerify}>
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
              <div className="form-text text-center small mt-2">Code expires in 10 minutes</div>
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading
                ? <><span className="spinner-border spinner-border-sm me-2" />Verifying…</>
                : 'Verify & Create Account'}
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
            <button className="btn btn-link btn-sm text-muted text-decoration-none" onClick={handleBack} type="button">
              <i className="fas fa-arrow-left me-1" /> Back to signup
            </button>
          </div>

          <p className="text-center text-muted small mt-3 mb-0">
            Already have an account? <Link to="/signin" className="text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <BrandHeader />
        <OrgBadge />

        <h5 className="fw-semibold mb-1">{copy.heading}</h5>
        <p className="text-muted small mb-4">{copy.sub}</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">Full Name</label>
            <input className="form-control" value={form.names} onChange={update('names')} placeholder="Chris James" required />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-medium">Email address</label>
            <input type="email" className="form-control" value={form.email} onChange={update('email')} placeholder="you@example.com" required />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-medium">Phone <span className="text-muted fw-normal">(optional)</span></label>
            <input className="form-control" value={form.phone} onChange={update('phone')} placeholder="080XXXXXXXX" />
          </div>

          {mode === 'new_org' && (
            <div className="mb-3">
              <label className="form-label small fw-medium">Organization Name</label>
              <input
                className="form-control"
                value={form.org_name}
                onChange={update('org_name')}
                placeholder="e.g. Dunis Tech"
                required
              />
              <div className="form-text small">This is your business name on Stitch.</div>
            </div>
          )}

         {/*  <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label small fw-medium">Password</label>
              <input type="password" className="form-control" value={form.password} onChange={update('password')} placeholder="••••••••" required minLength={4} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-medium">Confirm</label>
              <input type="password" className="form-control" value={form.confirm} onChange={update('confirm')} placeholder="••••••••" required />
            </div>
          </div> */}
          <div className="row g-3 mb-4">
          <div className="col-6">
            <label className="form-label small fw-medium">Password</label>
            <PasswordInput value={form.password} onChange={update('password')} placeholder="••••••••" required minLength={4} />
          </div>
          <div className="col-6">
            <label className="form-label small fw-medium">Confirm</label>
            <PasswordInput value={form.confirm} onChange={update('confirm')} placeholder="••••••••" required />
          </div>
        </div>

          {/* <button type="submit" className="btn btn-primary w-100" disabled={loading}> */}
          <button type="submit" className="btn btn-primary w-100" disabled={loading || (mode === 'join_org' && !!orgLookupError)}>
            {loading
              ? <><span className="spinner-border spinner-border-sm me-2" />Creating account…</>
              : mode === 'new_org' ? 'Create Organization & Account' : 'Create Account'}
          </button>
        </form>

        {mode === 'new_org' && (
          <div className="text-center mt-3">
            <span className="text-muted small">Have an invite code? </span>
            <Link to="/signup" className="small" onClick={() => {
              const code = prompt('Enter your organization invite code:')?.trim().toUpperCase();
              if (code) window.location.href = `/signup?org=${code}`;
            }}>Join an organization</Link>
          </div>
        )}

        <p className="text-center text-muted small mt-4 mb-0">
          Already have an account? <Link to="/signin" className="text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
