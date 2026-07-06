// // ─── Domain Types for Stitch Platform ────────────────────────────────────────
// // Kept in exact sync with the FastAPI backend (app/schemas, app/models,
// // User.get_summary() / Organization.get_summary()). Every shape here maps to
// // a real `data` payload returned by app/utils/responses.py:api_response().

// // ─── Auth / Users ──────────────────────────────────────────────────────────

// export type UserRole = 'admin' | 'super_admin' | 'manager' | 'staff' | 'driver' | 'customer' | 'cashier';

// export interface Organization {
//   id: string;
//   name: string;
//   slug: string;
//   plan: string;
//   max_users: number;
//   max_products: number;
//   description: string | null;
//   allow_public_signup: boolean;
//   is_active: boolean;
//   is_paused: boolean;
//   subscription_status: string;
//   subscription_ends_at: string | null;
//   created_at: string;
// }

// // Mirrors User.get_summary() in app/models/users.py exactly.
// export interface User {
//   id: string;
//   names: string;
//   username: string | null;
//   email: string;
//   phone: string | null;
//   avatar_url: string | null;
//   bio: string | null;
//   is_active: boolean;
//   is_org_admin: boolean;
//   email_verified: boolean;
//   roles: UserRole[];
//   organization_id: string | null;
//   organization?: Organization | null;
//   last_seen: string | null;
//   created_at: string;
//   updated_at: string | null;
//   // Only present on GET /users/me (joinedload) — not on list/admin endpoints.
//   addresses?: Address[];
//   // Not yet returned by the backend summary — kept optional so the UI
//   // degrades gracefully rather than crashing when absent.
//   loyalty_points?: number;
//   referral_code?: string | null;
// }

// export interface Address {
//   id: number;
//   label: string;
//   address_line: string;
//   area: string | null;
//   city: string;
//   state: string;
//   country: string;
//   is_default: boolean;
//   created_at: string;
// }

// export interface TokenResponse {
//   access_token: string;
//   refresh_token: string;
//   token_type: string;
//   user: User;
// }

// // ─── Orders ──────────────────────────────────────────────────────────────────

// export type LaundryStatus =
//   | 'Received' | 'Sorted' | 'Washing' | 'Drying' | 'Ironing'
//   | 'Folding' | 'Packing' | 'Ready For Delivery'
//   | 'Out For Delivery' | 'Delivered' | 'Completed' | 'Cancelled';

// export type FashionStatus =
//   | 'Consultation' | 'Measurement' | 'Design Approval' | 'Production'
//   | 'Fitting' | 'Adjustments' | 'Ready' | 'Delivery' | 'Completed' | 'Cancelled';

// export type FashionServiceType =
//   | 'Custom Tailoring' | 'Alteration' | 'Repair'
//   | 'Bespoke Design' | 'Material Pickup' | 'Design Consultation';

// export type OrderPriority = 'Normal' | 'Express' | 'Urgent';
// export type PaymentMethod = 'subscription' | 'direct' | 'cash' | 'transfer';

// export interface StatusHistoryEntry {
//   id: number;
//   from_status: string | null;
//   to_status: string;
//   notes: string | null;
//   is_reversal: boolean;
//   created_at: string;
//   changed_by_name: string | null;
// }

// export interface GarmentLineItem {
//   id: number;
//   garment_type_id: number | null;
//   garment_name: string;
//   category: string | null;
//   quantity: number;
//   unit_price: number;
//   service_multiplier: number;
//   line_total: number;
// }

// export interface ServiceSnapshot {
//   id: number;
//   name: string;
//   price_multiplier: number;
// }

// export interface LaundryOrder {
//   id: number;
//   reference: string;
//   customer_id: string;
//   customer_name: string | null;
//   customer_phone: string | null;

//   status: string;
//   laundry_status: LaundryStatus | null;
//   priority: OrderPriority;
//   payment_method: PaymentMethod;
//   payment_status: string;

//   pickup_date: string | null;
//   pickup_time: string | null;
//   delivery_area: string | null;
//   delivery_address: string | null;

