// import { useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { usePaystackVerification } from '@/hooks/usePaystackVerification';

// export default function PaymentCallback() {
//   const navigate = useNavigate();
//   const { status, message, verifyFromUrl } = usePaystackVerification();

//   useEffect(() => {
//     (async () => {
//       await verifyFromUrl();
//       setTimeout(() => navigate('/subscriptions', { replace: true }), 1200);
//     })();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return (
//     <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//       <div className="text-center">
//         {status === 'verifying' && (
//           <>
//             <div className="spinner-border mb-3" style={{ color: 'var(--primary)' }} />
//             <div className="fw-semibold">Verifying your payment…</div>
//           </>
//         )}
//         {status === 'success' && <div className="text-success fw-semibold">{message}</div>}
//         {status === 'error' && <div className="text-danger fw-semibold">{message}</div>}
//         <div className="text-muted small mt-2">Redirecting you back…</div>
//       </div>
//     </div>
//   );
// }







// v2
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaystackVerification } from '@/hooks/usePaystackVerification';

export default function PaymentCallback() {
  const navigate = useNavigate();
  const { status, message, target, verifyFromUrl } = usePaystackVerification();

  useEffect(() => {
    (async () => {
      await verifyFromUrl();
      setTimeout(() => navigate(target, { replace: true }), 1200);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="text-center">
        {status === 'verifying' && (
          <>
            <div className="spinner-border mb-3" style={{ color: 'var(--primary)' }} />
            <div className="fw-semibold">Verifying your payment…</div>
          </>
        )}
        {status === 'success' && <div className="text-success fw-semibold">{message}</div>}
        {status === 'error' && <div className="text-danger fw-semibold">{message}</div>}
        <div className="text-muted small mt-2">Redirecting you back…</div>
      </div>
    </div>
  );
}

