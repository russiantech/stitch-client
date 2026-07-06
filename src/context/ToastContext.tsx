import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'danger' | 'info' | 'warning';

interface Toast { id: number; message: string; type: ToastType; }

interface ToastApi {
  success: (msg: string) => void;
  error:   (msg: string) => void;
  info:    (msg: string) => void;
  warning: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);

  const toast: ToastApi = {
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'danger'),
    info:    (m) => add(m, 'info'),
    warning: (m) => add(m, 'warning'),
  };

  const icons: Record<ToastType, string> = {
    success: 'fa-check-circle', danger: 'fa-exclamation-circle',
    info: 'fa-info-circle', warning: 'fa-exclamation-triangle',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:9999, minWidth:280, maxWidth:360 }}>
        {toasts.map(t => (
          <div key={t.id} className={`alert alert-${t.type} d-flex align-items-center gap-2 shadow-sm mb-2`}>
            <i className={`fas ${icons[t.type]} flex-shrink-0`} />
            <span className="small">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