//   garment_subtotal: number;
//   priority_surcharge: number;
//   delivery_fee: number;
//   total_amount: number;

//   garment_count: number | null;
//   garment_items: GarmentLineItem[];
//   status_history: StatusHistoryEntry[];
//   services_json: ServiceSnapshot[] | null;
//   special_instructions: string | null;

//   created_at: string;
//   updated_at: string | null;
// }

// export interface MeasurementsData {
//   chest?: number | null;
//   waist?: number | null;
//   hips?: number | null;
//   shoulder?: number | null;
//   length?: number | null;
//   sleeve?: number | null;
//   inseam?: number | null;
// }

// export interface FashionOrder {
//   id: number;
//   reference: string;
//   customer_id: string;
//   customer_name: string | null;
//   customer_phone: string | null;

//   status: string;
//   fashion_status: FashionStatus | null;
//   service_type: FashionServiceType | null;
//   item_name: string | null;
//   fabric_source: string | null;
//   measurements: MeasurementsData | null;
//   design_notes: string | null;
//   reference_images: string[] | null;

//   priority: OrderPriority;
//   payment_method: PaymentMethod;
//   payment_status: string;
//   total_amount: number;

//   consultation_date: string | null;
//   fitting_date: string | null;
//   delivery_address: string | null;

//   status_history: StatusHistoryEntry[];
//   created_at: string;
//   updated_at: string | null;
// }

// export type AnyOrder = LaundryOrder | FashionOrder;

// export interface GarmentItemInput {
//   garment_type_id?: number | null;
//   garment_name: string;
//   category?: string | null;
//   quantity: number;
//   unit_price: number;
//   service_multiplier?: number;
// }

// export interface LaundryServiceInput {
//   id: number;
//   name: string;
//   price_multiplier: number;
// }

// export interface SubAllocationInput {
//   subscription_id: number;
//   units: number;
// }

// export interface LaundryOrderCreatePayload {
//   services: LaundryServiceInput[];
//   garments: GarmentItemInput[];
//   pickup_date: string;
//   pickup_time?: string | null;
//   delivery_area_id?: number | null;
//   delivery_address?: string | null;
//   priority?: OrderPriority;
//   special_instructions?: string | null;
//   payment_method: PaymentMethod;
//   subscription_id?: number | null;
//   sub_allocations?: SubAllocationInput[] | null;
//   payment_reference?: string | null;
//   garment_subtotal?: number;
//   priority_surcharge?: number;
//   delivery_fee?: number;
//   total_amount?: number;
//   behalf_user_id?: string | null;
// }

// export interface FashionOrderCreatePayload {
//   service_type: FashionServiceType;
//   item_name: string;
//   fabric_source?: string;
//   measurements?: MeasurementsData | null;
//   design_notes?: string | null;
//   reference_images?: string[] | null;
//   preferred_delivery_date?: string | null;
//   consultation_date?: string | null;
//   delivery_address?: string | null;
//   priority?: OrderPriority;
//   payment_method?: PaymentMethod;
//   subscription_id?: number | null;
//   total_amount?: number;
//   behalf_user_id?: string | null;
// }

// export interface OrderCreateResult {
//   id: number;
//   reference: string;
//   total_amount?: number;
// }

// // ─── Subscriptions / Plans / Usage ────────────────────────────────────────────

// export type PlanInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
// export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
// export type UsagePaymentSource = 'subscription' | 'direct' | 'cash';

// export interface Plan {
//   id: number;
//   name: string;
//   description: string | null;
//   amount: number;
//   units: number;
//   interval: PlanInterval;
//   is_popular: boolean;
//   is_active: boolean;
//   paystack_plan_code: string | null;
//   display_order: number;
//   created_at: string;
// }

// export interface Subscription {
//   id: number;
//   plan_id: number;
//   plan_name: string;
//   interval: PlanInterval;
//   status: SubscriptionStatus;
//   units: number;
//   units_used: number;
//   units_remaining: number;
//   amount: number | null;
//   subscribed_at: string;
//   renews_at: string | null;
//   payment_reference: string | null;
//   paystack_subscription_code: string | null;
//   created_at: string;
// }

