import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AppDataProvider } from './context/AppDataContext.jsx';
import AppShell from './components/layout/AppShell.jsx';

// Auth
import SignIn from './pages/auth/SignIn.jsx';
import SignUp from './pages/auth/SignUp.jsx';

// Customer
import CustomerDashboard from './pages/customer/Dashboard.jsx';
import MyOrders from './pages/customer/MyOrders.jsx';
import CreateOrder from './pages/customer/CreateOrder.jsx';
import FashionRequest from './pages/customer/FashionRequest.jsx';
import Payments from './pages/customer/Payments.jsx';
import Profile from './pages/customer/Profile.jsx';
import Subscriptions from './pages/customer/Subscriptions.jsx';

// Operations
import OpsDashboard from './pages/operations/OpsDashboard.jsx';
import LaundryOrders from './pages/operations/LaundryOrders.jsx';
import FashionOrders from './pages/operations/FashionOrders.jsx';
import Pickups from './pages/operations/Pickups.jsx';
import Deliveries from './pages/operations/Deliveries.jsx';

// Fashion Catalog
import FashionCatalog from './pages/fashion/FashionCatalog.jsx';

// Admin
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminPlans from './pages/admin/AdminPlans.jsx';
import PricingSettings from './pages/admin/PricingSettings.jsx';
import UsageRecording from './pages/admin/UsageRecording.jsx';

// CRM
import CRM from './pages/crm/CRM.jsx';

// Inventory
import Inventory from './pages/inventory/Inventory.jsx';

// Billing
import Billing from './pages/billing/Billing.jsx';

// Analytics
import Analytics from './pages/analytics/Analytics.jsx';

// Staff & Driver
import StaffPortal from './pages/staff/StaffPortal.jsx';
import DriverPortal from './pages/driver/DriverPortal.jsx';

// ─── Route Guards ─────────────────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" />
          <div className="text-muted small">Loading Stitch…</div>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/signin" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />

      {/* Root */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Customer */}
      <Route path="/dashboard"     element={<PrivateRoute><CustomerDashboard /></PrivateRoute>} />
      <Route path="/orders"        element={<PrivateRoute><MyOrders /></PrivateRoute>} />
      <Route path="/orders/new"    element={<PrivateRoute><CreateOrder /></PrivateRoute>} />
      <Route path="/fashion/new"   element={<PrivateRoute><FashionRequest /></PrivateRoute>} />
      <Route path="/payments"      element={<PrivateRoute><Payments /></PrivateRoute>} />
      <Route path="/profile"       element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/addresses"     element={<PrivateRoute><Profile /></PrivateRoute>} />
      <Route path="/subscriptions" element={<PrivateRoute><Subscriptions /></PrivateRoute>} />

      {/* Operations */}
      <Route path="/ops"             element={<PrivateRoute><OpsDashboard /></PrivateRoute>} />
      <Route path="/ops/laundry"     element={<PrivateRoute><LaundryOrders /></PrivateRoute>} />
      <Route path="/ops/fashion"     element={<PrivateRoute><FashionOrders /></PrivateRoute>} />
      <Route path="/ops/pickups"     element={<PrivateRoute><Pickups /></PrivateRoute>} />
      <Route path="/ops/deliveries"  element={<PrivateRoute><Deliveries /></PrivateRoute>} />

      {/* Fashion Catalog */}
      <Route path="/fashion-catalog" element={<PrivateRoute><FashionCatalog /></PrivateRoute>} />

      {/* Admin */}
      <Route path="/admin/users"    element={<PrivateRoute><AdminUsers /></PrivateRoute>} />
      <Route path="/admin/plans"    element={<PrivateRoute><AdminPlans /></PrivateRoute>} />
      <Route path="/admin/pricing"  element={<PrivateRoute><PricingSettings /></PrivateRoute>} />
      <Route path="/admin/usage"    element={<PrivateRoute><UsageRecording /></PrivateRoute>} />

      {/* CRM */}
      <Route path="/crm" element={<PrivateRoute><CRM /></PrivateRoute>} />

      {/* Inventory */}
      <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />

      {/* Billing */}
      <Route path="/billing" element={<PrivateRoute><Billing /></PrivateRoute>} />

      {/* Analytics */}
      <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<PrivateRoute><StaffPortal /></PrivateRoute>} />

      {/* Driver */}
      <Route path="/driver"            element={<PrivateRoute><DriverPortal /></PrivateRoute>} />
      <Route path="/driver/pickups"    element={<PrivateRoute><DriverPortal /></PrivateRoute>} />
      <Route path="/driver/deliveries" element={<PrivateRoute><DriverPortal /></PrivateRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <div className="auth-wrapper">
          <div className="text-center">
            <div className="display-1 fw-bold text-muted">404</div>
            <h4 className="fw-semibold mb-3">Page not found</h4>
            <a href="/dashboard" className="btn btn-primary">Go to Dashboard</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppDataProvider>
            <AppRoutes />
          </AppDataProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
