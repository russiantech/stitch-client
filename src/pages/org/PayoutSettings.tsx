// // src/pages/PayoutSettings.tsx
// import React, { useEffect, useState } from 'react';
// import { SectionHeader } from '@/components/shared/index.tsx';
// import { payoutService } from '@/services/api.ts';
// import { useToast } from '@/context/ToastContext.tsx';

// const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// const PROVIDERS = [
//   { value: 'opay', label: 'OPay', icon: 'fa-wallet' },
//   { value: 'paystack', label: 'Paystack', icon: 'fa-credit-card' },
// ];

// export default function PayoutSettings() {
//   const toast = useToast();
//   const [provider, setProvider] = useState('opay');
//   const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
//   const [bankCode, setBankCode] = useState('');
//   const [accountNumber, setAccountNumber] = useState('');
//   const [resolvedName, setResolvedName] = useState<string | null>(null);
//   const [resolving, setResolving] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [status, setStatus] = useState<Awaited<ReturnType<typeof payoutService.status>> | null>(null);
//   const [loadingStatus, setLoadingStatus] = useState(true);

//   useEffect(() => {
//     payoutService.status()
//       .then(setStatus)
//       .catch(() => setStatus(null))
//       .finally(() => setLoadingStatus(false));
//   }, []);

//   useEffect(() => {
//     payoutService.banks(provider).then(setBanks).catch(() => setBanks([]));
//     setBankCode(''); setAccountNumber(''); setResolvedName(null);
//   }, [provider]);

//   useEffect(() => {
//     setResolvedName(null);
//     if (accountNumber.length !== 10 || !bankCode) return;
//     const t = setTimeout(async () => {
//       setResolving(true);
//       try {
//         const res = await payoutService.resolveAccount({ provider, account_number: accountNumber, bank_code: bankCode });
//         setResolvedName(res.account_name);
//       } catch {
//         setResolvedName(null);
//       } finally {
//         setResolving(false);
//       }
//     }, 500);
//     return () => clearTimeout(t);
//   }, [accountNumber, bankCode, provider]);

//   const handleSave = async () => {
//     if (!resolvedName) return toast.error('Please enter a valid account number and bank.');
//     setSaving(true);
//     try {
//       const res = await payoutService.setup({
//         provider, account_number: accountNumber, bank_code: bankCode, platform_fee_percent: 0,
//       });
//       toast.success(`Payout account set up: ${res.account_name}`);
//       setStatus(await payoutService.status());
//     } catch (err) {
//       toast.error(errMsg(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 640 }}>
//       <SectionHeader
//         title="Payout Settings"
//         subtitle="Set up where your customer payments are sent — funds settle automatically within 24 hours."
//       />

//       {!loadingStatus && status?.configured && (
//         <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
//           <i className="fas fa-check-circle" />
//           <div>
//             Payouts active via <strong>{PROVIDERS.find(p => p.value === status.provider)?.label}</strong> —{' '}
//             {status.account_name} ({status.account_number})
//           </div>
//         </div>
//       )}

//       <div className="bg-white rounded-3 border p-4">
//         <label className="form-label small fw-medium">Payment Provider</label>
//         <div className="row g-2 mb-4">
//           {PROVIDERS.map(p => (
//             <div key={p.value} className="col-6">
//               <div
//                 className={`border rounded-3 p-3 text-center ${provider === p.value ? 'border-primary border-2 bg-primary bg-opacity-10' : ''}`}
//                 style={{ cursor: 'pointer' }}
//                 onClick={() => setProvider(p.value)}
//               >
//                 <i className={`fas ${p.icon} d-block mb-1`} style={{ fontSize: 20, color: 'var(--primary)' }} />
//                 <div className="small fw-medium">{p.label}</div>
//                 {p.value === 'opay' && <div className="text-muted" style={{ fontSize: 10 }}>Recommended</div>}
//               </div>
//             </div>
//           ))}
//         </div>

//         <label className="form-label small fw-medium">Bank</label>
//         <select className="form-select mb-3" value={bankCode} onChange={e => setBankCode(e.target.value)}>
//           <option value="">Select your bank…</option>
//           {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
//         </select>

//         <label className="form-label small fw-medium">Account Number</label>
//         <input
//           className="form-control mb-2"
//           value={accountNumber}
//           onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
//           placeholder="0123456789"
//           maxLength={10}
//         />