// export interface UsageMergeItem {
//   subscription_id: number;
//   units: number;
// }

// export interface UsageRecordPayload {
//   user_id: string;
//   units_used: number;
//   payment_method?: UsagePaymentSource;
//   subscription_id?: number | null;
//   sub_allocations?: UsageMergeItem[] | null;
//   order_id?: number | null;
//   order_reference?: string | null;
//   description?: string | null;
//   notes?: string | null;
//   payment_amount?: number | null;
// }

// export interface UsageLogEntry {
//   id: number;
//   user_id: string;
//   subscription_id: number | null;
//   order_id: number | null;
//   units_deducted: number;
//   source: UsagePaymentSource;
//   plan_name: string | null;
//   description: string | null;
//   balance_before: number;
//   balance_after: number;
//   total_units_snapshot: number;
//   is_merged: boolean;
//   merge_breakdown: Array<{ plan_name: string; plan_id: number; units: number }> | null;
//   payment_amount: number | null;
//   created_at: string;
//   user_username: string | null;
//   recorded_by_name: string | null;
// }

// export interface UsageStats {
//   total_units: number;
//   units_used: number;
//   remaining_units: number;
//   usage_percentage: number;
//   subscriptions: Subscription[];
// }

// export interface SubscriptionInitiateResult {
//   reference: string;
//   authorization_url: string | null;
//   access_code: string | null;
//   is_topup: boolean;
//   plan: Plan;
// }

// // ─── Pricing ─────────────────────────────────────────────────────────────────

// export interface GarmentType {
//   id: number;
//   name: string;
//   category: string;
//   base_price: number;
//   unit: string;
//   description: string | null;
//   is_active: boolean;
//   display_order: number;
//   created_at: string;
// }

// export interface LaundryService {
//   id: number;
//   name: string;
//   description: string | null;
//   price_multiplier: number;
//   icon: string | null;
//   is_active: boolean;
//   display_order: number;
//   created_at: string;
// }

// export interface DeliveryArea {
//   id: number;
//   name: string;
//   price: number;
//   state: string;
//   description: string | null;
//   is_active: boolean;
//   display_order: number;
//   created_at: string;
// }

// // ─── Products / Fashion Catalog ───────────────────────────────────────────────

// export interface Category {
//   id: number;
//   name: string;
//   slug: string;
//   description: string | null;
//   display_order: number;
//   products_count: number;
//   created_at: string;
// }

// export interface ProductImage {
//   id: number;
//   url: string;
//   media_type: 'image' | 'video';
//   display_order: number;
//   alt_text: string | null;
// }

// export interface Product {
//   id: number;
//   name: string;
//   slug: string;
//   description: string | null;
//   price: number | null;
//   stock: number;
//   sku: string | null;
//   is_active: boolean;
//   categories: Category[];
//   images: ProductImage[];
//   image_urls: string[];
//   created_at: string;
// }

// // ─── Payments / Invoices ──────────────────────────────────────────────────────

// export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded' | 'reversed';
// export type PaymentProvider = 'paystack' | 'manual' | 'cash';
// export type PaymentPurpose = 'subscription' | 'order' | 'invoice' | 'top_up';

// export interface Payment {
//   id: number;
//   reference: string;
//   provider: PaymentProvider;
//   purpose: PaymentPurpose;
//   status: PaymentStatus;
//   currency: string;
//   amount: number;
//   amount_paid: number | null;
//   channel: string | null;
//   paid_at: string | null;
//   created_at: string;
// }

// export interface PaymentInitResult {
//   reference: string;
//   authorization_url: string | null;
//   access_code: string | null;
// }

// export interface Invoice {
//   id: number;
//   reference: string;
//   amount: number;
//   customer_name: string;
//   status: string;
//   date: string;
// }

// // ─── Inventory ────────────────────────────────────────────────────────────────

// export type InventoryCategory =
//   | 'Detergent' | 'Chemical' | 'Packaging'
//   | 'Fashion Material' | 'Accessory' | 'Equipment' | 'Other';

// export type InventoryLogAction = 'restock' | 'deduct' | 'adjust' | 'discard';

