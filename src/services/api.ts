// v2
// services/api.ts — Typed API service for Stitch
//
// IMPORTANT — endpoint prefix quirk:
// Most v1 routers are mounted in app/api/v1/v1_router.py with a prefix that
// is ALSO repeated inside the router's own route decorators, so the real
// path has the segment twice, e.g.:
//   inventory router mounted at prefix "/inventory", routes declared as
//   "/inventory", "/inventory/{id}" → real path is /api/v1/inventory/inventory
// This affects: orders ("/orders" & "/orders/{id}...", but NOT
// "/fashion-orders"), pricing (all), inventory (all), notifications (all),
// analytics (all), and customer_subscriptions (only the "/subscriptions/..."
// routes — "/plans" and "/payment/..." and "/usage..." are NOT doubled).
// auth, organizations, and users are NOT doubled.
// Every path below has been verified against the live route decorators in
// app/api/v1/*.py — do not "clean up" a path without re-checking there.

import type {
  ApiSuccess, TokenResponse, User, Organization, Address,
  Plan, Subscription, UsageStats, UsageLogEntry, UsageRecordPayload,
  LaundryOrder, FashionOrder, Payment, Product, Category,
  GarmentType, LaundryService, DeliveryArea,
  InventoryItem, AppNotification,
  ListPage, SimpleListPage,
  LaundryOrderCreatePayload, FashionOrderCreatePayload, OrderCreateResult,
  DashboardKPIs, RevenueChartPoint, SubscriptionAnalytics,
  SubscriptionInitiateResult, PaymentInitResult, Invoice,
} from '@/types/index.ts';

// ── Environment ──────────────────────────────────────────────────────────────
// Same variable name across every .env.<mode> file (.env.development,
// .env.staging, .env.production) — Vite loads the correct one at build time
// based on --mode, so this code never needs to know or guess which
// environment it's running in.
let _cachedApiUrl: string | null = null;

const getApiUrl = (): string => {

  if (_cachedApiUrl) return _cachedApiUrl;

  _cachedApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
  return _cachedApiUrl;

};

export const API_URL = getApiUrl();
export const PAYSTACK_KEY: string = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxx';

const getAuthHeaders = (json = false): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  const h: Record<string, string> = {};
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
};

// ── Auth endpoints that should NOT trigger redirect-on-401 ────────────────────
const AUTH_PATHS = new Set([
  '/auth/signin',
  '/auth/signup',
  '/auth/signup/verify',
  '/auth/signup/resend',
  '/auth/forgot-password',
  '/auth/forgot-password/verify-code',
  '/auth/forgot-password/resend',
  '/auth/reset-password',
  '/auth/refresh',
]);

const isAuthEndpoint = (path: string): boolean => {
  const clean = path.split('?')[0];
  return AUTH_PATHS.has(clean);
};

export interface ApiClientError extends Error {
  status?: number;
  error_code?: string;
  details?: Record<string, unknown>;
}

const handleResponse = async <T>(res: Response, path: string): Promise<T> => {
  const data = await res.json().catch(() => ({}));

  // 401 on auth endpoints = invalid credentials (show error, don't redirect)
  // 401 elsewhere = session expired (clear auth, redirect)
  if (res.status === 401 && !isAuthEndpoint(path)) {
    ['access_token', 'refresh_token', 'user_data', 'orig_access_token', 'orig_refresh_token', 'orig_user_data', 'impersonating_user']
      .forEach(k => localStorage.removeItem(k));
    window.location.href = '/signin';
    throw new Error('Session expired. Please sign in again.');
  }

  if (!res.ok) {
    // Backend returns: {success:false, message, timestamp, error_code?, details?, error_id?, request_id?}
    const message = data.message || data.error || `HTTP ${res.status}`;
    const err = new Error(message) as ApiClientError;
    err.status = res.status;
    err.error_code = data.error_code;
    err.details = data.details;
    throw err;
  }

  return data as T;
};

export const apiRequest = async <T = unknown>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(!!options.json), ...(options.headers as Record<string, string>) },
    body: options.json ? JSON.stringify(options.json) : options.body,
  });
  return handleResponse<T>(res, path);
};

