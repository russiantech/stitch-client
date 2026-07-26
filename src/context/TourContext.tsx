// src/context/TourContext.tsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { NavRole } from '@/utils/roles';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'bottom' | 'top' | 'right' | 'left';
  path?: string; // if set and different from current route, the tour navigates here first
  section: string; // groups steps for the jump-to menu
}

const STEPS: Record<NavRole, TourStep[]> = {
  customer: [
    // ─── Dashboard overview ─────────────────────────────────────────────
    { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: "Let's take a quick tour so you know exactly where everything is.", placement: 'right', path: '/dashboard', section: 'Welcome' },
    { target: 'nav-/dashboard', title: 'Your Dashboard', content: 'Your home base — a snapshot of recent orders and account activity.', placement: 'right', path: '/dashboard', section: 'Dashboard' },
    { target: 'tour-dash-quick-actions', title: 'Quick Actions', content: 'The fastest way to start a new order or subscribe — one tap from here.', placement: 'bottom', path: '/dashboard', section: 'Dashboard' },
    { target: 'tour-dash-subscription-volume', title: 'Your Subscription at a Glance', content: 'See units used and remaining across all your active plans, right on your dashboard.', placement: 'top', path: '/dashboard', section: 'Dashboard' },
    { target: 'tour-dash-recent-orders', title: 'Recent Orders', content: 'Your last few orders, always visible without digging through menus.', placement: 'right', path: '/dashboard', section: 'Dashboard' },
    { target: 'tour-dash-service-plans', title: 'Service Plans', content: 'Preview available subscription plans before committing.', placement: 'left', path: '/dashboard', section: 'Dashboard' },

    // ─── New Order wizard ───────────────────────────────────────────────
    { target: 'nav-/orders/new', title: 'Start a Laundry Order', content: "Let's peek at how booking an order works.", placement: 'right', path: '/dashboard', section: 'New Order' },
    { target: 'tour-order-steps', title: 'A Simple 5-Step Flow', content: 'Services → Garments → Schedule → Payment → Summary. You can go back anytime.', placement: 'bottom', path: '/orders/new', section: 'New Order' },
    { target: 'tour-order-services', title: 'Pick Your Services', content: 'Choose one or more — each adds a price multiplier to your garments.', placement: 'right', path: '/orders/new', section: 'New Order' },
    { target: 'tour-order-priority', title: 'Need it fast?', content: 'Choose Express for faster turnaround, for a small surcharge.', placement: 'top', path: '/orders/new', section: 'New Order' },

    // ─── Orders ─────────────────────────────────────────────────────────
    { target: 'nav-/orders', title: 'Track Your Orders', content: "See every order's live status, from pickup to delivery.", placement: 'right', path: '/orders', section: 'My Orders' },
    { target: 'tour-orders-tabs', title: 'Laundry & Fashion', content: 'Switch between your laundry and fashion orders here.', placement: 'bottom', path: '/orders', section: 'My Orders' },
    { target: 'tour-orders-list', title: 'Full Order Details', content: 'Tap any order card to open its full timeline, payment info, and delivery details.', placement: 'right', path: '/orders', section: 'My Orders' },

    // ─── Subscriptions ──────────────────────────────────────────────────
    { target: 'nav-/subscriptions', title: 'Subscriptions', content: 'Subscribe to a volume plan and save on recurring laundry.', placement: 'right', path: '/subscriptions', section: 'Subscriptions' },
    { target: 'tour-sub-plans-tab', title: 'Available Plans', content: 'Pick a plan — units pool together if you subscribe to more than one.', placement: 'bottom', path: '/subscriptions', section: 'Subscriptions' },
    { target: 'tour-sub-usage-tab', title: 'Usage Log', content: 'Every unit deduction is recorded here, so you always know what was used and when.', placement: 'bottom', path: '/subscriptions', section: 'Subscriptions' },

    // ─── Wrap-up ────────────────────────────────────────────────────────
    { target: 'nav-/addresses', title: 'Saved Addresses', content: 'Save delivery addresses once, reuse them on every order.', placement: 'right', path: '/dashboard', section: 'Your Account' },
    { target: 'topbar-notifications', title: 'Stay Notified', content: 'Order updates and payment confirmations land here.', placement: 'bottom', path: '/dashboard', section: 'Your Account' },
    { target: 'topbar-profile', title: 'Your Account', content: 'Update your profile, or replay this tour anytime from here.', placement: 'bottom', path: '/dashboard', section: 'Your Account' },
    { target: 'sidebar-logout', title: 'Signing Out', content: "When you're done for the day, this signs you out safely.", placement: 'top', path: '/dashboard', section: 'Your Account' },
    { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough — no need to remember everything now.', placement: 'top', path: '/dashboard', section: 'Your Account' },
  ],

  admin: [
    // ─── Ops Dashboard ──────────────────────────────────────────────────
    { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: "Here's a quick tour of your admin workspace.", placement: 'right', path: '/ops', section: 'Welcome' },
    { target: 'nav-/ops', title: 'Ops Dashboard', content: 'Live order volume, pending pickups, and daily activity.', placement: 'right', path: '/ops', section: 'Ops Dashboard' },
    { target: 'tour-ops-kpis', title: 'Key Metrics', content: 'Revenue, active orders, and order-type breakdown — updated live.', placement: 'bottom', path: '/ops', section: 'Ops Dashboard' },
    { target: 'tour-ops-quick-nav', title: 'Jump Straight In', content: 'Quick counts and one-tap access to laundry, fashion, pickups, and deliveries.', placement: 'bottom', path: '/ops', section: 'Ops Dashboard' },
    { target: 'tour-ops-urgent', title: 'Urgent Orders', content: "Anything flagged Express or urgent surfaces here first.", placement: 'right', path: '/ops', section: 'Ops Dashboard' },
    { target: 'tour-ops-staff', title: 'Your Team', content: "See who's on staff and their current status.", placement: 'left', path: '/ops', section: 'Ops Dashboard' },
    { target: 'tour-ops-latest-orders', title: 'Latest Activity', content: 'Recent orders across both laundry and fashion.', placement: 'top', path: '/ops', section: 'Ops Dashboard' },

    // ─── Laundry orders ─────────────────────────────────────────────────
    { target: 'nav-/ops/laundry', title: 'Laundry Orders', content: 'Manage every laundry order as it moves through your pipeline — sorting, washing, drying, and beyond.', placement: 'right', path: '/ops/laundry', section: 'Laundry Orders' },
    { target: 'tour-laundry-status-filters', title: 'Filter by Stage', content: 'Tap a status to filter instantly — counts update live.', placement: 'bottom', path: '/ops/laundry', section: 'Laundry Orders' },
    { target: 'tour-laundry-table', title: 'Advance or Reverse Orders', content: 'Click any row for full details, or use the arrows to move an order forward or back a stage.', placement: 'top', path: '/ops/laundry', section: 'Laundry Orders' },

    // ─── Fashion orders ─────────────────────────────────────────────────
    { target: 'nav-/ops/fashion', title: 'Fashion Orders', content: 'Track custom tailoring, alterations, and fashion requests from consultation to delivery.', placement: 'right', path: '/ops/fashion', section: 'Fashion Orders' },
    { target: 'tour-fashion-status-filters', title: 'Filter by Stage', content: 'From consultation through delivery — filter by stage.', placement: 'bottom', path: '/ops/fashion', section: 'Fashion Orders' },
    { target: 'tour-fashion-table', title: 'Track Measurements & Notes', content: 'Click any order to see measurements, design notes, and reference images.', placement: 'top', path: '/ops/fashion', section: 'Fashion Orders' },

    // ─── Pickups & deliveries ───────────────────────────────────────────
    { target: 'nav-/ops/pickups', title: 'Pickups', content: 'Everything scheduled to be collected from customers.', placement: 'right', path: '/ops/pickups', section: 'Pickups' },
    { target: 'tour-pickups-drivers', title: 'Your Drivers', content: 'See which drivers are active and available for pickup assignment.', placement: 'bottom', path: '/ops/pickups', section: 'Pickups' },
    { target: 'tour-pickups-table', title: 'Assign & Confirm', content: 'Assign a driver to each order, then confirm once it has been collected.', placement: 'top', path: '/ops/pickups', section: 'Pickups' },

    { target: 'nav-/ops/deliveries', title: 'Deliveries', content: 'Orders ready to go back out to customers.', placement: 'right', path: '/ops/deliveries', section: 'Deliveries' },
    { target: 'tour-deliveries-stats', title: 'Delivery Overview', content: 'Ready for dispatch, out for delivery, and completed counts.', placement: 'bottom', path: '/ops/deliveries', section: 'Deliveries' },
    { target: 'tour-deliveries-table', title: 'Dispatch & Deliver', content: 'Assign a driver, dispatch the order, then mark it delivered once complete.', placement: 'top', path: '/ops/deliveries', section: 'Deliveries' },

    // ─── Fashion catalog ────────────────────────────────────────────────
    { target: 'nav-/fashion-catalog', title: 'Fashion Catalog', content: 'Manage the products and categories you showcase for fashion services.', placement: 'right', path: '/fashion-catalog', section: 'Fashion Catalog' },
    { target: 'tour-catalog-tabs', title: 'Products & Categories', content: 'Switch between managing your product listings and their categories.', placement: 'bottom', path: '/fashion-catalog', section: 'Fashion Catalog' },
    { target: 'tour-catalog-add', title: 'Add a Product', content: 'Upload images, set pricing, and assign categories in one form.', placement: 'left', path: '/fashion-catalog', section: 'Fashion Catalog' },
    { target: 'tour-catalog-products-table', title: 'Your Products', content: 'Search, filter by category, and manage every product from this table.', placement: 'top', path: '/fashion-catalog', section: 'Fashion Catalog' },
    { target: 'tour-catalog-categories-table', title: 'Categories', content: 'Switch to the Categories tab to organize your products into groups.', placement: 'top', path: '/fashion-catalog', section: 'Fashion Catalog' },

    // ─── CRM ────────────────────────────────────────────────────────────
    { target: 'nav-/crm', title: 'CRM', content: 'View and manage your full customer base — history, contact info, and activity.', placement: 'right', path: '/crm', section: 'CRM' },
    { target: 'tour-crm-stats', title: 'Customer Overview', content: 'Total, active, and new customers at a glance.', placement: 'bottom', path: '/crm', section: 'CRM' },
    { target: 'tour-crm-search', title: 'Search & Filter', content: 'Find any customer by name, email, or username, and filter by active/inactive status.', placement: 'bottom', path: '/crm', section: 'CRM' },
    { target: 'tour-crm-table', title: 'Customer Profiles', content: 'Click any customer to see their order history, spend, and add private notes.', placement: 'top', path: '/crm', section: 'CRM' },

    // ─── Inventory ──────────────────────────────────────────────────────
    { target: 'nav-/inventory', title: 'Inventory', content: 'Track detergents, packaging, and other supplies — with low-stock alerts.', placement: 'right', path: '/inventory', section: 'Inventory' },
    { target: 'tour-inventory-stats', title: 'Stock at a Glance', content: 'See your in-stock, low-stock, and out-of-stock counts instantly.', placement: 'bottom', path: '/inventory', section: 'Inventory' },
    { target: 'tour-inventory-add', title: 'Add Stock Items', content: 'Add a new supply item with category, quantity, and reorder threshold.', placement: 'left', path: '/inventory', section: 'Inventory' },
    { target: 'tour-inventory-table', title: 'Adjust Stock Levels', content: 'Bump quantities up or down directly from the table as stock moves.', placement: 'top', path: '/inventory', section: 'Inventory' },

    // ─── Billing ────────────────────────────────────────────────────────
    { target: 'nav-/billing', title: 'Billing', content: 'Review invoices and payment records across your organization.', placement: 'right', path: '/billing', section: 'Billing' },
    { target: 'tour-billing-stats', title: 'Revenue Overview', content: 'Collected, pending, and total payments — all in one view.', placement: 'bottom', path: '/billing', section: 'Billing' },
    { target: 'tour-billing-generate', title: 'Generate Invoices', content: 'Create a manual invoice for a customer in seconds.', placement: 'left', path: '/billing', section: 'Billing' },
    { target: 'tour-billing-table', title: 'Payment Records', content: 'Every payment, invoice, and its status — verify or view receipts here.', placement: 'top', path: '/billing', section: 'Billing' },

    // ─── Analytics ──────────────────────────────────────────────────────
    { target: 'nav-/analytics', title: 'Analytics', content: 'Revenue, order trends, and subscription performance at a glance.', placement: 'right', path: '/analytics', section: 'Analytics' },
    { target: 'tour-analytics-kpis', title: 'Key Metrics', content: 'Revenue, orders, customers, and deliveries — updated by period.', placement: 'bottom', path: '/analytics', section: 'Analytics' },
    { target: 'tour-analytics-charts', title: 'Trends Over Time', content: 'Six-month revenue and order charts.', placement: 'top', path: '/analytics', section: 'Analytics' },
    { target: 'tour-analytics-order-mix', title: 'Order Mix', content: 'The split between laundry and fashion orders, visualized.', placement: 'right', path: '/analytics', section: 'Analytics' },
    { target: 'tour-analytics-delivery-perf', title: 'Delivery Performance', content: 'Delivered, completed, and pending orders at a glance.', placement: 'top', path: '/analytics', section: 'Analytics' },
    { target: 'tour-analytics-sub-perf', title: 'Subscription Performance', content: 'Active, paused, and cancelled plans, plus subscription revenue.', placement: 'left', path: '/analytics', section: 'Analytics' },

    // ─── Team management ────────────────────────────────────────────────
    { target: 'nav-/admin/users', title: 'Team Management', content: 'Invite staff, assign roles, and manage access.', placement: 'right', path: '/admin/users', section: 'Team' },
    { target: 'tour-users-stats', title: 'Team Overview', content: 'Customers, staff, and drivers — all counted here.', placement: 'bottom', path: '/admin/users', section: 'Team' },
    { target: 'tour-users-invite', title: 'Invite Someone New', content: 'Send an email invite with a role already assigned.', placement: 'left', path: '/admin/users', section: 'Team' },
    { target: 'tour-users-table', title: 'Manage Your Team', content: 'Click anyone to see their profile, edit roles, or act on their behalf.', placement: 'top', path: '/admin/users', section: 'Team' },

    // ─── Plans ──────────────────────────────────────────────────────────
    { target: 'nav-/admin/plans', title: 'Plans', content: 'Create and manage the subscription plans your customers can subscribe to.', placement: 'right', path: '/admin/plans', section: 'Plans' },
    { target: 'tour-plans-cards', title: 'Your Active Plans', content: 'See pricing, units, and billing interval for every plan at a glance.', placement: 'bottom', path: '/admin/plans', section: 'Plans' },

    // ─── Pricing settings ───────────────────────────────────────────────
    { target: 'nav-/admin/pricing', title: 'Pricing Settings', content: 'Set garment prices, service multipliers, and delivery area fees.', placement: 'right', path: '/admin/pricing', section: 'Pricing' },
    { target: 'tour-pricing-tabs', title: 'Three Pricing Areas', content: 'Garments, services, and delivery areas — each independently editable.', placement: 'bottom', path: '/admin/pricing', section: 'Pricing' },

    // ─── Usage recording ────────────────────────────────────────────────
    { target: 'nav-/admin/usage', title: 'Usage Recording', content: "Log unit deductions when a subscriber's garments come in.", placement: 'right', path: '/admin/usage', section: 'Usage Recording' },
    { target: 'tour-usage-stats', title: 'Usage Overview', content: 'Total records, units deducted today, and all-time totals.', placement: 'bottom', path: '/admin/usage', section: 'Usage Recording' },
    { target: 'tour-usage-record', title: 'Record an Intake', content: 'Pick a customer, their plan, and how many garments came in.', placement: 'left', path: '/admin/usage', section: 'Usage Recording' },
    { target: 'tour-usage-log', title: 'Full History', content: 'Every deduction ever recorded, with before/after balances.', placement: 'top', path: '/admin/usage', section: 'Usage Recording' },

    // ─── Organization settings ──────────────────────────────────────────
    { target: 'nav-/orgs/settings', title: 'Organization Settings', content: 'Manage your invite code/link and who can join your org.', placement: 'right', path: '/orgs/settings', section: 'Organization' },
    { target: 'tour-invite-link', title: 'Invite Your Team', content: 'Share this link, or the code, with staff to have them join instantly.', placement: 'bottom', path: '/orgs/settings', section: 'Organization' },

    // ─── Payouts ────────────────────────────────────────────────────────
    { target: 'nav-/orgs/payouts', title: 'Payout Settings', content: "Set up how your business gets paid — let's take a look.", placement: 'right', path: '/orgs/payouts', section: 'Payouts' },
    { target: 'tour-payout-provider', title: 'Choose a Provider', content: 'Pick your preferred payment provider for collecting customer payments.', placement: 'bottom', path: '/orgs/payouts', section: 'Payouts' },
    { target: 'tour-payout-account', title: 'Verify Your Bank Account', content: 'Enter your account number — we verify the account name automatically before saving.', placement: 'top', path: '/orgs/payouts', section: 'Payouts' },

    // ─── Your own account ───────────────────────────────────────────────
    { target: 'nav-/dashboard', title: 'Your Personal Dashboard', content: "You're also a user of Stitch — this is your own account view.", placement: 'right', path: '/dashboard', section: 'Your Account' },
    { target: 'nav-/subscriptions', title: 'Your Subscriptions', content: 'Manage your own subscription plans from here, separate from the ones you sell.', placement: 'right', path: '/subscriptions', section: 'Your Account' },
    { target: 'topbar-notifications', title: 'Stay Notified', content: 'Important updates land here in real time.', placement: 'bottom', path: '/subscriptions', section: 'Your Account' },
    { target: 'topbar-profile', title: 'Your Account', content: 'Update your profile, or replay this tour anytime from here.', placement: 'bottom', path: '/subscriptions', section: 'Your Account' },
    { target: 'sidebar-logout', title: 'Signing Out', content: "When you're done for the day, this signs you out safely.", placement: 'top', path: '/subscriptions', section: 'Your Account' },
    { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough.', placement: 'top', path: '/subscriptions', section: 'Your Account' },
  ],

  staff: [
    { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: 'Quick tour of your workspace.', placement: 'right', path: '/staff', section: 'Welcome' },
    { target: 'nav-/staff', title: 'My Tasks', content: 'Everything assigned to you, in one place.', placement: 'right', path: '/staff', section: 'My Tasks' },
    { target: 'nav-/ops/laundry', title: 'Laundry Queue', content: 'Move orders through the pipeline as you process them.', placement: 'right', path: '/ops/laundry', section: 'Laundry Queue' },
    { target: 'nav-/admin/usage', title: 'Record Usage', content: 'Log unit deductions when garments come in from subscription customers.', placement: 'right', path: '/admin/usage', section: 'Usage Recording' },
    { target: 'topbar-notifications', title: 'Stay Notified', content: 'Important updates land here in real time.', placement: 'bottom', path: '/staff', section: 'Your Account' },
    { target: 'topbar-profile', title: 'Your Account', content: 'Update your profile, or replay this tour anytime from here.', placement: 'bottom', path: '/staff', section: 'Your Account' },
    { target: 'sidebar-logout', title: 'Signing Out', content: "When you're done for the day, this signs you out safely.", placement: 'top', path: '/staff', section: 'Your Account' },
    { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough.', placement: 'top', path: '/staff', section: 'Your Account' },
  ],

  driver: [
    { target: 'sidebar-brand', title: 'Welcome to Stitch! 👋', content: "Here's a quick look at your driver workspace.", placement: 'right', path: '/driver', section: 'Welcome' },
    { target: 'nav-/driver', title: 'My Routes', content: 'Your assigned pickups and deliveries for today.', placement: 'right', path: '/driver', section: 'My Routes' },
    { target: 'nav-/driver/pickups', title: 'Pickups', content: 'Orders waiting to be picked up from customers.', placement: 'right', path: '/driver/pickups', section: 'Pickups' },
    { target: 'nav-/driver/deliveries', title: 'Deliveries', content: 'Orders ready to go back out to customers.', placement: 'right', path: '/driver/deliveries', section: 'Deliveries' },
    { target: 'topbar-notifications', title: 'Stay Notified', content: 'Important updates land here in real time.', placement: 'bottom', path: '/driver', section: 'Your Account' },
    { target: 'topbar-profile', title: 'Your Account', content: 'Update your profile, or replay this tour anytime from here.', placement: 'bottom', path: '/driver', section: 'Your Account' },
    { target: 'sidebar-logout', title: 'Signing Out', content: "When you're done for the day, this signs you out safely.", placement: 'top', path: '/driver', section: 'Your Account' },
    { target: 'tour-help-button', title: 'Stuck later? Come back here', content: 'This button always replays the walkthrough.', placement: 'top', path: '/driver', section: 'Your Account' },
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
  jumpTo: (index: number) => void;
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
  const jumpTo = useCallback((index: number) => {
    setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
  }, [steps.length]);

  return (
    <TourContext.Provider value={{ active, stepIndex, steps, bannerVisible, startTour, dismissBanner, next, back, skip, finish, jumpTo }}>
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

// TourContext.tsx — add alongside hasTourCompleted
export function hasTourBannerBeenSeen(role: NavRole): boolean {
  try { return localStorage.getItem(bannerSeenKey(role)) === '1'; } catch { return false; }
}