// export interface InventoryItem {
//   id: number;
//   name: string;
//   category: InventoryCategory;
//   quantity: number;
//   unit: string;
//   reorder_level: number;
//   unit_cost: number | null;
//   supplier: string | null;
//   notes: string | null;
//   status: 'In Stock' | 'Low Stock' | 'Out of Stock';
//   created_at: string;
// }

// // ─── Notifications ────────────────────────────────────────────────────────────

// export type NotificationType =
//   | 'order' | 'subscription' | 'payment'
//   | 'system' | 'promotion' | 'loyalty' | 'delivery';

// export interface AppNotification {
//   id: number;
//   title: string;
//   message: string;
//   type: NotificationType;
//   is_read: boolean;
//   read_at: string | null;
//   action_url: string | null;
//   meta: Record<string, unknown> | null;
//   created_at: string;
// }

// // ─── Analytics ────────────────────────────────────────────────────────────────

// export interface DashboardKPIs {
//   revenue: {
//     total: number;
//     this_period: number;
//     prev_period: number;
//     growth: number;
//     currency: string;
//   };
//   orders: {
//     total: number;
//     this_period: number;
//     laundry: number;
//     fashion: number;
//     pending: number;
//   };
//   customers: {
//     total: number;
//     new_period: number;
//   };
//   deliveries: {
//     delivered: number;
//     completed: number;
//   };
//   status_breakdown: Record<string, number>;
//   period: string;
// }

// export interface RevenueChartPoint {
//   month: string;
//   year: number;
//   label: string;
//   revenue: number;
//   orders: number;
// }

// export interface SubscriptionAnalytics {
//   active: number;
//   paused: number;
//   cancelled: number;
//   total_subscription_revenue: number;
// }

// // ─── API envelope shapes ──────────────────────────────────────────────────────
// // Every response (success or error) round-trips through api_response() /
// // the global exception handlers, so these two shapes cover the whole API.

// export interface ApiSuccess<T = unknown> {
//   success: true;
//   message: string;
//   timestamp: string;
//   data: T;
// }

// export interface ApiError {
//   success: false;
//   message: string;
//   timestamp: string;
//   error_code?: string;
//   details?: Record<string, unknown> | { field_errors?: Record<string, string[]> };
//   error_id?: string;
//   request_id?: string;
// }

// // Most list endpoints (orders, users) return this flat shape.
// export interface ListPage<T> {
//   items: T[];
//   pagination: {
//     page: number;
//     page_size: number;
//     total: number;
//     total_pages: number;
//     has_next: boolean;
//     has_prev: boolean;
//   };
// }

// // Some list endpoints (payments, products, inventory, notifications, usage,
// // subscriptions) return a slightly flatter shape with no total_pages/has_next.
// export interface SimpleListPage<T> {
//   items: T[];
//   page: number;
//   page_size: number;
//   total: number;
// }

// // ─── UI helpers ───────────────────────────────────────────────────────────────

// export interface SelectOption {
//   label: string;
//   value: string | number;
// }

// export interface FilePreview {
//   file: File;
//   preview: string;
//   type: string;
// }

// // ─── Paystack global (loaded via CDN) ─────────────────────────────────────────

// declare global {
//   interface Window {
//     PaystackPop?: {
//       setup: (options: {
//         key: string;
//         email: string;
//         amount: number;
//         currency?: string;
//         ref: string;
//         plan?: string;
//         metadata?: Record<string, unknown>;
//         channels?: string[];
//         callback: (response: { reference: string; status: string }) => void;
//         onClose: () => void;
//       }) => { openIframe: () => void };
//     };
//   }
// }

// export {};







// v2
// ─── Domain Types for Stitch Platform ────────────────────────────────────────
// Kept in exact sync with the FastAPI backend (app/schemas, app/models,
// User.get_summary() / Organization.get_summary()). Every shape here maps to
// a real `data` payload returned by app/utils/responses.py:api_response().
//
// ID CONVENTION: every entity in this schema uses a UUID primary key
// (StitchBase/TenantModel), so every id / *_id field below is `string`,
// never `number`. This includes Order.id itself — orders are identified
// externally by the human-readable `reference` string, not a numeric id.

