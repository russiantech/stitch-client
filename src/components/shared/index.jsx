import React from 'react';
import { STATUS_BADGE_MAP } from '../../services/mockData';

// ─── Status Badge ───────────────────────────────
export function StatusBadge({ status }) {
  const cls = STATUS_BADGE_MAP[status] || 'bg-secondary text-white';
  const isBs = cls.startsWith('bg-');
  return (
    <span className={`badge-status ${isBs ? `badge ${cls}` : cls}`}>
      {status}
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────
export function StatCard({ label, value, icon, iconBg = 'bg-primary', change, changeType = 'positive' }) {
  return (
    <div className="stat-card">
      <div className="d-flex align-items-start justify-content-between">
        <div>
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
          {change && (
            <div className={`stat-change ${changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
              <i className={`fas ${changeType === 'positive' ? 'fa-arrow-up' : 'fa-arrow-down'} me-1`} />
              {change}
            </div>
          )}
        </div>
        <div className={`stat-icon ${iconBg} bg-opacity-10`}>
          <i className={`fas ${icon} ${iconBg.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Table Card ──────────────────────────────────
export function TableCard({ title, actions, children }) {
  return (
    <div className="table-card">
      {(title || actions) && (
        <div className="table-card-header">
          {title && <h6 className="mb-0 fw-semibold">{title}</h6>}
          {actions && <div className="d-flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="table-responsive">
        {children}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────
export function EmptyState({ icon = 'fa-inbox', title = 'Nothing here yet', message }) {
  return (
    <div className="empty-state">
      <i className={`fas ${icon}`} />
      <h6 className="fw-semibold">{title}</h6>
      {message && <p className="mb-0 fs-sm">{message}</p>}
    </div>
  );
}

// ─── Loading Spinner ─────────────────────────────
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="spinner-overlay">
      <div className="text-center">
        <div className="spinner-border text-primary mb-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="text-muted small">{message}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog (using browser confirm for simplicity) ──
export function confirmAction(message) {
  return window.confirm(message);
}

// ─── Section Header ──────────────────────────────
export function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
      <div>
        <h4 className="mb-0 fw-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h4>
        {subtitle && <p className="text-muted mb-0 small mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="d-flex gap-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}

// ─── Order Timeline ──────────────────────────────
export function OrderTimeline({ statuses, currentStatus }) {
  const currentIndex = statuses.indexOf(currentStatus);
  return (
    <div className="order-timeline">
      {statuses.map((status, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={status} className={`timeline-step${isCompleted ? ' completed' : ''}${isActive ? ' active' : ''}`}>
            <div className="step-dot">
              {isCompleted && <i className="fas fa-check" style={{ fontSize: 8, color: '#fff', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />}
            </div>
            <div style={{ fontSize: 13, color: isActive ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>
              {status}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Media Preview Grid ──────────────────────────
export function MediaPreviewGrid({ files, onRemove }) {
  return (
    <div className="d-flex flex-wrap">
      {files.map((file, i) => (
        <div key={i} className="media-preview">
          {file.type?.startsWith('video') ? (
            <video src={file.preview} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
          ) : (
            <img src={file.preview} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
          )}
          {onRemove && (
            <button className="remove-media" onClick={() => onRemove(i)} type="button">
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Existing Image Grid (from API) ──────────────
export function ExistingMediaGrid({ images, productId, onRemove }) {
  return (
    <div className="d-flex flex-wrap">
      {images.map(img => (
        <div key={img.id} className="media-preview" data-id={img.id}>
          {img.url?.match(/\.(mp4|webm|ogg)$/i) ? (
            <video style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }}>
              <source src={img.url} type="video/mp4" />
            </video>
          ) : (
            <img src={img.url} alt="" style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8 }} />
          )}
          {onRemove && (
            <button className="remove-media" type="button" onClick={() => onRemove(img.id, productId)}>
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Category Badge Tag ──────────────────────────
export function CategoryTag({ name, onRemove }) {
  return (
    <span className="category-badge">
      {name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label="Remove">×</button>
      )}
    </span>
  );
}

// ─── Page Section Card ───────────────────────────
export function PageCard({ title, subtitle, actions, children, className = '' }) {
  return (
    <div className={`bg-white rounded-3 border p-4 mb-4 ${className}`}>
      {(title || actions) && (
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            {title && <h6 className="fw-semibold mb-0">{title}</h6>}
            {subtitle && <p className="text-muted small mb-0 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="d-flex gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
