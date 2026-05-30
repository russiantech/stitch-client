# SimplyLovely — Laundry & Fashion SaaS Platform
# Stitch, formaerly SimplyLovely (Great for a business connecting fashion and garment care)

A modern, full-featured React SaaS platform for Laundry & Fashion Operations Management.

---

## Quick Start

```bash
cd client
npm install
cp .env.example .env     # fill in your API URL and Paystack key
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Demo Login
Click **"Sign in as Admin"** or **"Sign in as Customer"** on the sign-in page — no backend needed for the demo.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | Bootstrap 5.3 (CDN) + Custom CSS |
| Icons | Font Awesome 6 (CDN) |
| Fonts | Fraunces + DM Sans (Google Fonts) |
| Payments | Paystack |
| State | React Context API |

---

## Folder Structure

```
client/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx        # Main layout wrapper (sidebar + topbar)
│   │   │   ├── Sidebar.jsx         # Role-aware navigation sidebar
│   │   │   └── Topbar.jsx          # Top navigation bar
│   │   └── shared/
│   │       └── index.jsx           # Reusable UI components
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication state & user session
│   │   └── ToastContext.jsx        # Global toast/notification system
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminUsers.jsx      # User management
│   │   │   └── AdminPlans.jsx      # Service plans management
│   │   ├── analytics/
│   │   │   └── Analytics.jsx       # Revenue, orders & performance charts
│   │   ├── auth/
│   │   │   ├── SignIn.jsx          # Login page
│   │   │   └── SignUp.jsx          # Registration page
│   │   ├── billing/
│   │   │   └── Billing.jsx         # Invoices & Paystack payments
│   │   ├── crm/
│   │   │   └── CRM.jsx             # Customer relationship management
│   │   ├── customer/
│   │   │   ├── Dashboard.jsx       # Customer home dashboard
│   │   │   ├── MyOrders.jsx        # Order history & tracking
│   │   │   ├── CreateOrder.jsx     # Multi-step laundry order form
│   │   │   ├── FashionRequest.jsx  # Multi-step fashion service form
│   │   │   ├── Payments.jsx        # Customer invoice history
│   │   │   └── Profile.jsx         # Profile, addresses, settings
│   │   ├── driver/
│   │   │   └── DriverPortal.jsx    # Driver pickups & deliveries
│   │   ├── fashion/
│   │   │   └── FashionCatalog.jsx  # Product & category CRUD (improved)
│   │   ├── inventory/
│   │   │   └── Inventory.jsx       # Stock management with low-stock alerts
│   │   ├── operations/
│   │   │   ├── OpsDashboard.jsx    # Unified operations overview
│   │   │   ├── LaundryOrders.jsx   # Laundry order management
│   │   │   ├── FashionOrders.jsx   # Fashion order management
│   │   │   ├── Pickups.jsx         # Pickup queue & driver assignment
│   │   │   └── Deliveries.jsx      # Delivery queue & dispatch
│   │   └── staff/
│   │       └── StaffPortal.jsx     # Staff task management
│   ├── services/
│   │   ├── api.js                  # All API service functions
│   │   └── mockData.js             # Realistic demo data & constants
│   ├── styles/
│   │   └── global.css              # Brand tokens, layout, component styles
│   └── App.jsx                     # Routes & auth guards
├── index.html                      # Bootstrap/FA CDN links
├── vite.config.js
├── package.json
└── .env.example
```

---

## Route Map

| Route | Page | Access |
|-------|------|--------|
| `/` | → Dashboard | All |
| `/signin` | Sign In | Public |
| `/signup` | Sign Up | Public |
| `/dashboard` | Customer Dashboard | Customer |
| `/orders` | My Orders + Tracking | Customer |
| `/orders/new` | Create Laundry Order | Customer |
| `/fashion/new` | Fashion Request | Customer |
| `/payments` | Invoices & Payments | Customer |
| `/profile` | Profile & Settings | Customer |
| `/ops` | Operations Dashboard | Admin/Staff |
| `/ops/laundry` | Laundry Orders | Admin/Staff |
| `/ops/fashion` | Fashion Orders | Admin/Staff |
| `/ops/pickups` | Pickup Queue | Admin/Staff |
| `/ops/deliveries` | Delivery Queue | Admin/Staff |
| `/fashion-catalog` | Product & Category CRUD | Admin |
| `/crm` | CRM / Customers | Admin |
| `/inventory` | Inventory Management | Admin |
| `/billing` | Billing & Paystack | Admin |
| `/analytics` | Analytics & Reports | Admin |
| `/admin/users` | User Management | Admin |
| `/admin/plans` | Plans Management | Admin |
| `/staff` | Staff Portal | Staff |
| `/driver` | Driver Portal | Driver |

---

## Key Features

### Fashion Catalog (Improved from Original)
- Full product CRUD with image/video upload (multi-file)
- Category management with add/edit/delete
- Image action: add-to or replace-all
- Per-image delete for existing products
- Pagination, search, category filter
- View modal with image gallery/carousel

### Laundry Workflow
```
Received → Sorted → Washing → Drying → Ironing → Folding → Packing → Ready For Delivery → Out For Delivery → Delivered → Completed
```

### Fashion Workflow
```
Consultation → Measurement → Design Approval → Production → Fitting → Adjustments → Ready → Delivery → Completed
```

### Paystack Integration
- Inline popup handler via `PaystackPop`
- API-based initialization fallback
- Partial payment support
- Invoice receipt generation

---

## Connecting to Your Backend

1. Copy `.env.example` to `.env`
2. Set `VITE_API_URL` to your Flask/FastAPI backend URL
3. Set `VITE_PAYSTACK_PUBLIC_KEY` to your Paystack public key
4. The app will auto-fallback to mock data if the API is unreachable

All API calls are centralised in `src/services/api.js`.

---

## Design System

- **Primary font**: Fraunces (headings) + DM Sans (body)
- **Primary colour**: Bootstrap blue `#0d6efd`
- **CSS variables**: defined in `src/styles/global.css` under `:root`
- **Bootstrap**: linked via CDN in `index.html` — no npm package needed
- **Status badges**: colour-coded across all laundry and fashion statuses