export type UserRole = 'admin' | 'super_admin' | 'manager' | 'staff' | 'driver' | 'customer' | 'cashier';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  max_users: number;
  max_products: number;
  description: string | null;
  allow_public_signup: boolean;
  is_active: boolean;
  is_paused: boolean;
  subscription_status: string;
  subscription_ends_at: string | null;
  created_at: string;
}

// Mirrors User.get_summary() in app/models/users.py exactly.
export interface User {
  id: string;
  names: string;
  username: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  status: UserStatus;
  is_org_admin: boolean;
  email_verified: boolean;
  roles: UserRole[];
  organization_id: string | null;
  organization?: Organization | null;
  last_seen: string | null;
  created_at: string;
  updated_at: string | null;
  // Only present on GET /users/me (joinedload) — not on list/admin endpoints.
  addresses?: Address[];
  // Not yet returned by the backend summary — kept optional so the UI
  // degrades gracefully rather than crashing when absent.
  loyalty_points?: number;
  referral_code?: string | null;
}

export interface Address {
  id: string;
  label: string;
  address_line: string;
  area: string | null;
  city: string;
  state: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export type LaundryStatus =
  | 'Received' | 'Sorted' | 'Washing' | 'Drying' | 'Ironing'
  | 'Folding' | 'Packing' | 'Ready For Delivery'
  | 'Out For Delivery' | 'Delivered' | 'Completed' | 'Cancelled';

export type FashionStatus =
  | 'Consultation' | 'Measurement' | 'Design Approval' | 'Production'
  | 'Fitting' | 'Adjustments' | 'Ready' | 'Delivery' | 'Completed' | 'Cancelled';

export type FashionServiceType =
  | 'Custom Tailoring' | 'Alteration' | 'Repair'
  | 'Bespoke Design' | 'Material Pickup' | 'Design Consultation';

export type OrderPriority = 'Normal' | 'Express' | 'Urgent';
export type PaymentMethod = 'subscription' | 'direct' | 'cash' | 'transfer';

export interface StatusHistoryEntry {
  id: string;
  from_status: string | null;
  to_status: string;
  notes: string | null;
  is_reversal: boolean;
  created_at: string;
  changed_by_name: string | null;
}

export interface GarmentLineItem {
  id: string;
  garment_type_id: string | null;
  garment_name: string;
  category: string | null;
  quantity: number;
  unit_price: number;
  service_multiplier: number;
  line_total: number;
}

export interface ServiceSnapshot {
  id: string;
  name: string;
  price_multiplier: number;
}

export interface LaundryOrder {
  id: string;
  reference: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;

  status: string;
  laundry_status: LaundryStatus | null;
  priority: OrderPriority;
  payment_method: PaymentMethod;
  payment_status: string;

  pickup_date: string | null;
  pickup_time: string | null;
  delivery_area: string | null;
  delivery_address: string | null;

  garment_subtotal: number;
  priority_surcharge: number;
  delivery_fee: number;
  total_amount: number;

  garment_count: number | null;
  garment_items: GarmentLineItem[];
  status_history: StatusHistoryEntry[];
  services_json: ServiceSnapshot[] | null;
  special_instructions: string | null;

  created_at: string;
  updated_at: string | null;
}

export interface MeasurementsData {
  chest?: number | null;
  waist?: number | null;
  hips?: number | null;
  shoulder?: number | null;
  length?: number | null;
  sleeve?: number | null;
  inseam?: number | null;
}

export interface FashionOrder {
  id: string;
  reference: string;
  customer_id: string;
  customer_name: string | null;
  customer_phone: string | null;

  status: string;
  fashion_status: FashionStatus | null;
  service_type: FashionServiceType | null;
  item_name: string | null;
  fabric_source: string | null;
  measurements: MeasurementsData | null;
  design_notes: string | null;
  reference_images: string[] | null;

  priority: OrderPriority;
  payment_method: PaymentMethod;
  payment_status: string;
  total_amount: number;

  consultation_date: string | null;
  fitting_date: string | null;
  delivery_address: string | null;

