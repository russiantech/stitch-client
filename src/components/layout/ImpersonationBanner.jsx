import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function ImpersonationBanner() {
  const { user, originalUser, isImpersonating, exitImpersonation } = useAuth();
  const toast  = useToast();
  const nav    = useNavigate();

  if (!isImpersonating) return null;

  const handleExit = async () => {
    await exitImpersonation();
    toast.success(`Returned to your account (${originalUser?.name})`);
    nav('/admin/users');
  };

  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 200,
        background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
        color: '#fff',
      }}
    >
      <div className="container-fluid d-flex align-items-center gap-3 py-2 px-3">
        <i className="fas fa-user-secret fs-5 flex-shrink-0" />
        <div className="flex-1 small">
          <span className="fw-semibold">Impersonating</span>
          {' — '}you are acting as <strong>{user?.name}</strong>
          {' '}({user?.email}). All actions are performed on their behalf.
        </div>
        <button
          className="btn btn-sm btn-dark flex-shrink-0"
          onClick={handleExit}
          style={{ fontSize: 12 }}
        >
          <i className="fas fa-sign-out-alt me-1" />
          Exit — return to {originalUser?.name?.split(' ')[0]}
        </button>
      </div>
    </div>
  );
}