// ── Envelope unwrapper ──────────────────────────────────────────────────────
// Backend always wraps successful responses as {success, message, timestamp, data}.
// This extracts .data so callers get T directly.
const unwrap = async <T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> => {
  const envelope = await apiRequest<ApiSuccess<T>>(path, options);
  if (!envelope.success) throw new Error(envelope.message || 'Request failed');
  return envelope.data as T;
};

const qs = (params?: Record<string, unknown>): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '';
  const usp = new URLSearchParams();
  entries.forEach(([k, v]) => usp.set(k, String(v)));
  return `?${usp.toString()}`;
};

// ─── AUTH ───────────────────────────────────────────────────────────────────

export interface SignupPayload {
  username: string;
  email: string;
  names?: string;
  phone?: string;
  password: string;
  org_name?: string;
  org_code?: string;
}

export const authService = {
  signIn: (identifier: string, password: string) =>
    unwrap<TokenResponse>('/auth/signin', { method: 'POST', json: { identifier, password } }),

  signUp: (data: SignupPayload) =>
    unwrap<{ token: string; email: string; expires_in_seconds: number }>(
      '/auth/signup', { method: 'POST', json: data },
    ),

  verifySignup: (data: { token: string; email_code: string }) =>
    unwrap<{
      user: User;
      organization?: { id: string; name: string; plan?: string };
      access_token?: string;
      refresh_token?: string;
      token_type?: string;
    }>('/auth/signup/verify', { method: 'POST', json: data }),

  resendSignupCode: (data: { token: string }) =>
    unwrap<{ token: string; email: string; expires_in_seconds: number }>(
      '/auth/signup/resend', { method: 'POST', json: data },
    ),

  signOut: (refresh_token?: string) =>
    apiRequest('/auth/signout', { method: 'POST', json: refresh_token ? { refresh_token } : {} }),

  currentUser: () => unwrap<User & { organization: Organization | null }>('/auth/me'),

  impersonate: (targetId: string) =>
    unwrap<{ access_token: string; token_type: string; impersonated_by: { id: string; name: string; email: string }; user: User }>(
      `/auth/impersonate/${targetId}`, { method: 'POST' },
    ),

  forgotPassword: (email: string) =>
    unwrap<{ token: string; email: string; expires_in_seconds: number }>(
      '/auth/forgot-password', { method: 'POST', json: { email } },
    ),

  verifyResetCode: (data: { token: string; email_code: string }) =>
    unwrap<{ valid: boolean }>('/auth/forgot-password/verify-code', { method: 'POST', json: data }),

  resetPassword: (data: { token: string; email_code: string; new_password: string }) =>
    apiRequest('/auth/reset-password', { method: 'POST', json: data }),

  resendResetCode: (data: { token: string }) =>
    apiRequest('/auth/forgot-password/resend', { method: 'POST', json: data }),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiRequest('/auth/change-password', { method: 'POST', json: data }),

  refreshToken: (refresh_token: string) =>
    unwrap<{ access_token: string; token_type: string }>(
      '/auth/refresh', { method: 'POST', json: { refresh_token } },
    ),

  toggleSignup: (allow_public_signup: boolean) =>
    unwrap<{ public_signup: string; allow_public_signup: boolean }>(
      '/auth/config/signup-toggle', { method: 'POST', json: { allow_public_signup } },
    ),

  acceptInvite: (token: string, new_password: string) =>
    unwrap<{ public_signup: string; allow_public_signup: boolean }>(
      '/auth/accept-invite', { method: 'POST', json: { token, new_password } },
    ),

};

// ─── ORGANIZATIONS ──────────────────────────────────────────────────────────
export const orgService = {
  get: () => unwrap<Organization>('/organizations/me'),
  resetInviteCode: () => unwrap<{ invite_code: string; invite_link: string }>('/organizations/me/invite-code/reset', { method: 'POST' }),
  getInviteLink: () => unwrap<{ invite_code: string; invite_link: string; allow_public_signup: boolean }>('/organizations/me/invite-link'),
  togglePublicSignup: (allow_public_signup: boolean) => unwrap<{ allow_public_signup: boolean }>('/organizations/me/public-signup', { method: 'PATCH', json: { allow_public_signup } }),
  lookupByCode: (code: string) => unwrap<{ name: string; invite_code: string }>(`/organizations/lookup/${code}`),

};

