// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link, useSearchParams } from 'react-router-dom';
// import { useAuth } from '@/context/AuthContext.tsx';
// import { subscriptionService } from '@/services/api.ts';
// import { useToast } from '@/context/ToastContext.tsx';
// import type { User } from '@/types/index.ts';

// export default function SignIn() {
//   const [identifier, setIdentifier] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const { signIn } = useAuth();
//   const toast = useToast();
//   const navigate = useNavigate();
//   const [params] = useSearchParams();

//   // Handle Paystack subscription redirect coming back via /signin
//   useEffect(() => {
//     const ref = params.get('reference') || params.get('trxref');
//     if (ref) {
//       (async () => {
//         try {
//           await subscriptionService.verifyCallback(ref);
//           toast.success('Subscription payment verified!');
//         } catch {
//           toast.info('Payment reference detected — please sign in to see your subscription status.');
//         }
//         window.history.replaceState({}, '', '/signin');
//       })();
//     }
//   }, [params, toast]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const result = await signIn(identifier.trim().toLowerCase(), password);
//       if (result.success) {
//         const redirect = params.get('redirect') || '/dashboard';
//         navigate(redirect);
//       } else {
//         setError(result.error || 'Invalid credentials');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const demoLogin = (role: 'admin' | 'customer' | 'staff' | 'driver') => {
//     const now = new Date().toISOString();
//     const base: Omit<User, 'id' | 'names' | 'email' | 'username' | 'roles' | 'is_org_admin'> = {
//       phone: null, avatar_url: null, bio: null, is_active: true, email_verified: true,
//       organization_id: 'demo-org', last_seen: now, created_at: now, updated_at: now,
//     };
//     const users: Record<string, User> = {
//       admin: { ...base, id: 'demo-admin', names: 'Adaeze Okonkwo', email: 'adaeze@stitch.ng', username: 'adaeze', roles: ['admin'], is_org_admin: true },
//       customer: { ...base, id: 'demo-customer', names: 'Chiamaka Eze', email: 'chiamaka@gmail.com', username: 'chiamaka', roles: ['customer'], is_org_admin: false },
//       staff: { ...base, id: 'demo-staff', names: 'Chioma Uzoma', email: 'chioma@stitch.ng', username: 'chioma', roles: ['staff'], is_org_admin: false },
//       driver: { ...base, id: 'demo-driver', names: 'Segun Adeola', email: 'segun@stitch.ng', username: 'segun', roles: ['driver'], is_org_admin: false },
//     };
//     const u = users[role];
//     localStorage.setItem('access_token', `demo-token-${role}`);
//     localStorage.setItem('user_data', JSON.stringify(u));
//     window.location.href = role === 'admin' ? '/ops' : role === 'staff' ? '/staff' : role === 'driver' ? '/driver' : '/dashboard';
//   };

//   return (
//     <div className="auth-wrapper">
//       <div className="auth-card">
//         <div className="text-center mb-4">
//           <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
//             <span className="brand-scissors me-2"><i className="fas fa-scissors" /></span>Stitch
//           </div>
//           <p className="text-muted small mb-0">Laundry & Fashion Operations</p>
//         </div>

//         <h5 className="fw-semibold mb-1">Welcome back</h5>
//         <p className="text-muted small mb-4">Sign in to continue</p>

//         {error && <div className="alert alert-danger py-2 small">{error}</div>}

//         <form onSubmit={handleSubmit}>
//           <div className="mb-3">
//             <label className="form-label small fw-medium">Email, username, or phone</label>
//             <input
//               type="text"
//               className="form-control"
//               value={identifier}
//               onChange={e => setIdentifier(e.target.value)}
//               placeholder="Email, username, or phone"
//               required
//               autoFocus
//             />
//           </div>
//           <div className="mb-4">
//             <label className="form-label small fw-medium">Password</label>
//             <input
//               type="password"
//               className="form-control"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//               placeholder="••••••••"
//               required
//             />
//             <div className="text-end mt-1">
//               <Link to="/forgot-password" className="text-muted small">Forgot password?</Link>
//             </div>
//           </div>
//           <button type="submit" className="btn btn-primary w-100" disabled={loading}>
//             {loading ? (
//               <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
//             ) : (
//               'Sign In'
//             )}
//           </button>
//         </form>

//         <hr className="my-3" />

