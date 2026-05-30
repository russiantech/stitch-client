// services/api.js — Central API service (v4)

const getApiUrl = () => {
  const h = window.location.hostname;
  if (h === 'simplylovely.ng' || h.endsWith('.simplylovely.ng'))
    return 'https://api.simplylovely.ng/api';
  return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
};

export const API_URL = getApiUrl();
export const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxx';

const getAuthHeaders = (json = false) => {
  const token = localStorage.getItem('access_token');
  const h = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    window.location.href = '/signin';
    throw new Error('Unauthorized');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
};

export const apiRequest = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(!!options.json), ...options.headers },
    body: options.json ? JSON.stringify(options.json) : options.body,
  });
  return handleResponse(res);
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authService = {
  signIn:      (email, password) => apiRequest('/auth/signin',  { method: 'POST', json: { email, password } }),
  signUp:      (data)            => apiRequest('/auth/signup',  { method: 'POST', json: data }),
  signOut:     ()                => apiRequest('/auth/signout', { method: 'POST' }),
  currentUser: ()                => apiRequest('/users/current'),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
export const productService = {
  list:        (p = {})   => apiRequest(`/products${p ? '?' + new URLSearchParams(p) : ''}`),
  get:         (id)       => apiRequest(`/products/${id}`),
  create:      (fd)       => apiRequest('/products', { method: 'POST', headers: getAuthHeaders(), body: fd }),
  update:      (id, fd)   => apiRequest(`/products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: fd }),
  delete:      (id)       => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  deleteImage: (pid, iid) => apiRequest(`/products/${pid}/images`, { method: 'DELETE', json: { image_ids: [iid] } }),
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const categoryService = {
  list:   ()       => apiRequest('/categories'),
  get:    (id)     => apiRequest(`/categories/${id}`),
  create: (data)   => apiRequest('/categories', { method: 'POST', json: data }),
  update: (id, d)  => apiRequest(`/categories/${id}`, { method: 'PUT', json: d }),
  delete: (id)     => apiRequest(`/categories/${id}`, { method: 'DELETE' }),
};

// ─── PLANS ────────────────────────────────────────────────────────────────────
export const planService = {
  list:   ()       => apiRequest('/plans'),
  get:    (id)     => apiRequest(`/plans/${id}`),
  create: (data)   => apiRequest('/plans', { method: 'POST', json: data }),
  update: (id, d)  => apiRequest(`/plans/${id}`, { method: 'PUT', json: d }),
  delete: (id)     => apiRequest(`/plans/${id}`, { method: 'DELETE' }),
};

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
// Paystack recurring subscriptions:
//   1. Admin creates a Plan in Paystack dashboard → gets a plan_code (PLN_xxx)
//   2. Backend stores plan_code against each SimplyLovely plan
//   3. Customer subscribes → we call /payment/:planId/paystack which returns a
//      Paystack authorization_url (hosted checkout) or we use Paystack inline
//      with the plan code for recurring billing
//   4. On success Paystack fires a webhook → backend marks subscription active
//   5. Customer can manage (cancel/pause) via their Paystack customer portal
//      link OR via a backend endpoint that calls Paystack's subscription API
export const subscriptionService = {
  // Get current user's subscriptions
  mySubscriptions: () => apiRequest('/subscriptions/my'),
  // Admin: all subscriptions
  all: (p = {}) => apiRequest(`/subscriptions?${new URLSearchParams(p)}`),
  // Admin: subscriptions for a user
  forUser: (uid) => apiRequest(`/subscriptions/user/${uid}`),

  // ── Initiate subscription (returns { authorization_url, reference, access_code })
  // planId = SimplyLovely plan id; backend maps to Paystack plan_code for recurring
  initiate: (planId, email) =>
    apiRequest(`/payment/${planId}/paystack`, {
      method: 'POST',
      json: { email },
      headers: {
        ...getAuthHeaders(true),
        'Client-Callback-Url': `${window.location.origin}/subscriptions?verify=1`,
      },
    }),

  // ── Verify after Paystack redirects back (reference in query string)
  verify: (reference) =>
    apiRequest(`/payment/callback/paystack?reference=${reference}`),

  // ── Inline charge (one-time, non-recurring) – fallback when no plan_code
  chargeInline: (planId, reference) =>
    apiRequest(`/payment/verify-inline/${planId}`, { method: 'POST', json: { reference } }),

  // ── Cancel a subscription
  cancel: (subscriptionId) =>
    apiRequest(`/subscriptions/${subscriptionId}/cancel`, { method: 'POST' }),

  // ── Pause / disable a subscription
  pause: (subscriptionId) =>
    apiRequest(`/subscriptions/${subscriptionId}/pause`, { method: 'POST' }),

  // ── Resume / enable a paused subscription
  resume: (subscriptionId) =>
    apiRequest(`/subscriptions/${subscriptionId}/resume`, { method: 'POST' }),

  // ── Get Paystack customer portal / manage link
  manageLink: (subscriptionId) =>
    apiRequest(`/subscriptions/${subscriptionId}/manage-link`),
};

// ─── USAGE ────────────────────────────────────────────────────────────────────
export const usageService = {
  statistics:   ()       => apiRequest('/usage/statistics'),
  list:         (p = {}) => apiRequest(`/usage?${new URLSearchParams(p)}`),
  record:       (data)   => apiRequest('/usage', { method: 'POST', json: data }),
  deductOrder:  (data)   => apiRequest('/usage/order-deduct', { method: 'POST', json: data }),
};

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orderService = {
  list:         (p = {}) => apiRequest(`/orders?${new URLSearchParams(p)}`),
  get:          (id)     => apiRequest(`/orders/${id}`),
  create:       (data)   => apiRequest('/orders', { method: 'POST', json: data }),
  update:       (id, d)  => apiRequest(`/orders/${id}`, { method: 'PUT', json: d }),
  updateStatus: (id, status, notes) =>
    apiRequest(`/orders/${id}/status`, { method: 'PUT', json: { status, notes } }),
};

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export const paymentService = {
  // Initialize a one-off order payment
  initialize: (data) => apiRequest('/pays/initialize', { method: 'POST', json: data }),
  // Verify a payment reference (one-off or subscription)
  verify:     (ref)  => apiRequest(`/pays/verify/${ref}`),
  list:       (p={}) => apiRequest(`/pays?${new URLSearchParams(p)}`),
};

// ─── PRICING ──────────────────────────────────────────────────────────────────
export const pricingService = {
  services:      ()       => apiRequest('/pricing/services'),
  createService: (d)      => apiRequest('/pricing/services', { method: 'POST', json: d }),
  updateService: (id, d)  => apiRequest(`/pricing/services/${id}`, { method: 'PUT', json: d }),
  deleteService: (id)     => apiRequest(`/pricing/services/${id}`, { method: 'DELETE' }),
  garments:      ()       => apiRequest('/pricing/garments'),
  createGarment: (d)      => apiRequest('/pricing/garments', { method: 'POST', json: d }),
  updateGarment: (id, d)  => apiRequest(`/pricing/garments/${id}`, { method: 'PUT', json: d }),
  deleteGarment: (id)     => apiRequest(`/pricing/garments/${id}`, { method: 'DELETE' }),
  areas:         ()       => apiRequest('/pricing/areas'),
  createArea:    (d)      => apiRequest('/pricing/areas', { method: 'POST', json: d }),
  updateArea:    (id, d)  => apiRequest(`/pricing/areas/${id}`, { method: 'PUT', json: d }),
  deleteArea:    (id)     => apiRequest(`/pricing/areas/${id}`, { method: 'DELETE' }),
};

// ─── ADDRESSES ────────────────────────────────────────────────────────────────
export const addressService = {
  list:       ()      => apiRequest('/addresses'),
  create:     (d)     => apiRequest('/addresses', { method: 'POST', json: d }),
  update:     (id, d) => apiRequest(`/addresses/${id}`, { method: 'PUT', json: d }),
  delete:     (id)    => apiRequest(`/addresses/${id}`, { method: 'DELETE' }),
  setDefault: (id)    => apiRequest(`/addresses/${id}/default`, { method: 'PUT' }),
};

// ─── USERS ────────────────────────────────────────────────────────────────────
export const userService = {
  list:           (p={}) => apiRequest(`/users?${new URLSearchParams(p)}`),
  get:            (id)   => apiRequest(`/users/${id}`),
  update:         (id,d) => apiRequest(`/users/${id}`, { method: 'PUT', json: d }),
  delete:         (id)   => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  updateProfile:  (d)    => apiRequest('/users/profile', { method: 'PUT', json: d }),
  changePassword: (d)    => apiRequest('/users/change-password', { method: 'POST', json: d }),
};

// ─── LOYALTY ──────────────────────────────────────────────────────────────────
export const loyaltyService = {
  rules:       ()                    => apiRequest('/loyalty/rules'),
  updateRules: (d)                   => apiRequest('/loyalty/rules', { method: 'PUT', json: d }),
  award:       (uid, pts, reason)    => apiRequest('/loyalty/award', { method: 'POST', json: { user_id: uid, points: pts, reason } }),
  redeem:      (pts)                 => apiRequest('/loyalty/redeem', { method: 'POST', json: { points: pts } }),
  history:     ()                    => apiRequest('/loyalty/history'),
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notificationService = {
  list:        () => apiRequest('/notifications'),
  markRead:    (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  unreadCount: () => apiRequest('/notifications/unread-count'),
};