//         {resolving && <div className="text-muted small mb-3"><span className="spinner-border spinner-border-sm me-2" />Verifying account…</div>}
//         {resolvedName && (
//           <div className="alert alert-success py-2 small mb-3">
//             <i className="fas fa-check-circle me-2" />Account name: <strong>{resolvedName}</strong>
//           </div>
//         )}
//         {!resolving && accountNumber.length === 10 && bankCode && !resolvedName && (
//           <div className="alert alert-danger py-2 small mb-3">
//             <i className="fas fa-exclamation-circle me-2" />Could not verify this account. Please check the details.
//           </div>
//         )}

//         <button className="btn btn-primary w-100" onClick={handleSave} disabled={!resolvedName || saving}>
//           {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : 'Save Payout Details'}
//         </button>

//         <p className="text-muted small mt-3 mb-0">
//           <i className="fas fa-info-circle me-1" />
//           Payments from your customers are split automatically — your share settles directly
//           to this account, typically within 24 hours. Stitch never holds your funds.
//         </p>
//       </div>
//     </div>
//   );
// }




// // v2
// import React, { useEffect, useState } from 'react';
// import { SectionHeader } from '@/components/shared/index.tsx';
// import { payoutService } from '@/services/api.ts';
// import { useToast } from '@/context/ToastContext.tsx';

// const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

// // const PROVIDERS = [
// //   { value: 'opay', label: 'OPay', icon: 'fa-wallet', enabled: true, badge: 'Recommended' },
// //   { value: 'paystack', label: 'Paystack', icon: 'fa-credit-card', enabled: true, badge: null },
// //   { value: 'palmpay', label: 'PalmPay', icon: 'fa-mobile-alt', enabled: false, badge: 'Coming soon' },
// //   { value: 'flutterwave', label: 'Flutterwave', icon: 'fa-water', enabled: false, badge: 'Coming soon' },
// // ];

// const PROVIDERS = [
//   { value: 'paystack', label: 'Paystack', icon: 'fa-credit-card', enabled: true, badge: null },
//   { value: 'opay', label: 'OPay', icon: 'fa-wallet', enabled: false, badge: 'Setup pending' },
//   { value: 'palmpay', label: 'PalmPay', icon: 'fa-mobile-alt', enabled: false, badge: 'Coming soon' },
//   { value: 'flutterwave', label: 'Flutterwave', icon: 'fa-water', enabled: false, badge: 'Coming soon' },
// ];

// export default function PayoutSettings() {
//   const toast = useToast();
//   // const [provider, setProvider] = useState('opay');
//   // Default to the first enabled provider
//   const [provider, setProvider] = useState(() => 
//     PROVIDERS.find(p => p.enabled)?.value ?? 'paystack'
//   );
  
//   const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
//   const [banksError, setBanksError] = useState<string | null>(null);
//   const [loadingBanks, setLoadingBanks] = useState(false);
//   const [bankCode, setBankCode] = useState('');
//   const [accountNumber, setAccountNumber] = useState('');
//   const [resolvedName, setResolvedName] = useState<string | null>(null);
//   const [resolveError, setResolveError] = useState<string | null>(null);
//   const [resolving, setResolving] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [status, setStatus] = useState<Awaited<ReturnType<typeof payoutService.status>> | null>(null);
//   const [loadingStatus, setLoadingStatus] = useState(true);

//   useEffect(() => {
//     payoutService.status()
//       .then(setStatus)
//       .catch(() => setStatus(null))
//       .finally(() => setLoadingStatus(false));
//   }, []);

//   useEffect(() => {
//     setBankCode(''); setAccountNumber(''); setResolvedName(null); setResolveError(null); setBanksError(null);
//     setLoadingBanks(true);
//     payoutService.banks(provider)
//       .then(setBanks)
//       .catch(err => setBanksError(errMsg(err)))
//       .finally(() => setLoadingBanks(false));
//   }, [provider]);

//   useEffect(() => {
//     setResolvedName(null);
//     setResolveError(null);
//     if (accountNumber.length !== 10 || !bankCode) return;
//     const t = setTimeout(async () => {
//       setResolving(true);
//       try {
//         const res = await payoutService.resolveAccount({ provider, account_number: accountNumber, bank_code: bankCode });
//         setResolvedName(res.account_name);
//       } catch (err) {
//         setResolveError(errMsg(err));
//         setResolvedName(null);
//       } finally {
//         setResolving(false);
//       }
//     }, 500);
//     return () => clearTimeout(t);
//   }, [accountNumber, bankCode, provider]);