// ─── USERS ──────────────────────────────────────────────────────────────────
export const userService = {
  me: () => unwrap<User>('/users/me'),
  updateMe: (data: Partial<Pick<User, 'names' | 'username' | 'phone' | 'bio' | 'avatar_url'>>) =>
    unwrap<User>('/users/me', { method: 'PUT', json: data }),

  myAddresses: () => unwrap<Address[]>('/users/me/addresses'),
  createAddress: (data: Omit<Address, 'id' | 'created_at' | 'country' | 'city' | 'state'> & { city?: string; state?: string }) =>
    unwrap<Address>('/users/me/addresses', { method: 'POST', json: data }),
  updateAddress: (id: number, data: Partial<Omit<Address, 'id' | 'created_at'>>) =>
    unwrap<Address>(`/users/me/addresses/${id}`, { method: 'PUT', json: data }),
  deleteAddress: (id: number) => apiRequest(`/users/me/addresses/${id}`, { method: 'DELETE' }),
  setDefaultAddress: (id: number) => unwrap<Address>(`/users/me/addresses/${id}/default`, { method: 'PUT' }),

  list: (params?: { page?: number; page_size?: number; search?: string; is_active?: boolean }) =>
    unwrap<ListPage<User>>(`/users/${qs(params)}`),
  get: (id: string) => unwrap<User>(`/users/${id}`),
  update: (id: string, data: Partial<User> & { role?: string; status?: string }) =>
    unwrap<User>(`/users/${id}`, { method: 'PUT', json: data }),
  resetPassword: (id: string, new_password: string) =>
    unwrap<{ email: string }>(`/users/${id}/reset-password`, { method: 'POST', json: { new_password } }),
  delete: (id: string) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  invite: (data: { names: string; email: string; phone?: string; role?: string }) =>
    unwrap<User>('/users/invite', { method: 'POST', json: data }),
  assignRole: (id: string, roleName: string) =>
    unwrap<User>(`/users/${id}/roles/${roleName}`, { method: 'POST' }),
  removeRole: (id: string, roleName: string) =>
    unwrap<User>(`/users/${id}/roles/${roleName}`, { method: 'DELETE' }),
};

// ─── PLANS & SUBSCRIPTIONS (customer_subscriptions router, prefix "/subscriptions") ──
export const planService = {
  list: () => unwrap<Plan[]>('/subscriptions/plans'),
  get: (id: number) => unwrap<Plan>(`/subscriptions/plans/${id}`),
  create: (data: Partial<Plan> & { name: string; amount: number; units: number }) =>
    unwrap<Plan>('/subscriptions/plans', { method: 'POST', json: data }),
  update: (id: string, data: Partial<Plan>) =>
    unwrap<Plan>(`/subscriptions/plans/${id}`, { method: 'PUT', json: data }),
  delete: (id: string) => apiRequest(`/subscriptions/plans/${id}`, { method: 'DELETE' }),
};

export const subscriptionService = {
  mySubscriptions: () => unwrap<Subscription[]>('/subscriptions/my'),
  forUser: (userId: string) => unwrap<Subscription[]>(`/subscriptions/user/${userId}`),
  all: (params?: { page?: number; page_size?: number; status?: string }) => unwrap<SimpleListPage<Subscription>>(`/subscriptions${qs(params)}`),

  initiate: (planId: number, email?: string, callback_url?: string) => unwrap<SubscriptionInitiateResult>(`/subscriptions/payment/${planId}/paystack`, {
      method: 'POST',
      json: { plan_id: planId, email, callback_url },
    }),
  verifyCallback: (reference: string) => unwrap<{ subscription?: Subscription; payment_reference: string; is_topup: boolean }>(
      `/subscriptions/payment/callback/paystack?reference=${encodeURIComponent(reference)}`,
    ),
  verifyInline: (planId: number, reference: string) => unwrap<{ subscription?: Subscription; payment_reference: string; is_topup: boolean }>(
      `/subscriptions/payment/verify-inline/${planId}?reference=${encodeURIComponent(reference)}`,
      { method: 'POST' },
    ),

  cancel: (id: number) => unwrap<Subscription>(`/subscriptions/${id}/cancel`, { method: 'POST' }),
  pause: (id: number) => unwrap<Subscription>(`/subscriptions/${id}/pause`, { method: 'POST' }),
  resume: (id: number) => unwrap<Subscription>(`/subscriptions/${id}/resume`, { method: 'POST' }),
  manageLink: (id: number) => unwrap<{ link: string }>(`/subscriptions/${id}/manage-link`),
};

