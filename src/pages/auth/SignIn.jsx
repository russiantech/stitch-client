import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { subscriptionService } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function SignIn() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const { signIn } = useAuth();
  const toast      = useToast();
  const navigate   = useNavigate();
  const [params]   = useSearchParams();

  // Handle Paystack subscription redirect coming back via /signin (edge case)
  useEffect(() => {
    const ref = params.get('reference') || params.get('trxref');
    if (ref) {
      (async () => {
        try {
          const result = await subscriptionService.verify(ref);
          toast.success(result?.message || 'Subscription payment verified!');
        } catch {
          toast.info('Payment reference detected — please sign in to see your subscription status.');
        }
        window.history.replaceState({}, '', '/signin');
      })();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.success) {
      const redirect = params.get('redirect') || '/dashboard';
      navigate(redirect);
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  const demoLogin = (role) => {
    const users = {
      admin:    { id:1, name:'Adaeze Okonkwo',  email:'adaeze@stitch.ng',  role:'admin',    username:'adaeze' },
      customer: { id:2, name:'Chiamaka Eze',    email:'chiamaka@gmail.com',       role:'customer', username:'chiamaka' },
      staff:    { id:5, name:'Chioma Uzoma',    email:'chioma@stitch.ng',   role:'staff',    username:'chioma' },
      driver:   { id:4, name:'Segun Adeola',    email:'segun@stitch.ng',    role:'driver',   username:'segun' },
    };
    const u = users[role];
    localStorage.setItem('access_token', `demo-token-${role}`);
    localStorage.setItem('user_data', JSON.stringify(u));
    window.location.href = role === 'admin' ? '/ops' : role === 'staff' ? '/staff' : role === 'driver' ? '/driver' : '/dashboard';
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="fs-3 text-primary fw-bold mb-1" style={{fontFamily:'var(--font-heading)'}}>
            <span className="brand-scissors me-2"><i className="fas fa-scissors"/></span>Stitch
          </div>
          <p className="text-muted small mb-0">Laundry & Fashion Operations</p>
        </div>

        <h5 className="fw-semibold mb-1">Welcome back</h5>
        <p className="text-muted small mb-4">Sign in to continue</p>

        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">Email address</label>
            <input type="email" className="form-control" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required autoFocus/>
          </div>
          <div className="mb-4">
            <label className="form-label small fw-medium">Password</label>
            <input type="password" className="form-control" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/>
            <div className="text-end mt-1"><Link to="/forgot-password" className="text-muted small">Forgot password?</Link></div>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2"/>Signing in…</> : 'Sign In'}
          </button>
        </form>

        <hr className="my-3"/>

        <p className="text-muted small text-center mb-2">Demo Access</p>
        <div className="row g-2">
          {[
            {role:'admin',    label:'Admin',    icon:'fa-user-shield',  cls:'btn-outline-danger'},
            {role:'customer', label:'Customer', icon:'fa-user',         cls:'btn-outline-primary'},
            {role:'staff',    label:'Staff',    icon:'fa-id-badge',     cls:'btn-outline-info'},
            {role:'driver',   label:'Driver',   icon:'fa-car',          cls:'btn-outline-warning'},
          ].map(d=>(
            <div key={d.role} className="col-6">
              <button className={`btn ${d.cls} btn-sm w-100`} onClick={()=>demoLogin(d.role)}>
                <i className={`fas ${d.icon} me-1`}/>{d.label}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-muted small mt-4 mb-0">
          Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
