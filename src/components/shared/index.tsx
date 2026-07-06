import React, { ReactNode } from 'react';
import { STATUS_BADGE_MAP } from '@/services/mockData';

// ─── Status Badge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_MAP[status as keyof typeof STATUS_BADGE_MAP] ?? 'bg-secondary text-white';
  const isBs = cls.startsWith('bg-');
  return <span className={`badge-status ${isBs ? `badge ${cls}` : cls}`}>{status}</span>;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: string | number; icon: string;
  iconBg?: string; change?: string; changeType?: 'positive' | 'negative';
}
export function StatCard({ label, value, icon, iconBg='bg-primary', change, changeType='positive' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {change && (
            <div className={`stat-change ${changeType==='positive'?'text-success':'text-danger'}`}>
              <i className={`fas ${changeType==='positive'?'fa-arrow-up':'fa-arrow-down'} me-1`}/>{change}
            </div>
          )}
        </div>
        <div className={`stat-icon ${iconBg} bg-opacity-10`} style={{width:44,height:44}}>
          <i className={`fas ${icon} ${iconBg.replace('bg-','text-')}`}/>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon='fa-inbox', title='Nothing here yet', message }:
  { icon?: string; title?: string; message?: string }) {
  return (
    <div className="empty-state">
      <i className={`fas ${icon}`}/>
      <h6 className="fw-semibold">{title}</h6>
      {message && <p className="mb-0 small">{message}</p>}
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
export function LoadingSpinner({ message='Loading…' }: { message?: string }) {
  return (
    <div className="spinner-overlay">
      <div className="text-center">
        <div className="spinner-border mb-2" role="status" style={{color:'var(--primary)'}}>
          <span className="visually-hidden">Loading…</span>
        </div>
        <div className="text-muted small">{message}</div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, actions }: {
  title: string; subtitle?: string; actions?: ReactNode;
}) {
  return (
    <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h4 className="mb-0 fw-semibold" style={{fontFamily:'var(--font-heading)'}}>{title}</h4>
        {subtitle && <p className="text-muted mb-0 small mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Order Timeline ───────────────────────────────────────────────────────────
export function OrderTimeline({ statuses, currentStatus }: {
  statuses: readonly string[]; currentStatus: string;
}) {
  const currentIndex = statuses.indexOf(currentStatus);
  return (
    <div className="order-timeline">
      {statuses.map((status, i) => {
        const done   = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={status} className={`timeline-step${done?' completed':''}${active?' active':''}`}>
            <div className="step-dot">
              {done && <i className="fas fa-check" style={{fontSize:8,color:'#fff',position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}}/>}
            </div>
            <div style={{fontSize:13, color: active?'var(--primary)': done?'var(--success)':'var(--text-muted)'}}>
              {status}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Media Preview Grid ───────────────────────────────────────────────────────
interface FilePreviewItem { file: File; preview: string; type: string; }
export function MediaPreviewGrid({ files, onRemove }: {
  files: FilePreviewItem[]; onRemove?: (i: number) => void;
}) {
  return (
    <div className="d-flex flex-wrap">
      {files.map((f, i) => (
        <div key={i} className="media-preview">
          {f.type?.startsWith('video')
            ? <video src={f.preview} style={{width:90,height:90,objectFit:'cover',borderRadius:8}}/>
            : <img src={f.preview} alt="" style={{width:90,height:90,objectFit:'cover',borderRadius:8}}/>
          }
          {onRemove && (
            <button className="remove-media" type="button" onClick={() => onRemove(i)}>
              <i className="fas fa-times"/>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}


// ─── Existing Media Grid ───────────────────────────────────────────────────────

interface ExistingMediaItem {
  id?: string | number;
  url: string;
  type?: string;
  name?: string;
}

export function ExistingMediaGrid({
  media,
  onRemove,
}: {
  media: ExistingMediaItem[];
  onRemove?: (item: ExistingMediaItem, index: number) => void;
}) {
  if (!media?.length) return null;

  return (
    <div className="d-flex flex-wrap">
      {media.map((item, index) => {
        const isVideo =
          item.type?.startsWith('video') ||
          /\.(mp4|webm|ogg|mov)$/i.test(item.url);

        return (
          <div
            key={item.id ?? index}
            className="media-preview position-relative"
          >
            {isVideo ? (
              <video
                src={item.url}
                controls
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            ) : (
              <img
                src={item.url}
                alt={item.name || 'Media'}
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
              />
            )}

            {onRemove && (
              <button
                type="button"
                className="remove-media"
                onClick={() => onRemove(item, index)}
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}


// ─── Category Tag ─────────────────────────────────────────────────────────────
export function CategoryTag({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="category-badge">
      {name}
      {onRemove && <button type="button" onClick={onRemove}>×</button>}
    </span>
  );
}

// ─── Page Card ────────────────────────────────────────────────────────────────
export function PageCard({ title, subtitle, actions, children, className='' }: {
  title?: string; subtitle?: string; actions?: ReactNode;
  children: ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white rounded-3 border p-4 mb-4 ${className}`}>
      {(title || actions) && (
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            {title    && <h6 className="fw-semibold mb-0">{title}</h6>}
            {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="d-flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Table Card ───────────────────────────────────────────────────────────────
export function TableCard({ title, actions, children }: {
  title?: string; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <div className="table-card">
      {(title || actions) && (
        <div className="table-card-header">
          {title && <h6 className="mb-0 fw-semibold">{title}</h6>}
          {actions && <div className="d-flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="table-responsive">{children}</div>
    </div>
  );
}