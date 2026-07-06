// src/components/GlobalPaymentDetector.tsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function GlobalPaymentDetector() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('reference') || params.get('trxref');
    if (!ref) return;

    // Already on the dedicated callback page or the Subscriptions page — let them handle it themselves.
    if (location.pathname === '/payment/callback' || location.pathname === '/subscriptions') return;

    // Landed somewhere else (e.g. root "/") with payment params — forward to the callback page.
    navigate(`/payment/callback${location.search}`, { replace: true });
  }, [location, navigate]);

  return null;
}