//   const handleSave = async () => {
//     if (!resolvedName) return toast.error('Please resolve a valid account first.');
//     setSaving(true);
//     try {
//       const res = await payoutService.setup({
//         provider, account_number: accountNumber, bank_code: bankCode, platform_fee_percent: 0,
//       });
//       toast.success(`Payout account set up: ${res.account_name}`);
//       setStatus(await payoutService.status());
//     } catch (err) {
//       toast.error(errMsg(err));
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div style={{ maxWidth: 640 }}>
//       <SectionHeader
//         title="Payout Settings"
//         subtitle="Set up where your customer payments are sent — funds settle automatically within 24 hours."
//       />

//       {!loadingStatus && status?.configured && (
//         <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
//           <i className="fas fa-check-circle" />
//           <div>
//             Payouts active via <strong>{PROVIDERS.find(p => p.value === status.provider)?.label ?? status.provider}</strong> —{' '}
//             {status.account_name} ({status.account_number})
//           </div>
//         </div>
//       )}

//       <div className="bg-white rounded-3 border p-4">
//         <label className="form-label small fw-medium">Payment Provider</label>
//         <div className="row g-2 mb-4">
//           {PROVIDERS.map(p => (
//             <div key={p.value} className="col-6 col-md-3">
//               <div
//                 className={`border rounded-3 p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center ${
//                   provider === p.value ? 'border-primary border-2 bg-primary bg-opacity-10' : ''
//                 } ${!p.enabled ? 'opacity-50' : ''}`}
//                 style={{ cursor: p.enabled ? 'pointer' : 'not-allowed', minHeight: 88 }}
//                 onClick={() => p.enabled && setProvider(p.value)}
//               >
//                 <i className={`fas ${p.icon} d-block mb-1`} style={{ fontSize: 20, color: 'var(--primary)' }} />
//                 <div className="small fw-medium">{p.label}</div>
//                 {p.badge && (
//                   <div className="text-muted" style={{ fontSize: 10 }}>{p.badge}</div>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         <label className="form-label small fw-medium">Bank</label>
//         {loadingBanks ? (
//           <div className="form-control mb-3 text-muted small d-flex align-items-center" style={{ height: 38 }}>
//             <span className="spinner-border spinner-border-sm me-2" />Loading banks…
//           </div>
//         ) : banksError ? (
//           <div className="alert alert-danger py-2 small mb-3">
//             <i className="fas fa-exclamation-circle me-2" />Could not load banks: {banksError}
//           </div>
//         ) : (
//           <select className="form-select mb-3" value={bankCode} onChange={e => setBankCode(e.target.value)}>
//             <option value="">Select your bank…</option>
//             {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
//           </select>
//         )}

//         <label className="form-label small fw-medium">Account Number</label>
//         <input
//           className="form-control mb-2"
//           value={accountNumber}
//           onChange={e => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
//           placeholder="0123456789"
//           maxLength={10}
//         />

//         {resolving && (
//           <div className="text-muted small mb-3">
//             <span className="spinner-border spinner-border-sm me-2" />Verifying account…
//           </div>
//         )}
//         {resolvedName && (
//           <div className="alert alert-success py-2 small mb-3">
//             <i className="fas fa-check-circle me-2" />Account name: <strong>{resolvedName}</strong>
//           </div>
//         )}
//         {!resolving && resolveError && (
//           <div className="alert alert-danger py-2 small mb-3">
//             <i className="fas fa-exclamation-circle me-2" />Could not verify this account: {resolveError}
//           </div>
//         )}

//         <button className="btn btn-primary w-100" onClick={handleSave} disabled={!resolvedName || saving}>
//           {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : 'Save Payout Details'}
//         </button>

//         <p className="text-muted small mt-3 mb-0">
//           <i className="fas fa-info-circle me-1" />
//           Payments from your customers are split automatically — your share settles directly
//           to this account, typically within 24 hours. Stitch never holds your funds.
//         </p>
//       </div>
//     </div>
//   );
// }