  status_history: StatusHistoryEntry[];
  created_at: string;
  updated_at: string | null;
}

export type AnyOrder = LaundryOrder | FashionOrder;

export interface GarmentItemInput {
  garment_type_id?: string | null;
  garment_name: string;
  category?: string | null;
  quantity: number;
  unit_price: number;
  service_multiplier?: number;
}

export interface LaundryServiceInput {
  id: string;
  name: string;
  price_multiplier: number;
}

export interface SubAllocationInput {
  subscription_id: string;
  units: number;
}

export interface LaundryOrderCreatePayload {
  services: LaundryServiceInput[];
  garments: GarmentItemInput[];
  pickup_date: string;
  pickup_time?: string | null;
  delivery_area_id?: string | null;
  delivery_address?: string | null;
  priority?: OrderPriority;
  special_instructions?: string | null;
  payment_method: PaymentMethod;
  subscription_id?: string | null;
  sub_allocations?: SubAllocationInput[] | null;
  payment_reference?: string | null;
  garment_subtotal?: number;
  priority_surcharge?: number;
  delivery_fee?: number;
  total_amount?: number;
  behalf_user_id?: string | null;
}

export interface FashionOrderCreatePayload {
  service_type: FashionServiceType;
  item_name: string;
  fabric_source?: string;
  measurements?: MeasurementsData | null;
  design_notes?: string | null;
  reference_images?: string[] | null;
  preferred_delivery_date?: string | null;
  consultation_date?: string | null;
  delivery_address?: string | null;
  priority?: OrderPriority;
  payment_method?: PaymentMethod;
  subscription_id?: string | null;
  total_amount?: number;
  behalf_user_id?: string | null;
}

export interface OrderCreateResult {
  id: string;
  reference: string;
  total_amount?: number;
}

// ─── Subscriptions / Plans / Usage ────────────────────────────────────────────

export type PlanInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired' | 'pending';
export type UsagePaymentSource = 'subscription' | 'direct' | 'cash';

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  units: number;
  interval: PlanInterval;
  is_popular: boolean;
  is_active: boolean;
  paystack_plan_code: string | null;
  display_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan_id: string;
  plan_name: string;
  interval: PlanInterval;
  status: SubscriptionStatus;
  units: number;
  units_used: number;
  units_remaining: number;
  amount: number | null;
  subscribed_at: string;
  renews_at: string | null;
  payment_reference: string | null;
  paystack_subscription_code: string | null;
  created_at: string;
}

export interface UsageMergeItem {
  subscription_id: string;
  units: number;
}

export interface UsageRecordPayload {
  user_id: string;
  units_used: number;
  payment_method?: UsagePaymentSource;
  subscription_id?: string | null;
  sub_allocations?: UsageMergeItem[] | null;
  order_id?: string | null;
  order_reference?: string | null;
  description?: string | null;
  notes?: string | null;
  payment_amount?: number | null;
}

export interface UsageLogEntry {
  id: string;
  user_id: string;
  subscription_id: string | null;
  order_id: string | null;
  units_deducted: number;
  source: UsagePaymentSource;
  plan_name: string | null;
  description: string | null;
  balance_before: number;
  balance_after: number;
  total_units_snapshot: number;
  is_merged: boolean;
  merge_breakdown: Array<{ plan_name: string; plan_id: string; units: number }> | null;
  payment_amount: number | null;
  created_at: string;
  user_username: string | null;
  recorded_by_name: string | null;
}

export interface UsageStats {
  total_units: number;
  units_used: number;
  remaining_units: number;
  usage_percentage: number;
  subscriptions: Subscription[];
}

