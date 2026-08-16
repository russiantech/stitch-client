// v2
// src/App.tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { AppDataProvider } from './context/AppDataContext.tsx';
import AppShell from './components/layout/AppShell.tsx';
import UpdateToast from './components/pwa/UpdateToast.tsx';

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

// Auth
const SignIn            = lazy(() => import('./pages/auth/SignIn.tsx'));
const SignUp            = lazy(() => import('./pages/auth/SignUp.tsx'));
const ForgotPassword    = lazy(() => import('./pages/auth/ForgotPassword.tsx'));
const LandingPage       = lazy(() => import('./pages/landing/LandingPage.tsx'));


// Customers
const CustomerDashboard = lazy(() => import('./pages/customer/Dashboard.tsx'));
const MyOrders          = lazy(() => import('./pages/customer/MyOrders.tsx'));
const CreateOrder       = lazy(() => import('./pages/customer/CreateOrder.tsx'));
const FashionRequest    = lazy(() => import('./pages/customer/FashionRequest.tsx'));
const Payments          = lazy(() => import('./pages/customer/Payments.tsx'));
const PaymentCallback   = lazy(() => import('./pages/payments/PaymentCallback.tsx'));
const Profile           = lazy(() => import('./pages/customer/Profile.tsx'));
const Subscriptions     = lazy(() => import('./pages/customer/Subscriptions.tsx'));

// Organization
const PayoutSettings   = lazy(() => import('./pages/org/PayoutSettings.tsx'));
const AcceptInvite     = lazy(() => import('./pages/org/AcceptInvite.tsx'));
const Settings         = lazy(() => import('./pages/org/Settings.tsx'));

// Operations
const OpsDashboard      = lazy(() => import('./pages/operations/OpsDashboard.tsx'));
const LaundryOrders     = lazy(() => import('./pages/operations/LaundryOrders.tsx'));
const FashionOrders     = lazy(() => import('./pages/operations/FashionOrders.tsx'));
const Pickups           = lazy(() => import('./pages/operations/Pickups.tsx'));
const Deliveries        = lazy(() => import('./pages/operations/Deliveries.tsx'));
const FashionCatalog    = lazy(() => import('./pages/fashion/FashionCatalog.tsx'));
const AdminUsers        = lazy(() => import('./pages/admin/AdminUsers.tsx'));
const AdminPlans        = lazy(() => import('./pages/admin/AdminPlans.tsx'));
const PricingSettings   = lazy(() => import('./pages/admin/PricingSettings.tsx'));
const UsageRecording    = lazy(() => import('./pages/admin/UsageRecording.tsx'));
const CRM               = lazy(() => import('./pages/crm/CRM.tsx'));
const Inventory         = lazy(() => import('./pages/inventory/Inventory.tsx'));
const Billing           = lazy(() => import('./pages/billing/Billing.tsx'));
const Analytics         = lazy(() => import('./pages/analytics/Analytics.tsx'));
const StaffPortal       = lazy(() => import('./pages/staff/StaffPortal.tsx'));
const DriverPortal      = lazy(() => import('./pages/driver/DriverPortal.tsx'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
    <div className="text-center">
      <div className="spinner-border mb-3" role="status" style={{ color: 'var(--primary)' }} />
      <div className="text-muted small">Loading…</div>
    </div>
  </div>
);

// ─── Guards ───────────────────────────────────────────────────────────────────
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border mb-3" role="status" style={{ color: 'var(--primary)' }} />
        <div className="text-muted small" style={{ fontFamily: 'var(--font-heading)' }}>
          Loading Stitch…
        </div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/signin" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ─── Route helper ─────────────────────────────────────────────────────────────
const P = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <PrivateRoute>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </PrivateRoute>
);

const PUB = (Component: React.LazyExoticComponent<React.ComponentType>) => (
  <PublicRoute>
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  </PublicRoute>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signin" element={PUB(SignIn)} />
      <Route path="/signup" element={PUB(SignUp)} />
      <Route path="/forgot-password" element={PUB(ForgotPassword)} />
      <Route path="/" element={PUB(LandingPage)} />

      {/* Customer */}
      <Route path="/dashboard"     element={P(CustomerDashboard)} />
      <Route path="/orders"        element={P(MyOrders)} />
      <Route path="/orders/new"    element={P(CreateOrder)} />
      <Route path="/fashion/new"   element={P(FashionRequest)} />
      <Route path="/payments"      element={P(Payments)} />
      <Route path="/profile"       element={P(Profile)} />
      <Route path="/addresses"     element={P(Profile)} />
      <Route path="/payment/callback" element={P(PaymentCallback)} />
      <Route path="/subscriptions" element={P(Subscriptions)} />

      {/* Organization */}
      <Route path="/orgs/accept-invite" element={P(AcceptInvite)} />
      <Route path="/orgs/payouts"   element={P(PayoutSettings)} />
      <Route path="/orgs/settings"   element={P(Settings)} />

      {/* Operations */}
      <Route path="/ops"            element={P(OpsDashboard)} />
      <Route path="/ops/laundry"    element={P(LaundryOrders)} />
      <Route path="/ops/fashion"    element={P(FashionOrders)} />
      <Route path="/ops/pickups"    element={P(Pickups)} />
      <Route path="/ops/deliveries" element={P(Deliveries)} />

      {/* Fashion Catalog */}
      <Route path="/fashion-catalog" element={P(FashionCatalog)} />

      {/* Admin */}
      <Route path="/admin/users"   element={P(AdminUsers)} />
      <Route path="/admin/plans"   element={P(AdminPlans)} />
      <Route path="/admin/pricing" element={P(PricingSettings)} />
      <Route path="/admin/usage"   element={P(UsageRecording)} />

      {/* CRM / Inventory / Billing / Analytics */}
      <Route path="/crm"       element={P(CRM)} />
      <Route path="/inventory" element={P(Inventory)} />
      <Route path="/billing"   element={P(Billing)} />
      <Route path="/analytics" element={P(Analytics)} />

      {/* Staff / Driver */}
      <Route path="/staff"             element={P(StaffPortal)} />
      <Route path="/driver"            element={P(DriverPortal)} />
      <Route path="/driver/pickups"    element={P(DriverPortal)} />
      <Route path="/driver/deliveries" element={P(DriverPortal)} />

      {/* 404 */}
      <Route path="*" element={
        <div className="auth-wrapper">
          <div className="text-center">
            <div className="fw-bold text-muted" style={{ fontSize: '5rem', fontFamily: 'var(--font-heading)' }}>404</div>
            <h4 className="fw-semibold mb-3">Page not found</h4>
            <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

// export default function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <ToastProvider>
//           <AppDataProvider>
//             <AppRoutes />
//           </AppDataProvider>
//         </ToastProvider>
//       </AuthProvider>
//     </BrowserRouter>
//   );
// }

// src/App.tsx
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppDataProvider>
            <AppRoutes />
            <UpdateToast />   {/* ← registers the SW globally, independent of auth */}
          </AppDataProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}