// ─── Payout Service ──────────────────────
export const payoutService = {
  banks: (provider = 'opay') => unwrap<Array<{ name: string; code: string }>>(`/payouts/banks?provider=${provider}`),
  resolveAccount: (data: { provider: string; account_number: string; bank_code: string }) =>
    unwrap<{ account_name: string; account_number: string }>('/payouts/resolve-account', { method: 'POST', json: data }),
  setup: (data: { provider: string; account_number: string; bank_code: string; platform_fee_percent: number }) =>
    unwrap<{ provider: string; account_name: string; account_number: string }>('/payouts/setup', { method: 'POST', json: data }),
  status: () => unwrap<{
    configured: boolean; provider: string; account_name: string | null;
    account_number: string | null; bank_code: string | null;
    platform_fee_percent: number; settlement_schedule: string;
  }>('/payouts/status'),
};

// ─── USAGE (customer_subscriptions router — NOT doubled) ──────────────────────
export const usageService = {
  statistics: () => unwrap<UsageStats>('/subscriptions/usage/statistics'),
  list: (params?: { page?: number; page_size?: number; mine?: boolean; user_id?: string }) =>
    unwrap<SimpleListPage<UsageLogEntry>>(`/subscriptions/usage${qs(params)}`),
  record: (data: UsageRecordPayload) =>
    unwrap<UsageLogEntry>('/subscriptions/usage', { method: 'POST', json: data }),
};

// ─── ORDERS (doubled prefix for /orders..., NOT doubled for /fashion-orders) ──
export const orderService = {
  list: (params?: {
    page?: number; page_size?: number; order_type?: 'laundry' | 'fashion';
    status?: string; priority?: string; search?: string;
  }) => unwrap<ListPage<LaundryOrder | FashionOrder>>(`/orders${qs(params)}`),
  get: (id: number) => unwrap<LaundryOrder | FashionOrder>(`/orders/${id}`),
  create: (data: LaundryOrderCreatePayload) => unwrap<OrderCreateResult>('/orders', { method: 'POST', json: data }),
  createFashion: (data: FashionOrderCreatePayload) => unwrap<OrderCreateResult>('/orders/fashion-orders', { method: 'POST', json: data }),
  update: (id: string, data: Record<string, unknown>) => apiRequest(`/orders/${id}`, { method: 'PUT', json: data }),
  updateFashion: (id: number, data: Record<string, unknown>) => apiRequest(`/orders/fashion-orders/${id}`, { method: 'PUT', json: data }),
  updateStatus: (id: string, status: string, notes?: string, is_reversal = false) => unwrap<LaundryOrder | FashionOrder>(`/orders/${id}/status`, {
      method: 'PUT', json: { status, notes, is_reversal },
    }),
};

// ─── PAYMENTS (prefix "/payments", routes are "/pays*" and "/invoices") ──────
export const paymentService = {
  initialize: (data: {
    amount: number; email?: string; reference?: string; purpose?: string;
    order_id?: number; subscription_id?: number; plan_id?: number; callback_url?: string;
    metadata?: Record<string, unknown>;
  }) => unwrap<PaymentInitResult>('/payments/initialize', { method: 'POST', json: data }),
  verify: (ref: string) => unwrap<Payment>(`/payments/verify/${ref}`),
  list: (params?: { page?: number; page_size?: number; status?: string; purpose?: string }) =>
    unwrap<SimpleListPage<Payment>>(`/payments${qs(params)}`),
  createInvoice: (data: { customer_name: string; order_id?: number; order_reference?: string; amount: number; notes?: string }) =>
    unwrap<Invoice>('/payments/invoices', { method: 'POST', json: data }),
};