export interface SubscriptionInitiateResult {
  reference: string;
  authorization_url: string | null;
  access_code: string | null;
  is_topup: boolean;
  plan: Plan;
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

export interface GarmentType {
  id: string;
  name: string;
  category: string;
  base_price: number;
  unit: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface LaundryService {
  id: string;
  name: string;
  description: string | null;
  price_multiplier: number;
  icon: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface DeliveryArea {
  id: string;
  name: string;
  price: number;
  state: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// ─── Products / Fashion Catalog ───────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  products_count: number;
  created_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  media_type: 'image' | 'video';
  display_order: number;
  alt_text: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  stock: number;
  sku: string | null;
  is_active: boolean;
  categories: Category[];
  images: ProductImage[];
  image_urls: string[];
  created_at: string;
}

// ─── Payments / Invoices ──────────────────────────────────────────────────────

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded' | 'reversed';
export type PaymentProvider = 'paystack' | 'manual' | 'cash';
export type PaymentPurpose = 'subscription' | 'order' | 'invoice' | 'top_up';

export interface Payment {
  id: string;
  reference: string;
  provider: PaymentProvider;
  purpose: PaymentPurpose;
  status: PaymentStatus;
  currency: string;
  amount: number;
  amount_paid: number | null;
  channel: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface PaymentInitResult {
  reference: string;
  authorization_url: string | null;
  access_code: string | null;
}

export interface Invoice {
  id: string;
  reference: string;
  amount: number;
  customer_name: string;
  status: string;
  date: string;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryCategory =
  | 'Detergent' | 'Chemical' | 'Packaging'
  | 'Fashion Material' | 'Accessory' | 'Equipment' | 'Other';

export type InventoryLogAction = 'restock' | 'deduct' | 'adjust' | 'discard';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  reorder_level: number;
  unit_cost: number | null;
  supplier: string | null;
  notes: string | null;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'order' | 'subscription' | 'payment'
  | 'system' | 'promotion' | 'loyalty' | 'delivery';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DashboardKPIs {
  revenue: {
    total: number;
    this_period: number;
    prev_period: number;
    growth: number;
    currency: string;
  };
  orders: {
    total: number;
    this_period: number;
    laundry: number;
    fashion: number;
    pending: number;
  };
  customers: {
    total: number;
    new_period: number;
  };
  deliveries: {
    delivered: number;
    completed: number;
  };
  status_breakdown: Record<string, number>;
  period: string;
}

export interface RevenueChartPoint {
  month: string;
  year: number;
  label: string;
  revenue: number;
  orders: number;
}

export interface SubscriptionAnalytics {
  active: number;
  paused: number;
  cancelled: number;
  total_subscription_revenue: number;
}

// ─── API envelope shapes ──────────────────────────────────────────────────────
// Every response (success or error) round-trips through api_response() /
// the global exception handlers, so these two shapes cover the whole API.

export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  timestamp: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  timestamp: string;
  error_code?: string;
  details?: Record<string, unknown> | { field_errors?: Record<string, string[]> };
  error_id?: string;
  request_id?: string;
}

// Most list endpoints (orders, users) return this flat shape.
export interface ListPage<T> {
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Some list endpoints (payments, products, inventory, notifications, usage,
// subscriptions) return a slightly flatter shape with no total_pages/has_next.
export interface SimpleListPage<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export interface FilePreview {
  file: File;
  preview: string;
  type: string;
}

// ─── Paystack global (loaded via CDN, Inline v2) ──────────────────────────────
// v2 replaces v1's PaystackPop.setup({...}).openIframe() with an instance:
//   const popup = new window.PaystackPop();
//   popup.newTransaction({ ... })       — start a fresh transaction
//   popup.resumeTransaction(accessCode, { ... }) — resume one the backend
//                                                    already initialized
// See https://developers.paystack.co/docs/paystack-inline

interface PaystackTransactionCallbacks {
  onSuccess: (response: { reference: string; status: string }) => void | Promise<void>;
  onLoad?: () => void;
  onCancel?: () => void;
  onError?: (error: { message: string }) => void;
}

interface PaystackNewTransactionOptions extends PaystackTransactionCallbacks {
  key: string;
  email: string;
  amount: number;
  currency?: string;
  reference?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
  channels?: string[];
}

declare global {
  interface Window {
    PaystackPop?: {
      new (): {
        newTransaction: (options: PaystackNewTransactionOptions) => void;
        resumeTransaction: (accessCode: string, callbacks: PaystackTransactionCallbacks) => void;
      };
    };
  }
}

export {};
