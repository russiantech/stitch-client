
// v2
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { NavRole } from '@/utils/roles';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'bottom' | 'top' | 'right' | 'left';
  path?: string; // if set and different from current route, the tour navigates here first
}

const STEPS: Record<NavRole, TourStep[]> = {
  customer: [
  // ─── Dashboard overview ─────────────────────────────────────────────
  { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: "Let's take a quick tour so you know exactly where everything is.", placement: 'right', path: '/dashboard' },
  { target: 'nav-/dashboard', title: 'Your Dashboard', content: 'Your home base — a snapshot of recent orders and account activity.', placement: 'right', path: '/dashboard' },
  { target: 'tour-dash-quick-actions', title: 'Quick Actions', content: 'The fastest way to start a new order or subscribe — one tap from here.', placement: 'bottom', path: '/dashboard' },
  { target: 'tour-dash-subscription-volume', title: 'Your Subscription at a Glance', content: 'See units used and remaining across all your active plans, right on your dashboard.', placement: 'top', path: '/dashboard' },
  { target: 'tour-dash-recent-orders', title: 'Recent Orders', content: 'Your last few orders, always visible without digging through menus.', placement: 'right', path: '/dashboard' },
  { target: 'tour-dash-service-plans', title: 'Service Plans', content: 'Preview available subscription plans before committing.', placement: 'left', path: '/dashboard' },

  // ─── New Order wizard ───────────────────────────────────────────────
  { target: 'nav-/orders/new', title: 'Start a Laundry Order', content: "Let's peek at how booking an order works.", placement: 'right', path: '/dashboard' },
  { target: 'tour-order-steps', title: 'A Simple 5-Step Flow', content: 'Services → Garments → Schedule → Payment → Summary. You can go back anytime.', placement: 'bottom', path: '/orders/new' },
  { target: 'tour-order-services', title: 'Pick Your Services', content: 'Choose one or more — each adds a price multiplier to your garments.', placement: 'right', path: '/orders/new' },
  { target: 'tour-order-priority', title: 'Need it fast?', content: 'Choose Express for faster turnaround, for a small surcharge.', placement: 'top', path: '/orders/new' },

  // ─── Orders ─────────────────────────────────────────────────────────
  { target: 'nav-/orders', title: 'Track Your Orders', content: "See every order's live status, from pickup to delivery.", placement: 'right', path: '/orders' },
  { target: 'tour-orders-tabs', title: 'Laundry & Fashion', content: 'Switch between your laundry and fashion orders here.', placement: 'bottom', path: '/orders' },
  { target: 'tour-orders-list', title: 'Full Order Details', content: 'Tap any order card to open its full timeline, payment info, and delivery details.', placement: 'right', path: '/orders' },

  // ─── Subscriptions ──────────────────────────────────────────────────
  { target: 'nav-/subscriptions', title: 'Subscriptions', content: 'Subscribe to a volume plan and save on recurring laundry.', placement: 'right', path: '/subscriptions' },
  { target: 'tour-sub-plans-tab', title: 'Available Plans', content: 'Pick a plan — units pool together if you subscribe to more than one.', placement: 'bottom', path: '/subscriptions' },
  { target: 'tour-sub-usage-tab', title: 'Usage Log', content: 'Every unit deduction is recorded here, so you always know what was used and when.', placement: 'bottom', path: '/subscriptions' },

  // ─── Wrap-up ────────────────────────────────────────────────────────
  { target: 'nav-/addresses', title: 'Saved Addresses', content: 'Save delivery addresses once, reuse them on every order.', placement: 'right', path: '/dashboard' },
  { target: 'topbar-notifications', title: 'Stay Notified', content: 'Order updates and payment confirmations land here.', placement: 'bottom', path: '/dashboard' },
  { target: 'topbar-profile', title: 'Your Account', content: 'Update your profile, or replay this tour anytime from here.', placement: 'bottom', path: '/dashboard' },
  { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough — no need to remember everything now.', placement: 'top', path: '/dashboard' },
],

  admin: [
  // ─── Dashboard overview ─────────────────────────────────────────────
  { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: "Here's a quick tour of your admin workspace.", placement: 'right', path: '/ops' },
  { target: 'nav-/ops', title: 'Ops Dashboard', content: 'Live order volume, pending pickups, and daily activity.', placement: 'right', path: '/ops' },
  { target: 'tour-ops-kpis', title: 'Key Metrics', content: 'Revenue, active orders, and order-type breakdown — updated live.', placement: 'bottom', path: '/ops' },
  { target: 'tour-ops-quick-nav', title: 'Jump Straight In', content: 'Quick counts and one-tap access to laundry, fashion, pickups, and deliveries.', placement: 'bottom', path: '/ops' },
  { target: 'tour-ops-urgent', title: 'Urgent Orders', content: "Anything flagged Express or urgent surfaces here first.", placement: 'right', path: '/ops' },
  { target: 'tour-ops-staff', title: 'Your Team', content: "See who's on staff and their current status.", placement: 'left', path: '/ops' },
  { target: 'tour-ops-latest-orders', title: 'Latest Activity', content: 'Recent orders across both laundry and fashion.', placement: 'top', path: '/ops' },

  // ─── Laundry ────────────────────────────────────────────────────────
  { target: 'nav-/ops/laundry', title: 'Laundry Orders', content: 'Manage every laundry order as it moves through your pipeline — sorting, washing, drying, and beyond.', placement: 'right', path: '/ops/laundry' },
  { target: 'tour-laundry-status-filters', title: 'Filter by Stage', content: 'Tap a status to filter instantly — counts update live.', placement: 'bottom', path: '/ops/laundry' },
  { target: 'tour-laundry-table', title: 'Advance or Reverse Orders', content: 'Click any row for full details, or use the arrows to move an order forward or back a stage.', placement: 'top', path: '/ops/laundry' },

  // ─── Fashion orders ─────────────────────────────────────────────────
  { target: 'nav-/ops/fashion', title: 'Fashion Orders', content: 'Track custom tailoring, alterations, and fashion requests from consultation to delivery.', placement: 'right', path: '/ops/fashion' },
  { target: 'tour-fashion-status-filters', title: 'Filter by Stage', content: 'From consultation through delivery — filter by stage.', placement: 'bottom', path: '/ops/fashion' },
  { target: 'tour-fashion-table', title: 'Track Measurements & Notes', content: 'Click any order to see measurements, design notes, and reference images.', placement: 'top', path: '/ops/fashion' },

  // ─── Pickups & deliveries ───────────────────────────────────────────
  { target: 'nav-/ops/pickups', title: 'Pickups', content: 'Everything scheduled to be collected from customers.', placement: 'right', path: '/ops' },
  { target: 'nav-/ops/deliveries', title: 'Deliveries', content: 'Orders ready to go back out to customers.', placement: 'right', path: '/ops' },

  // ─── Fashion catalog ────────────────────────────────────────────────
  { target: 'nav-/fashion-catalog', title: 'Fashion Catalog', content: 'Manage the products and categories you showcase for fashion services.', placement: 'right', path: '/fashion-catalog' },
  { target: 'tour-catalog-tabs', title: 'Products & Categories', content: 'Switch between managing your product listings and their categories.', placement: 'bottom', path: '/fashion-catalog' },
  { target: 'tour-catalog-add', title: 'Add a Product', content: 'Upload images, set pricing, and assign categories in one form.', placement: 'left', path: '/fashion-catalog' },

  // ─── CRM ────────────────────────────────────────────────────────────
  { target: 'nav-/crm', title: 'CRM', content: 'View and manage your full customer base — history, contact info, and activity.', placement: 'right', path: '/crm' },
  { target: 'tour-crm-stats', title: 'Customer Overview', content: 'Total, active, and new customers at a glance.', placement: 'bottom', path: '/crm' },
  { target: 'tour-crm-table', title: 'Customer Profiles', content: 'Click any customer to see their order history, spend, and add private notes.', placement: 'top', path: '/crm' },

  // ─── Inventory ──────────────────────────────────────────────────────
  { target: 'nav-/inventory', title: 'Inventory', content: 'Track detergents, packaging, and other supplies — with low-stock alerts.', placement: 'right', path: '/inventory' },
  { target: 'tour-inventory-stats', title: 'Stock at a Glance', content: 'See your in-stock, low-stock, and out-of-stock counts instantly.', placement: 'bottom', path: '/inventory' },

  // ─── Billing ────────────────────────────────────────────────────────
  { target: 'nav-/billing', title: 'Billing', content: 'Review invoices and payment records across your organization.', placement: 'right', path: '/billing' },
  { target: 'tour-billing-stats', title: 'Revenue Overview', content: 'Collected, pending, and total payments — all in one view.', placement: 'bottom', path: '/billing' },
  { target: 'tour-billing-generate', title: 'Generate Invoices', content: 'Create a manual invoice for a customer in seconds.', placement: 'left', path: '/billing' },

  // ─── Analytics ──────────────────────────────────────────────────────
  { target: 'nav-/analytics', title: 'Analytics', content: 'Revenue, order trends, and subscription performance at a glance.', placement: 'right', path: '/analytics' },
  { target: 'tour-analytics-kpis', title: 'Key Metrics', content: 'Revenue, orders, customers, and deliveries — updated by period.', placement: 'bottom', path: '/analytics' },
  { target: 'tour-analytics-charts', title: 'Trends Over Time', content: 'Six-month revenue and order charts, plus order mix and delivery performance.', placement: 'top', path: '/analytics' },

  // ─── Team management ────────────────────────────────────────────────
  { target: 'nav-/admin/users', title: 'Team Management', content: 'Invite staff, assign roles, and manage access.', placement: 'right', path: '/admin/users' },
  { target: 'tour-users-stats', title: 'Team Overview', content: 'Customers, staff, and drivers — all counted here.', placement: 'bottom', path: '/admin/users' },
  { target: 'tour-users-invite', title: 'Invite Someone New', content: 'Send an email invite with a role already assigned.', placement: 'left', path: '/admin/users' },

  // ─── Plans ──────────────────────────────────────────────────────────
  { target: 'nav-/admin/plans', title: 'Plans', content: 'Create and manage the subscription plans your customers can subscribe to.', placement: 'right', path: '/admin/plans' },
  { target: 'tour-plans-cards', title: 'Your Active Plans', content: 'See pricing, units, and billing interval for every plan at a glance.', placement: 'bottom', path: '/admin/plans' },

  // ─── Pricing settings ───────────────────────────────────────────────
  { target: 'nav-/admin/pricing', title: 'Pricing Settings', content: 'Set garment prices, service multipliers, and delivery area fees.', placement: 'right', path: '/admin/pricing' },
  { target: 'tour-pricing-tabs', title: 'Three Pricing Areas', content: 'Garments, services, and delivery areas — each independently editable.', placement: 'bottom', path: '/admin/pricing' },

  // ─── Usage recording ────────────────────────────────────────────────
  { target: 'nav-/admin/usage', title: 'Usage Recording', content: "Log unit deductions when a subscriber's garments come in.", placement: 'right', path: '/admin/usage' },
  { target: 'tour-usage-record', title: 'Record an Intake', content: 'Pick a customer, their plan, and how many garments came in.', placement: 'left', path: '/admin/usage' },
  { target: 'tour-usage-log', title: 'Full History', content: 'Every deduction ever recorded, with before/after balances.', placement: 'top', path: '/admin/usage' },

  // ─── Org settings & payouts ─────────────────────────────────────────
  { target: 'nav-/orgs/settings', title: 'Organization Settings', content: 'Manage your invite code/link and who can join your org.', placement: 'right', path: '/orgs/settings' },
  { target: 'tour-invite-link', title: 'Invite Your Team', content: 'Share this link, or the code, with staff to have them join instantly.', placement: 'bottom', path: '/orgs/settings' },
  { target: 'nav-/orgs/payouts', title: 'Payout Settings', content: "Set up how your business gets paid — let's take a look.", placement: 'right', path: '/orgs/settings' },
  { target: 'tour-payout-provider', title: 'Choose a Provider', content: 'Pick your preferred payment provider for collecting customer payments.', placement: 'bottom', path: '/orgs/payouts' },
  { target: 'tour-payout-account', title: 'Verify Your Bank Account', content: 'Enter your account number — we verify the account name automatically before saving.', placement: 'top', path: '/orgs/payouts' },

  // ─── Top bar ────────────────────────────────────────────────────────
  { target: 'topbar-notifications', title: 'Stay Notified', content: 'Important updates land here in real time.', placement: 'bottom', path: '/ops' },
  { target: 'topbar-profile', title: 'Your Account', content: 'Update your profile, or replay this tour anytime from here.', placement: 'bottom', path: '/ops' },
  { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough.', placement: 'top', path: '/ops' },
],

  staff: [
    { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: 'Quick tour of your workspace.', placement: 'right', path: '/staff' },
    { target: 'nav-/staff', title: 'My Tasks', content: 'Everything assigned to you, in one place.', placement: 'right', path: '/staff' },
    { target: 'nav-/ops/laundry', title: 'Laundry Queue', content: 'Move orders through the pipeline as you process them.', placement: 'right', path: '/ops/laundry' },
    { target: 'nav-/admin/usage', title: 'Record Usage', content: 'Log unit deductions when garments come in from subscription customers.', placement: 'right', path: '/staff' },
    { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough.', placement: 'top', path: '/staff' },
  ],

  driver: [
    { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: "Here's a quick look at your driver workspace.", placement: 'right', path: '/driver' },
    { target: 'nav-/driver', title: 'My Routes', content: 'Your assigned pickups and deliveries for today.', placement: 'right', path: '/driver' },
    { target: 'nav-/driver/pickups', title: 'Pickups', content: 'Orders waiting to be picked up from customers.', placement: 'right', path: '/driver/pickups' },
    { target: 'nav-/driver/deliveries', title: 'Deliveries', content: 'Orders ready to go back out to customers.', placement: 'right', path: '/driver/deliveries' },
    { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough.', placement: 'top', path: '/driver' },
  ],
};

interface TourContextValue {
  active: boolean;
  stepIndex: number;
  steps: TourStep[];
  bannerVisible: boolean;
  startTour: (role: NavRole) => void;
  dismissBanner: () => void;
  next: () => void;
  back: () => void;
  skip: () => void;
  finish: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);
const completedKey = (role: NavRole) => `stitch_tour_completed_${role}`;
const bannerSeenKey = (role: NavRole) => `stitch_tour_banner_seen_${role}`;

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [role, setRole] = useState<NavRole>('customer');
  const [bannerVisible, setBannerVisible] = useState(false);

  const steps = useMemo(() => STEPS[role] ?? STEPS.customer, [role]);

  const startTour = useCallback((r: NavRole) => {
    setRole(r);
    setStepIndex(0);
    setActive(true);
    setBannerVisible(false);
    try { localStorage.setItem(bannerSeenKey(r), '1'); } catch { /* ignore */ }
  }, []);

  const showBannerIfNeeded = useCallback((r: NavRole) => {
    setRole(r);
    try {
      const completed = localStorage.getItem(completedKey(r)) === '1';
      const bannerSeen = localStorage.getItem(bannerSeenKey(r)) === '1';
      if (!completed && !bannerSeen) setBannerVisible(true);
    } catch { /* ignore */ }
  }, []);

  const dismissBanner = useCallback(() => {
    setBannerVisible(false);
    try { localStorage.setItem(bannerSeenKey(role), '1'); } catch { /* ignore */ }
  }, [role]);

  const finish = useCallback(() => {
    setActive(false);
    setStepIndex(0);
    try { localStorage.setItem(completedKey(role), '1'); } catch { /* ignore */ }
  }, [role]);

  const next = useCallback(() => {
    setStepIndex(i => {
      if (i + 1 >= steps.length) { finish(); return i; }
      return i + 1;
    });
  }, [steps.length, finish]);

  const back = useCallback(() => setStepIndex(i => Math.max(0, i - 1)), []);
  const skip = useCallback(() => finish(), [finish]);

  return (
    <TourContext.Provider value={{ active, stepIndex, steps, bannerVisible, startTour, dismissBanner, next, back, skip, finish }}>
      {children}
      {/* exposed via a side-channel so AutoStartTour can call showBannerIfNeeded without prop drilling */}
      <TourAutoStartBridge onReady={showBannerIfNeeded} />
    </TourContext.Provider>
  );
}

function TourAutoStartBridge({ onReady }: { onReady: (r: NavRole) => void }) {
  (TourAutoStartBridge as any)._onReady = onReady;
  return null;
}

export function triggerBannerCheck(role: NavRole) {
  (TourAutoStartBridge as any)._onReady?.(role);
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within a TourProvider');
  return ctx;
}

export function hasTourCompleted(role: NavRole): boolean {
  try { return localStorage.getItem(completedKey(role)) === '1'; } catch { return false; }
}