// ─── PRICING (prefix "/pricing", routes doubled "/pricing/...") ──────────────
export const pricingService = {
  garments: () => unwrap<GarmentType[]>('/pricing/garments'),
  createGarment: (d: Partial<GarmentType> & { name: string; category: string; base_price: number }) => unwrap<GarmentType>('/pricing/garments', { method: 'POST', json: d }),
  updateGarment: (id: string, d: Partial<GarmentType>) => unwrap<GarmentType>(`/pricing/garments/${id}`, { method: 'PUT', json: d }),
  deleteGarment: (id: string) => apiRequest(`/pricing/garments/${id}`, { method: 'DELETE' }),

  services: () => unwrap<LaundryService[]>('/pricing/services'),
  createService: (d: Partial<LaundryService> & { name: string }) => unwrap<LaundryService>('/pricing/services', { method: 'POST', json: d }),
  updateService: (id: string, d: Partial<LaundryService>) => unwrap<LaundryService>(`/pricing/services/${id}`, { method: 'PUT', json: d }),
  deleteService: (id: string) => apiRequest(`/pricing/services/${id}`, { method: 'DELETE' }),

  areas: () => unwrap<DeliveryArea[]>('/pricing/areas'),
  createArea: (d: Partial<DeliveryArea> & { name: string; price: number }) => unwrap<DeliveryArea>('/pricing/areas', { method: 'POST', json: d }),
  updateArea: (id: string, d: Partial<DeliveryArea>) => unwrap<DeliveryArea>(`/pricing/areas/${id}`, { method: 'PUT', json: d }),
  deleteArea: (id: string) => apiRequest(`/pricing/areas/${id}`, { method: 'DELETE' }),
  
};

// ─── PRODUCTS (prefix "/products"; "/categories" NOT doubled, "/products" IS) ─
export const categoryService = {
  list: () => unwrap<Category[]>('/products/categories'),
  create: (d: { name: string; description?: string; display_order?: number }) => unwrap<Category>('/products/categories', { method: 'POST', json: d }),
  update: (id: string, d: Partial<Category>) => unwrap<Category>(`/products/categories/${id}`, { method: 'PUT', json: d }),
  delete: (id: string) => apiRequest(`/products/categories/${id}`, { method: 'DELETE' }),
};

export const productService = {
  list: (params?: { page?: number; page_size?: number; category_id?: string; search?: string; include_inactive?: boolean }) =>
    unwrap<SimpleListPage<Product>>(`/products${qs(params)}`),
  get: (id: string) => unwrap<Product>(`/products/${id}`),
  create: (fd: FormData) => unwrap<Product>('/products', { method: 'POST', headers: getAuthHeaders(), body: fd }),
  update: (id: string, fd: FormData) => unwrap<Product>(`/products/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: fd }),
  delete: (id: string) => apiRequest(`/products/${id}`, { method: 'DELETE' }),
  deleteImages: (id: string, imageIds: string[]) => apiRequest(`/products/${id}/images`, { method: 'DELETE', json: { image_ids: imageIds } }),

};

// ─── INVENTORY (prefix "/inventory", routes doubled) ─────────────────────────
export const inventoryService = {
  list: (params?: { page?: number; page_size?: number; category?: string; low_stock?: boolean }) => unwrap<SimpleListPage<InventoryItem>>(`/inventory${qs(params)}`),
  create: (d: Partial<InventoryItem> & { name: string; category: string; unit: string }) => unwrap<InventoryItem>('/inventory', { method: 'POST', json: d }),
  update: (id: string, d: Partial<InventoryItem>) => unwrap<InventoryItem>(`/inventory/${id}`, { method: 'PUT', json: d }),
  adjust: (id: string, d: { action: string; quantity_change: number; reason?: string }) => unwrap<InventoryItem>(`/inventory/${id}/adjust`, { method: 'POST', json: d }),
  delete: (id: string) => apiRequest(`/inventory/${id}`, { method: 'DELETE' }),
};

// ─── NOTIFICATIONS (prefix "/notifications", routes doubled) ─────────────────
export const notificationService = {
  list: (params?: { page?: number; page_size?: number; unread_only?: boolean }) => unwrap<SimpleListPage<AppNotification>>(`/notifications${qs(params)}`),
  markRead: (id: string) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  unreadCount: () => unwrap<{ count: number }>('/notifications/unread-count'),
};

// ─── ANALYTICS (prefix "/analytics", routes doubled) ──────────────────────────
export const analyticsService = {
  dashboard: (period: 'week' | 'month' | 'quarter' | 'year' = 'month') => unwrap<DashboardKPIs>(`/analytics/dashboard?period=${period}`),
  revenue: (months = 6) => unwrap<{ chart: RevenueChartPoint[] }>(`/analytics/revenue?months=${months}`),
  subscriptions: () => unwrap<SubscriptionAnalytics>('/analytics/subscriptions'),
};
