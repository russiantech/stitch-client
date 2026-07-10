
// src/pages/OrganizationSettings.tsx
import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/shared/index.tsx';
import { orgService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

export default function OrganizationSettings() {
  const toast = useToast();
  const [linkInfo, setLinkInfo] = useState<{ invite_code: string; invite_link: string; allow_public_signup: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = () => {
    setLoading(true);
    orgService.getInviteLink()
      .then(setLinkInfo)
      .catch(() => setLinkInfo(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const copyLink = () => {
    if (!linkInfo) return;
    navigator.clipboard.writeText(linkInfo.invite_link);
    toast.success('Invite link copied!');
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await orgService.resetInviteCode();
      toast.success('Invite code reset — the old code and link no longer work.');
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setResetting(false);
    }
  };

  const handleToggle = async () => {
    if (!linkInfo) return;
    setToggling(true);
    try {
      await orgService.togglePublicSignup(!linkInfo.allow_public_signup);
      toast.success(`Public signup ${!linkInfo.allow_public_signup ? 'enabled' : 'disabled'}.`);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <div className="text-muted small">Loading…</div>;

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader title="Organization Settings" subtitle="Manage how staff and customers join your organization" />

      <div className="bg-white rounded-3 border p-4 mb-3" data-tour="tour-invite-link">
        <h6 className="fw-semibold mb-3">Invite Code & Link</h6>

        {linkInfo ? (
          <>
            <label className="form-label small fw-medium">Invite Code</label>
            <div className="input-group mb-3">
              <input className="form-control" value={linkInfo.invite_code} readOnly />
              <button className="btn btn-outline-secondary" onClick={() => { navigator.clipboard.writeText(linkInfo.invite_code); toast.success('Code copied!'); }}>
                <i className="fas fa-copy" />
              </button>
            </div>

            <label className="form-label small fw-medium">Invite Link</label>
            <div className="input-group mb-3">
              <input className="form-control" value={linkInfo.invite_link} readOnly style={{ fontSize: 12 }} />
              <button className="btn btn-outline-secondary" onClick={copyLink}>
                <i className="fas fa-copy" />
              </button>
            </div>

            <div className="d-flex align-items-center justify-content-between border-top pt-3 mb-3">
              <div>
                <div className="fw-medium small">Allow public signup via this link</div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                  If off, this code/link only works for accounts you create or invite directly.
                </div>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input" type="checkbox" role="switch"
                  checked={linkInfo.allow_public_signup} onChange={handleToggle} disabled={toggling}
                  style={{ width: 42, height: 22 }}
                />
              </div>
            </div>

            <button className="btn btn-outline-danger btn-sm" onClick={handleReset} disabled={resetting}>
              {resetting ? <><span className="spinner-border spinner-border-sm me-2" />Resetting…</> : <><i className="fas fa-rotate me-2" />Reset Invite Code</>}
            </button>
            <p className="text-muted small mt-2 mb-0">
              Resetting invalidates the current code/link — anyone with the old one can no longer join.
            </p>
          </>
        ) : (
          <div className="text-muted small">Could not load invite settings.</div>
        )}
      </div>
    </div>
  );
}

