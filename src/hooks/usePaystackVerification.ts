// import { useCallback, useState } from 'react';
// import { subscriptionService } from '@/services/api';
// import { useToast } from '@/context/ToastContext';

// const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// export type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error' | 'none';

// export function usePaystackVerification() {
//   const toast = useToast();
//   const [status, setStatus] = useState<VerifyStatus>('idle');
//   const [message, setMessage] = useState('');

//   /** Reads reference/trxref from the current URL, verifies if present, cleans the URL after. */
//   const verifyFromUrl = useCallback(async (): Promise<boolean> => {
//     const params = new URLSearchParams(window.location.search);
//     const reference = params.get('reference') || params.get('trxref');

//     if (!reference) {
//       setStatus('none');
//       return false;
//     }

//     setStatus('verifying');
//     try {
//       await subscriptionService.verifyCallback(reference);
//       const pending = sessionStorage.getItem('pending_sub');
//       const info = pending ? JSON.parse(pending) : null;
//       sessionStorage.removeItem('pending_sub');

//       const msg = `${info?.is_renew ? 'Top-up complete' : 'Subscription active'}! ${info?.plan_name || ''}`;
//       setStatus('success');
//       setMessage(msg);
//       toast.success(msg);
//       return true;
//     } catch (err) {
//       const msg = 'Could not verify payment: ' + errMsg(err);
//       setStatus('error');
//       setMessage(msg);
//       toast.error(msg);
//       return true; // still "handled" — we found a reference, just verification failed
//     } finally {
//       // strip reference/trxref so a refresh doesn't re-trigger verification
//       const url = new URL(window.location.href);
//       url.searchParams.delete('reference');
//       url.searchParams.delete('trxref');
//       window.history.replaceState({}, '', url.pathname + url.search);
//     }
//   }, [toast]);

//   return { status, message, verifyFromUrl };
// }




// v2
import { useCallback, useState } from 'react';
import { subscriptionService, orderService, paymentService } from '@/services/api';
import { useToast } from '@/context/ToastContext';
import type { LaundryOrderCreatePayload } from '@/types/index';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

export type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error' | 'none';
export type VerifyTarget = '/subscriptions' | '/orders';

interface PendingOrder {
  reference: string;
  payload: Omit<LaundryOrderCreatePayload, 'payment_reference'>;
}

export function usePaystackVerification() {
  const toast = useToast();
  const [status, setStatus] = useState<VerifyStatus>('idle');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<VerifyTarget>('/subscriptions');

  /**
   * Reads reference/trxref from the current URL, verifies against whichever
   * pending context is staged in sessionStorage (pending_sub or pending_order),
   * completes the corresponding action, and cleans the URL after.
   */
  const verifyFromUrl = useCallback(async (): Promise<boolean> => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');

    if (!reference) {
      setStatus('none');
      return false;
    }

    const pendingOrderRaw = sessionStorage.getItem('pending_order');
    const pendingSubRaw = sessionStorage.getItem('pending_sub');

    setStatus('verifying');

    // ── Order payment: verify, then actually create the order ─────────────
    if (pendingOrderRaw) {
      setTarget('/orders');
      try {
        await paymentService.verify(reference);
        const pending: PendingOrder = JSON.parse(pendingOrderRaw);
        await orderService.create({ ...pending.payload, payment_reference: reference });
        sessionStorage.removeItem('pending_order');

        const msg = 'Payment confirmed! Your order has been placed.';
        setStatus('success');
        setMessage(msg);
        toast.success(msg);
        return true;
      } catch (err) {
        const msg = 'Payment verified, but we could not finalize your order: ' + errMsg(err);
        setStatus('error');
        setMessage(msg);
        toast.error(msg);
        return true;
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete('reference');
        url.searchParams.delete('trxref');
        window.history.replaceState({}, '', url.pathname + url.search);
      }
    }

    // ── Subscription payment: existing flow ─────────────────────────────
    setTarget('/subscriptions');
    try {
      await subscriptionService.verifyCallback(reference);
      const pending = pendingSubRaw ? JSON.parse(pendingSubRaw) : null;
      sessionStorage.removeItem('pending_sub');

      const msg = `${pending?.is_renew ? 'Top-up complete' : 'Subscription active'}! ${pending?.plan_name || ''}`;
      setStatus('success');
      setMessage(msg);
      toast.success(msg);
      return true;
    } catch (err) {
      const msg = 'Could not verify payment: ' + errMsg(err);
      setStatus('error');
      setMessage(msg);
      toast.error(msg);
      return true;
    } finally {
      const url = new URL(window.location.href);
      url.searchParams.delete('reference');
      url.searchParams.delete('trxref');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }, [toast]);

  return { status, message, target, verifyFromUrl };
}

