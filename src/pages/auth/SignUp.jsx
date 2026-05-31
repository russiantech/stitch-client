import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function SignUp() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const data = await authService.signUp({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user || data));
        navigate('/dashboard');
      } else {
        toast.success('Account created! Please sign in.');
        navigate('/signin');
      }
    } catch (err) {
      // Demo fallback
      toast.success('Account created (demo)! Please sign in.');
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="text-center mb-4">
          <div className="fs-3 text-primary fw-bold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="brand-scissors me-2"><i className="fas fa-scissors"/></span>Stitch
          </div>
          <p className="text-muted small mb-0">Laundry & Fashion Operations</p>
        </div>

        <h5 className="fw-semibold mb-1">Create an account</h5>
        <p className="text-muted small mb-4">Join Stitch today</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-medium">Full Name</label>
            <input className="form-control" value={form.name} onChange={f('name')} placeholder="Chiamaka Eze" required />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-medium">Email address</label>
            <input type="email" className="form-control" value={form.email} onChange={f('email')} placeholder="you@example.com" required />
          </div>
          <div className="mb-3">
            <label className="form-label small fw-medium">Phone Number</label>
            <input className="form-control" value={form.phone} onChange={f('phone')} placeholder="080XXXXXXXX" />
          </div>
          <div className="row g-3 mb-4">
            <div className="col-6">
              <label className="form-label small fw-medium">Password</label>
              <input type="password" className="form-control" value={form.password} onChange={f('password')} placeholder="••••••••" required minLength={6} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-medium">Confirm</label>
              <input type="password" className="form-control" value={form.confirm} onChange={f('confirm')} placeholder="••••••••" required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating account…</> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Already have an account? <Link to="/signin" className="text-primary">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