// v3
// v3 - Fixed initialization and validation flow
import React, { useEffect, useState } from 'react';
import { SectionHeader } from '@/components/shared/index.tsx';
import { payoutService } from '@/services/api.ts';
import { useToast } from '@/context/ToastContext.tsx';

const errMsg = (err: unknown): string => (err instanceof Error ? err.message : 'Something went wrong');

const PROVIDERS = [
  { value: 'paystack', label: 'Paystack', icon: 'fa-credit-card', enabled: true, badge: null },
  { value: 'opay', label: 'OPay', icon: 'fa-wallet', enabled: false, badge: 'Setup pending' },
  { value: 'palmpay', label: 'PalmPay', icon: 'fa-mobile-alt', enabled: false, badge: 'Coming soon' },
  { value: 'flutterwave', label: 'Flutterwave', icon: 'fa-water', enabled: false, badge: 'Coming soon' },
];

// Get default provider outside component for consistency
const DEFAULT_PROVIDER = PROVIDERS.find(p => p.enabled)?.value ?? 'paystack';

export default function PayoutSettings() {
  const toast = useToast();
  
  // Explicit initialization with the enabled provider
  const [provider, setProvider] = useState(DEFAULT_PROVIDER);
  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [banksError, setBanksError] = useState<string | null>(null);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof payoutService.status>> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Debug: log current state
  useEffect(() => {
    console.log('Current provider:', provider);
    console.log('Current bankCode:', bankCode);
    console.log('Current accountNumber:', accountNumber);
    console.log('Current resolvedName:', resolvedName);
  });

  useEffect(() => {
    payoutService.status()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoadingStatus(false));
  }, []);

  // Load banks when provider changes
  useEffect(() => {
    console.log('Provider changed, loading banks for:', provider);
    setBankCode(''); 
    setAccountNumber(''); 
    setResolvedName(null); 
    setResolveError(null); 
    setBanksError(null);
    setLoadingBanks(true);
    
    payoutService.banks(provider)
      .then((data) => {
        console.log('Banks loaded:', data);
        setBanks(data);
      })
      .catch(err => {
        console.error('Banks error:', err);
        setBanksError(errMsg(err));
      })
      .finally(() => setLoadingBanks(false));
  }, [provider]);

  // Resolve account when accountNumber or bankCode changes
  useEffect(() => {
    console.log('Resolve effect triggered:', { accountNumber, bankCode });
    setResolvedName(null);
    setResolveError(null);
    
    if (accountNumber.length !== 10 || !bankCode) {
      console.log('Skipping resolve - invalid input');
      return;
    }
    
    const t = setTimeout(async () => {
      console.log('Resolving account...');
      setResolving(true);
      try {
        const res = await payoutService.resolveAccount({ 
          provider, 
          account_number: accountNumber, 
          bank_code: bankCode 
        });
        console.log('Account resolved:', res);
        setResolvedName(res.account_name);
        setResolveError(null);
      } catch (err) {
        console.error('Resolve error:', err);
        setResolveError(errMsg(err));
        setResolvedName(null);
      } finally {
        setResolving(false);
      }
    }, 500);
    
    return () => clearTimeout(t);
  }, [accountNumber, bankCode, provider]);

  const handleSave = async () => {
    console.log('Save clicked:', { resolvedName, bankCode, accountNumber });
    if (!resolvedName) {
      toast.error('Please resolve a valid account first.');
      return;
    }
    
    setSaving(true);
    try {
      const res = await payoutService.setup({
        provider, 
        account_number: accountNumber, 
        bank_code: bankCode, 
        platform_fee_percent: 0,
      });
      toast.success(`Payout account set up: ${res.account_name}`);
      setStatus(await payoutService.status());
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!resolvedName && !saving;

  return (
    <div style={{ maxWidth: 640 }}>
      <SectionHeader
        title="Payout Settings"
        subtitle="Set up where your customer payments are sent — funds settle automatically within 24 hours."
      />

      {!loadingStatus && status?.configured && (
        <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
          <i className="fas fa-check-circle" />
          <div>
            Payouts active via <strong>{PROVIDERS.find(p => p.value === status.provider)?.label ?? status.provider}</strong> —{' '}
            {status.account_name} ({status.account_number})
          </div>
        </div>
      )}

      <div className="bg-white rounded-3 border p-4">
        <label className="form-label small fw-medium">Payment Provider</label>
        {/* <div className="row g-2 mb-4">
          {PROVIDERS.map(p => (
            <div key={p.value} className="col-6 col-md-3">
              <div
                className={`border rounded-3 p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center ${
                  provider === p.value ? 'border-primary border-2 bg-primary bg-opacity-10' : ''
                } ${!p.enabled ? 'opacity-50' : ''}`}
                style={{ cursor: p.enabled ? 'pointer' : 'not-allowed', minHeight: 88 }}
                onClick={() => {
                  if (p.enabled) {
                    console.log('Switching provider to:', p.value);
                    setProvider(p.value);
                  }
                }}
              >
                <i className={`fas ${p.icon} d-block mb-1`} style={{ fontSize: 20, color: 'var(--primary)' }} />
                <div className="small fw-medium">{p.label}</div>
                {p.badge && (
                  <div className="text-muted" style={{ fontSize: 10 }}>{p.badge}</div>
                )}
              </div>
            </div>
          ))}
        </div> */}

        <div className="row g-2 mb-4">
          {PROVIDERS.map(p => {
            const isSelected = provider === p.value;
            return (
              <div key={p.value} className="col-6 col-md-3">
                <div
                  className={`border rounded-3 p-3 text-center h-100 d-flex flex-column align-items-center justify-content-center ${
                    isSelected ? 'border-primary border-2 bg-primary' : ''
                  } ${!p.enabled ? 'opacity-50' : ''}`}
                  style={{ cursor: p.enabled ? 'pointer' : 'not-allowed', minHeight: 88 }}
                  onClick={() => p.enabled && setProvider(p.value)}
                >
                  <i 
                    className={`fas ${p.icon} d-block mb-1`} 
                    style={{ fontSize: 20, color: isSelected ? '#fff' : 'var(--primary)' }} 
                  />
                  <div className={`small fw-medium ${isSelected ? 'text-white' : ''}`}>
                    {p.label}
                  </div>
                  {p.badge && (
                    <div className={isSelected ? 'text-white-50' : 'text-muted'} style={{ fontSize: 10 }}>
                      {p.badge}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <label className="form-label small fw-medium">Bank</label>
        {loadingBanks ? (
          <div className="form-control mb-3 text-muted small d-flex align-items-center" style={{ height: 38 }}>
            <span className="spinner-border spinner-border-sm me-2" />Loading banks…
          </div>
        ) : banksError ? (
          <div className="alert alert-danger py-2 small mb-3">
            <i className="fas fa-exclamation-circle me-2" />Could not load banks: {banksError}
          </div>
        ) : (
          <select 
            className="form-select mb-3" 
            value={bankCode} 
            onChange={e => {
              console.log('Bank selected:', e.target.value);
              setBankCode(e.target.value);
            }}
          >
            <option value="">Select your bank…</option>
            {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
        )}

        <label className="form-label small fw-medium">Account Number</label>
        <input
          className="form-control mb-2"
          value={accountNumber}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            console.log('Account number input:', val);
            setAccountNumber(val);
          }}
          placeholder="0123456789"
          maxLength={10}
        />

        {resolving && (
          <div className="text-muted small mb-3">
            <span className="spinner-border spinner-border-sm me-2" />Verifying account…
          </div>
        )}
        {resolvedName && (
          <div className="alert alert-success py-2 small mb-3">
            <i className="fas fa-check-circle me-2" />Account name: <strong>{resolvedName}</strong>
          </div>
        )}
        {!resolving && resolveError && (
          <div className="alert alert-danger py-2 small mb-3">
            <i className="fas fa-exclamation-circle me-2" />Could not verify this account: {resolveError}
          </div>
        )}

        <button 
          className="btn btn-primary w-100" 
          onClick={handleSave} 
          disabled={!canSave}
        >
          {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : 'Save Payout Details'}
        </button>

        {/* Debug info - remove in production */}
        <div className="mt-3 p-2 bg-light rounded small" style={{ fontSize: 10 }}>
          <strong>Debug:</strong> provider={provider} | bank={bankCode || 'none'} | acct={accountNumber || 'none'} | resolved={resolvedName || 'no'}
        </div>

        <p className="text-muted small mt-3 mb-0">
          <i className="fas fa-info-circle me-1" />
          Payments from your customers are split automatically — your share settles directly
          to this account, typically within 24 hours. Stitch never holds your funds.
        </p>
      </div>
    </div>
  );
}