//         <p className="text-muted small text-center mb-2">Demo Access</p>
//         <div className="row g-2">
//           {[
//             { role: 'admin', label: 'Admin', icon: 'fa-user-shield', cls: 'btn-outline-danger' },
//             { role: 'customer', label: 'Customer', icon: 'fa-user', cls: 'btn-outline-primary' },
//             { role: 'staff', label: 'Staff', icon: 'fa-id-badge', cls: 'btn-outline-info' },
//             { role: 'driver', label: 'Driver', icon: 'fa-car', cls: 'btn-outline-warning' },
//           ].map(d => (
//             <div key={d.role} className="col-6">
//               <button className={`btn ${d.cls} btn-sm w-100`} onClick={() => demoLogin(d.role as 'admin' | 'customer' | 'staff' | 'driver')}>
//                 <i className={`fas ${d.icon} me-1`} />{d.label}
//               </button>
//             </div>
//           ))}
//         </div>

//         <p className="text-center text-muted small mt-4 mb-0">
//           Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
//         </p>
//       </div>
//     </div>
//   );
// }



// // v2
// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link, useSearchParams } from 'react-router-dom';
// import { useAuth } from '@/context/AuthContext.tsx';
// import { subscriptionService } from '@/services/api.ts';
// import { useToast } from '@/context/ToastContext.tsx';

// export default function SignIn() {
//   const [identifier, setIdentifier] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const { signIn } = useAuth();
//   const toast = useToast();
//   const navigate = useNavigate();
//   const [params] = useSearchParams();

//   useEffect(() => {
//     const ref = params.get('reference') || params.get('trxref');
//     if (ref) {
//       (async () => {
//         try {
//           await subscriptionService.verifyCallback(ref);
//           toast.success('Subscription payment verified!');
//         } catch {
//           toast.info('Payment reference detected — please sign in to see your subscription status.');
//         }
//         window.history.replaceState({}, '', '/signin');
//       })();
//     }
//   }, [params, toast]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       const result = await signIn(identifier.trim().toLowerCase(), password);
//       if (result.success) {
//         const redirect = params.get('redirect') || '/dashboard';
//         navigate(redirect);
//       } else {
//         setError(result.error || 'Invalid credentials');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="auth-wrapper">
//       <div className="auth-card">
//         <div className="text-center mb-4">
//           <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
//             {/* <span className="brand-scissors me-2"><i className="fas fa-scissors" /></span>Stitch */}
//             <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" />
//           </div>
//           <p className="text-muted small mb-0">Digital infrastructure for Nigeria's laundry & fashion economy</p>
//         </div>

//         <h5 className="fw-semibold mb-1">Welcome back</h5>
//         <p className="text-muted small mb-4">Sign in to continue</p>

//         {error && <div className="alert alert-danger py-2 small">{error}</div>}

//         <form onSubmit={handleSubmit}>
//           <div className="mb-3">
//             <label className="form-label small fw-medium">Email, username, or phone</label>
//             <input
//               type="text"
//               className="form-control"
//               value={identifier}
//               onChange={e => setIdentifier(e.target.value)}
//               placeholder="Email, username, or phone"
//               required
//               autoFocus
//             />
//           </div>
//           <div className="mb-4">
//             <label className="form-label small fw-medium">Password</label>
//             <input
//               type="password"
//               className="form-control"
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//               placeholder="••••••••"
//               required
//             />
//             <div className="text-end mt-1">
//               <Link to="/forgot-password" className="text-muted small">Forgot password?</Link>
//             </div>
//           </div>
//           <button type="submit" className="btn btn-primary w-100" disabled={loading}>
//             {loading ? (
//               <><span className="spinner-border spinner-border-sm me-2" />Signing in…</>
//             ) : (
//               'Sign In'
//             )}
//           </button>
//         </form>

//         <p className="text-center text-muted small mt-4 mb-0">
//           Don't have an account? <Link to="/signup" className="text-primary">Sign up</Link>
//         </p>
//       </div>
//     </div>
//   );
// }




// v3
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.tsx';
import { subscriptionService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';
import PasswordInput from '@/components/shared/PasswordInput.tsx';

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
      <div className="auth-card">
        <div className="text-center mb-4">
          <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            <img src="/images/logos/stitch-logo.png" width="200" alt="Stitch Logo" />
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
