# Tourvaa Frontend - End-to-End Documentation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Tech Stack & Dependencies](#3-tech-stack--dependencies)
4. [Configuration & Environment](#4-configuration--environment)
5. [Routing Architecture](#5-routing-architecture)
6. [Authentication System](#6-authentication-system)
7. [Permission System](#7-permission-system)
8. [API Layer](#8-api-layer)
9. [Page Reference - Public Routes](#9-page-reference--public-routes)
10. [Page Reference - Admin Routes](#10-page-reference--admin-routes)
11. [Component Library](#11-component-library)
12. [Hooks Reference](#12-hooks-reference)
13. [Service Layer](#13-service-layer)
14. [Types & Interfaces](#14-types--interfaces)
15. [Utilities](#15-utilities)
16. [Role-Based Dashboard Variations](#16-role-based-dashboard-variations)
17. [Running the App](#17-running-the-app)
18. [Page-Permission Map](#18-page-permission-map)

---

## 1. Overview

The Tourvaa frontend is a **Next.js 16 App Router** application that serves as the admin/operations console and public-facing landing page for the Tourvaa travel booking platform.

**What it covers:**
- Public landing page and auth flows (login, register, forgot/reset password)
- Role-based admin dashboard with per-role stat cards and actions
- Full tour CMS (create/edit with 11 sub-resource tabs)
- Booking lifecycle management
- Customer, supplier, agent, and affiliate management with approval workflows
- Payment and invoice tracking
- Reporting and analytics
- Chatbot FAQ management
- System administration (roles, permissions, settings, email templates, sessions, audit logs)

**Frontend location:** `d:\ayati\tourvaa\tourvaa-admin-frontend`

**Dev URL:** `http://localhost:3000`

**Backend proxy target:** `http://127.0.0.1:8000` (all `/api/*` calls are proxied by Next.js rewrites)

---

## 2. Project Structure

```
tourvaa-admin-frontend/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout - wraps ToastProvider + AuthProvider
│   ├── globals.css               # Global styles
│   ├── (public)/                 # Public route group
│   │   ├── layout.tsx            # Uses PublicLayout
│   │   └── page.tsx              # Landing page (/)
│   ├── login/page.tsx            # Login
│   ├── register/page.tsx         # Registration
│   ├── forgot-password/page.tsx  # Forgot password
│   ├── reset-password/page.tsx   # Reset password (token-based)
│   └── admin/                    # Protected admin area
│       ├── layout.tsx            # Admin layout metadata
│       ├── page.tsx              # /admin → redirects to /admin/dashboard
│       ├── dashboard/page.tsx    # Role-based dashboard
│       ├── users/page.tsx        # User management
│       ├── roles/page.tsx        # Role management
│       ├── permissions/page.tsx  # Permission management
│       ├── customers/
│       │   ├── page.tsx          # Customer list
│       │   └── [id]/page.tsx     # Customer detail
│       ├── suppliers/
│       │   ├── page.tsx          # Supplier list & approval
│       │   └── [id]/page.tsx     # Supplier detail
│       ├── agents/
│       │   ├── page.tsx          # Agent list & approval
│       │   └── [id]/page.tsx     # Agent detail
│       ├── affiliates/
│       │   ├── page.tsx          # Affiliate list & approval
│       │   └── [id]/page.tsx     # Affiliate detail
│       ├── tours/
│       │   ├── page.tsx          # Tour list
│       │   ├── create/page.tsx   # Create tour
│       │   ├── [id]/edit/page.tsx# Edit tour
│       │   ├── categories/page.tsx
│       │   └── subcategories/page.tsx
│       ├── bookings/
│       │   ├── page.tsx          # Booking list
│       │   └── [id]/page.tsx     # Booking detail
│       ├── payments/page.tsx     # Payment list
│       ├── invoices/page.tsx     # Invoice list
│       ├── reports/page.tsx      # Reports
│       ├── chatbot/page.tsx      # FAQ/chatbot admin
│       ├── notifications/page.tsx
│       ├── sessions/page.tsx
│       ├── activity-logs/page.tsx
│       ├── email-templates/page.tsx
│       ├── profile/page.tsx
│       └── settings/
│           ├── page.tsx          # General settings
│           ├── payment/page.tsx  # Payment gateway config
│           ├── api/page.tsx      # API / integration settings
│           ├── countries/page.tsx
│           └── cities/page.tsx
│
├── components/                   # All React components
│   ├── admin/                    # Admin shell (header, sidebar, footer, layout)
│   ├── auth/                     # Auth page templates & gates
│   ├── bookings/                 # Booking-specific components
│   ├── cms/                      # CmsCrudPage, TourFormPage
│   ├── common/                   # Shared wrappers, states, access denied
│   ├── customers/                # Customer-specific components
│   ├── layout/                   # DashboardLayout, Header, Sidebar
│   ├── operations/               # Shared approval/review components
│   ├── public/                   # Public layout and header
│   ├── tours/                    # Tour tab components (11 tabs)
│   └── ui/                       # Design system primitives
│
├── hooks/                        # Custom React hooks
├── lib/                          # Utilities and services
│   ├── api.ts                    # Axios instance with JWT refresh
│   ├── session.ts                # localStorage token management
│   ├── auth.ts                   # Auth helpers
│   ├── validators.ts             # Form validation helpers
│   ├── error-handler.ts          # API error message extraction
│   ├── location-options.ts       # Countries, states, cities, phone codes
│   ├── media-url.ts              # Storage URL resolution
│   ├── navigation.ts             # Navigation helpers
│   └── services/                 # API service modules (12 files)
│
├── providers/
│   └── AuthProvider.tsx          # Global auth context
├── types/
│   ├── auth.ts                   # Auth-related TypeScript types
│   └── user.ts                   # User and Role types
├── config/
│   └── page-permissions.ts       # Route → required permission map
├── next.config.ts                # Next.js config (rewrites, security headers)
├── tailwind.config.*             # Tailwind config
├── tsconfig.json                 # TypeScript config
└── package.json
```

---

## 3. Tech Stack & Dependencies

| Package | Version | Purpose |
|---|---|---|
| `next` | 16.2.7 | Framework (App Router) |
| `react` / `react-dom` | 19.2.4 | UI library |
| `typescript` | ^5 | Type safety |
| `tailwindcss` | ^4 | Utility-first CSS |
| `axios` | ^1.17.0 | HTTP client |
| `lucide-react` | ^1.17.0 | Icon library |
| `react-hook-form` | ^7.78.0 | Form state management |
| `eslint` + `eslint-config-next` | ^9 / 16.2.7 | Linting |

**No state management library** (Redux, Zustand, Jotai) - all state via React Context + local `useState`.

**No CSS-in-JS** - pure Tailwind CSS 4 utility classes.

---

## 4. Configuration & Environment

### Environment Variables

```env
# .env.local (development)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api

# Server-side only (required in production - crashes build if missing)
API_PROXY_TARGET=http://127.0.0.1:8000
```

`API_PROXY_TARGET` is **server-side only** (no `NEXT_PUBLIC_` prefix). It is used exclusively inside `next.config.ts` to configure rewrites. The browser never sees this value.

`NEXT_PUBLIC_API_URL` is consumed by client-side code when building absolute API URLs (e.g., for media assets).

### next.config.ts

**API Proxy rewrites** - The browser calls `/api/*` on port 3000; Next.js forwards them to the FastAPI backend at `API_PROXY_TARGET`. This means:
- No CORS issues during development
- Production works the same way - just point `API_PROXY_TARGET` to the real backend URL

**Special-cased rewrites** (trailing slash normalization for FastAPI strict matching):
```
/api/users        → backend/api/users/
/api/roles        → backend/api/roles/
/api/permissions  → backend/api/permissions/
/api/settings     → backend/api/settings/
/api/email-templates → backend/api/email-templates/
/api/:path*       → backend/api/:path* (catch-all)
/storage/:path*   → backend/storage/:path* (static files)
```

**Security headers** applied to all routes:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'`; allows inline scripts/styles, images from backend origin |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Denies camera, microphone, geolocation |

### tsconfig.json

- **Target:** ES2017
- **Path alias:** `@/*` → project root (use `@/components/...`, `@/lib/...`, etc.)
- **JSX:** react-jsx
- **Module resolution:** bundler

---

## 5. Routing Architecture

The app uses the **Next.js 15+ App Router** with two route groups:

```
(public)    → layout uses PublicLayout (nav + footer)
admin/      → layout uses AdminLayout (sidebar + header)
```

### Route Groups

| Group | Routes | Auth required |
|---|---|---|
| `(public)` | `/` | No |
| (root) | `/login`, `/register`, `/forgot-password`, `/reset-password` | No |
| `admin/` | All `/admin/*` routes | Yes - JWT + permission |

### Auth Guards

`AuthProvider` watches `pathname` on every route change:
- If `token` is null and route is not public → redirects to `/login`
- If `token` exists and user visits `/login` → redirects to `/admin/dashboard`

Individual pages also use `ProtectedRoute` with a `requiredPermission` prop for fine-grained access denial (shows `AccessDenied` component instead of redirecting).

### Dynamic Routes

| Pattern | What it resolves |
|---|---|
| `/admin/customers/[id]` | Customer detail |
| `/admin/suppliers/[id]` | Supplier detail |
| `/admin/agents/[id]` | Agent detail |
| `/admin/affiliates/[id]` | Affiliate detail |
| `/admin/bookings/[id]` | Booking detail |
| `/admin/tours/[id]/edit` | Tour edit form |

---

## 6. Authentication System

### Token Storage

Tokens are stored in **localStorage** under the key `tourvaa_token`.

```typescript
// lib/session.ts
const TOKEN_KEY = "tourvaa_token";

setToken(token: string)       // write to localStorage
getStoredTokenSafe()          // read from localStorage (SSR-safe)
clearSession()                // remove token from localStorage
isAuthenticated()             // boolean check
```

> **Note:** localStorage means the token survives page refreshes but is accessible to JavaScript. The app mitigates XSS risk via CSP headers.

### AuthProvider (`providers/AuthProvider.tsx`)

Wraps the entire app. Provides a context with:

```typescript
type AuthContextValue = {
  token: string | null
  dashboard: DashboardData | null
  user: AuthUser | null
  loading: boolean
  error: string
  isLoggedIn: boolean
  loginWithToken: (token: string) => Promise<void>   // stores token + loads session
  refreshSession: () => Promise<DashboardData | null> // calls GET /dashboard/me
  logout: () => void                                  // clears token + redirects
  hasPermission: (permission: string) => boolean      // checks with alias expansion
}
```

**Session restore flow** (on every page load / refresh):
1. Read token from localStorage
2. Call `GET /api/dashboard/me` to verify token and load user + permissions
3. If call succeeds → set `dashboard` state, mark `loading = false`
4. If call fails → clear dashboard, redirect to login

**DashboardData shape** (returned by `/api/dashboard/me`):

```typescript
type DashboardData = {
  user: AuthUser
  permissions: Permission[]
  menus: MenuItem[]
  sidebar_menu: MenuItem[]
  allowed_modules: string[]
  dashboard_type: string          // "super-admin" | "admin" | "supplier" | etc.
  stats: DashboardStats
  pending_approvals: PendingApproval[]
}
```

### Login Flow

```
1. User submits /login form
2. POST /api/auth/login  → { access_token, user, ... }
3. auth.loginWithToken(access_token)
   a. Stores token in localStorage
   b. Calls refreshSession() → GET /api/dashboard/me
   c. Sets dashboard state (permissions, menus, stats)
4. router.push("/admin/dashboard")
```

### Logout Flow

```
1. auth.logout() called (hook or header button)
2. clearSession() → removes localStorage token
3. Sets token = null, dashboard = null
4. router.push("/login")
```

### Automatic Token Refresh (`lib/api.ts`)

When any API call returns `401`:
1. Check if it's the refresh call itself (avoid loop) → hard logout if so
2. Check if request already retried → hard logout if so
3. If another refresh is already in flight → queue this request and wait
4. Call `POST /api/auth/refresh-token` with current token in header
5. On success → store new token, replay all queued requests
6. On failure → `hardLogout()` - clears localStorage, dispatches `tourvaa:toast` warning event, redirects to `/login`

```
Request → 401 → refresh token → retry original request
                              ↘ (if already refreshing) → queue → drain on success
```

---

## 7. Permission System

### `hasPermission(slug)` - `AuthProvider`

Checks whether the current user holds a given permission. Supports **both dotted and legacy slug formats** through alias expansion.

```typescript
auth.hasPermission("bookings.view")  // true if user has bookings.view OR view-bookings
auth.hasPermission("view-bookings")  // same result
```

### Alias Expansion Logic (`permissionAliases`)

| Input | Expanded set |
|---|---|
| `bookings.view` | `bookings.view`, `view-bookings` |
| `view-bookings` | `view-bookings`, `bookings.view` |
| `email_templates.view` | `email_templates.view`, `view-email_templates`, `email.view`, `view-email` |
| `activity_logs.view` | `activity_logs.view`, `activity-logs.view`, `view-activity_logs` |

Module aliases: `activity_logs` ↔ `activity-logs`, `email_templates` ↔ `email`

Action aliases: `edit` ↔ `update`

### Page-Level Permission Gate (`config/page-permissions.ts`)

Every admin route maps to a required permission. Used by `ProtectedRoute` and `ModuleWrapper`:

```typescript
"/admin/dashboard"       → "dashboard.view"
"/admin/users"           → "users.view"
"/admin/customers"       → "customers.view"
"/admin/suppliers"       → "suppliers.view"
"/admin/agents"          → "agents.view"
"/admin/affiliates"      → "affiliates.view"
"/admin/tours"           → "tours.view"
"/admin/tours/create"    → "tours.create"
"/admin/tours/[id]/edit" → "tours.edit"
"/admin/bookings"        → "bookings.view"
"/admin/payments"        → "payments.view"
"/admin/invoices"        → "invoices.view"
"/admin/reports"         → "reports.view"
"/admin/roles"           → "roles.view"
"/admin/permissions"     → "permissions.view"
"/admin/settings"        → "settings.view"
"/admin/activity-logs"   → "activity_logs.view"
"/admin/notifications"   → "notifications.view"
"/admin/sessions"        → "sessions.view"
"/admin/email-templates" → "email_templates.view"
"/admin/profile"         → "profile.view"
// + settings sub-pages, CMS sub-pages
```

### Sidebar

Built dynamically from `dashboard.sidebar_menu` returned by `/api/dashboard/me`. Each item has `{ label, permission, module }`. The sidebar only renders items where the user `hasPermission(item.permission)`.

---

## 8. API Layer

### Axios Instance (`lib/api.ts`)

```typescript
const api = axios.create({ baseURL: "/api" });
```

`baseURL` is `/api` - relative to the current host. Next.js rewrites forward to the backend.

**Request interceptor:** Reads token from localStorage and sets `Authorization: Bearer <token>` header on every request.

**Response interceptor:** Handles 401 (token refresh) and 403 (permission denied toast).

### Usage Pattern

```typescript
import api from "@/lib/api";

// GET with query params
const res = await api.get("/customers", { params: { page: 1, limit: 20, search: "" } });

// POST
const res = await api.post("/auth/login", { email, password });

// PUT
const res = await api.put(`/users/${id}`, data);

// PATCH
await api.patch(`/bookings/${id}/status`, { status: "confirmed" });

// DELETE
await api.delete(`/tours/${id}`);
```

### Error Handling (`lib/error-handler.ts`)

```typescript
getApiErrorMessage(error)
// → extracts error.response.data.detail (FastAPI format)
// → falls back to error.message
// → falls back to "An unexpected error occurred"
```

Used everywhere in catch blocks to show toasts.

---

## 9. Page Reference - Public Routes

### `/` - Landing Page

**File:** `app/(public)/page.tsx`  
**Layout:** `PublicLayout` (PublicHeader + footer)

Content:
- Hero banner with headline and CTA buttons ("Start Planning", "Open Console")
- Stats row: 120+ Tours, 24/7 Support, 4.9 Rating
- Featured route card (Coast to Hills Escape)
- Popular destinations: Kerala Backwaters, Himalayan Escapes, Desert Trails
- Feature highlights: Planned Clearly, Curated Carefully, Supported Live

---

### `/login` - Login Page

**File:** `app/login/page.tsx`  
**Layout:** `AuthLayout`

Form fields:
- Email (normalized to lowercase on submit)
- Password (with show/hide toggle)

Behavior:
- Calls `POST /api/auth/login`
- On success → `loginWithToken()` → redirect to `/admin/dashboard`
- Shows inline error state on failure (no toast - uses `useAuth().error`)
- Info chip: "Menus load from your role permissions"
- Links to `/forgot-password` and `/register`
- If already logged in → renders nothing (`return null`) while `AuthProvider` handles redirect

---

### `/register` - Registration Page

**File:** `app/register/page.tsx`  
**Layout:** `AuthLayout`

Form fields:

- Account Type (dropdown - fetched from `GET /api/roles/public/options`; supports `customer`, `supplier`, `agent-reseller`)
- Name, Email
- Password (min 8 chars, uppercase + lowercase + digit - validated via `validatePassword`)
- Confirm Password (must match)

Role-specific behavior after `POST /api/auth/register`:

- **Customer** → success message: "Registered successfully. You can log in now." - no auto-login, user must go to `/login`
- **Supplier** / **Agent** → success message: "Registered successfully. Please wait for admin approval."
- On success: form resets, message shown inline. No redirect.

---

### `/forgot-password` - Forgot Password

**File:** `app/forgot-password/page.tsx`  
**Layout:** `AuthLayout`

Form fields: Email only

- Calls `POST /api/auth/forgot-password`
- On success: shows `response.data.message` (e.g. "Reset link has been sent to your email.") and clears the field
- On failure: shows error message from backend (`detail` field)
- Link back to `/login`

---

### `/reset-password` - Reset Password

**File:** `app/reset-password/page.tsx`  
**Layout:** `AuthLayout`

Reads `?token=` from URL query string.

- On mount: validates token via `GET /api/auth/reset-password/validate?token=...`; shows "Checking reset link..." while in flight
- If token missing or invalid/expired → shows error, submit button disabled - form is visible but inoperable
- Form fields: New Password + Confirm Password (shared show/hide toggle); client-side validates match and `validatePassword` before submitting
- On submit: `POST /api/auth/reset-password` with `{ token, password }`
- On success: shows success message inline and disables the form - **no redirect to `/login`** (user clicks the "Back to Login" link)
- Wrapped in `<Suspense>` for async `useSearchParams()`

---

## 10. Page Reference - Admin Routes

All admin routes require a valid JWT. Access is denied (shows `AccessDenied`) if the user lacks the required permission (see [§18 Page-Permission Map](#18-page-permission-map)).

---

### `/admin/dashboard` - Dashboard

**File:** `app/admin/dashboard/page.tsx`  
**Permission:** `dashboard.view`

The most complex page. Content is fully role-scoped based on `dashboard.dashboard_type`.

The dashboard page calls backend analytics endpoints directly (not via `dashboardService`) using `Promise.all`:

```text
GET /dashboard/summary
GET /dashboard/bookings
GET /dashboard/payments
GET /dashboard/reports
GET /dashboard/recent-activities
GET /suppliers/?approval_status=pending&page=1&limit=10  (ops roles only)
GET /agents/?approval_status=pending&page=1&limit=10     (ops roles only)
```

All endpoints accept optional `?start_date`, `?end_date`, `?country_id` filters (admin only).

**Super Admin / Admin view:**

- 6 stat cards from API: Total Bookings, Total Customers, Pending Payments, Total Revenue, Suppliers (with pending count), Agents (with pending count)
- Date range + Country filter bar (triggers re-fetch)
- Booking analytics progress bars (Upcoming, Ongoing, Completed, Cancelled, Supplier Pending)
- Payment status progress bars (Full, Partial, Pending, Failed, Refunded)
- Reports snapshot panel (total, scheduled, exported counts + report cards + recent exports)
- Alerts aside: pending admin approvals, supplier approvals, payment counts needing attention
- Recent admin activity aside (last 5 actions from `recent_admin_actions`)
- **User approvals** - inline Approve / Reject; requires `update-users` permission (legacy slug, not `users.update`). Reject opens native `confirm()` dialog - no reason prompt.
- **Supplier approvals** - inline Approve / Reject via `PATCH /suppliers/{id}/approve` and `PATCH /suppliers/{id}/reject`. Reject opens `window.prompt()` for reason text.
- **Agent approvals** - inline Approve / Reject via `PATCH /agents/{id}/approve` and `PATCH /agents/{id}/reject`. Reject opens `window.prompt()` for reason text.

**Sub Admin view:**

- Permission-filtered stat cards (Pending Suppliers, Pending Agents, Pending Affiliates, Published Tours - only shown if user holds the matching `.view` permission)
- Same supplier/agent approval widgets as admin (filtered by permission)
- "Pending Actions" alert aside listing counts

**Supplier view:**

- 3 stat cards with **hardcoded placeholder values**: Active Tours (18), Bookings (42), Pending Payout (₹8.4k)
- Workspace action cards: Tour Inventory → `/admin/tours`, Booking Requests → `/admin/bookings`, Payments → `/admin/payments`

**Agent/Reseller view:**

- 3 stat cards with **hardcoded placeholder values**: Customers (64), Bookings (27), Commission (₹3.2k)
- Workspace action cards: Customers, Create Booking, Reports

**Customer view:**

- 3 stat cards with **hardcoded placeholder values**: Upcoming Trips (2), Saved Tours (8), Open Requests (1)
- Travel Shortcuts: Browse Tours, My Bookings, Profile

---

### `/admin/users` - User Management

**File:** `app/admin/users/page.tsx`  
**Permission:** `users.view`

Features:
- Paginated table (10 per page) with search
- **Create user modal** - fields: Name, Email, Phone (country code + number), Address, Country, State, City, Pincode, Password, Role, Active status, Approval status
- **Edit user modal** - same fields, password optional
- **Delete** with confirmation dialog
- **Approve / Reject** pending users inline
- **Send password reset email** button
- Profile image upload (via `ProfileImageUpload` component)
- Phone formatted as country code + number split input

---

### `/admin/customers` - Customer List

**File:** `app/admin/customers/page.tsx`  
**Permission:** `customers.view`

Features:
- Paginated table with multi-filter toolbar
- Filters: Search, Country, Status (active/inactive/blocked), Booking status, Payment status, Date range, Sort order
- **Block customer** (opens modal for reason)
- **Unblock customer**
- **Reset password** (sends email)
- Links to customer detail page

`CustomerTable` columns: Customer name & code, Email, Total bookings, Completed / Cancelled / Upcoming, Amount paid / pending

---

### `/admin/customers/[id]` - Customer Detail

**File:** `app/admin/customers/[id]/page.tsx`  
**Permission:** `customers.view`

Sections:
- Profile card: avatar, name, email, phone, address, account/approval status
- Booking summary stats (total, completed, cancelled, upcoming)
- Payment summary stats (total paid, pending)
- Recent bookings table
- Recent payments table
- Communication history
- Action buttons: Block, Reset Password, Send Message (opens `SendCustomerMessageModal`)

---

### `/admin/bookings` - Booking List

**File:** `app/admin/bookings/page.tsx`  
**Permission:** `bookings.view`

Features:
- Paginated booking list
- Search and filter: Booking status, Payment status
- Inline actions: Confirm, Cancel
- Links to booking detail page

---

### `/admin/bookings/[id]` - Booking Detail

**File:** `app/admin/bookings/[id]/page.tsx`  
**Permission:** `bookings.view`

Sections:
- **Summary card** - Booking code, dates, customer, supplier, status badges
- **Customer info card** - contact details
- **Traveller table** - adults + children with passport/visa info
- **Tour/calendar details** - tour name, start date, pricing breakdown
- **Add-ons card** - optional activities, accommodations, extensions selected
- **Payment card** - base amount, discounts, taxes, final amount, paid/pending
- **Status timeline** - history of all status changes with timestamps and actor
- **Communication history** - booking messages thread with reply support

---

### `/admin/tours` - Tour List

**File:** `app/admin/tours/page.tsx`  
**Permission:** `tours.view`

Table columns: Tour code, Title, Country, City, Category, Price, Status

Actions:
- Edit → `/admin/tours/{id}/edit`
- Toggle status (published ↔ disabled) - requires `tours.disable`
- Create button → `/admin/tours/create` - requires `tours.create`

---

### `/admin/tours/create` & `/admin/tours/[id]/edit` - Tour Form

**Files:** `app/admin/tours/create/page.tsx`, `app/admin/tours/[id]/edit/page.tsx`  
**Component:** `TourFormPage` → `TourEditPage`  
**Permission:** `tours.create` / `tours.edit`

**11-tab editor:**

| Tab | What it manages |
|---|---|
| Overview | Title, subtitle, description, featured status, SEO fields |
| Pricing | Base price per person, currency, pricing slabs |
| Calendar | Tour date availability, departure dates |
| Gallery | Image uploads, alt text, ordering |
| Highlights | Key selling point bullets |
| Itinerary | Day-by-day breakdown with drag reorder |
| Items | Inclusions and exclusions lists |
| Accommodations | Accommodation extras |
| Extensions | Add-on experiences |
| Discounts | Promotional discount rules |
| Similar Tours | Related tour links |

Each tab has its own `TourXxxTab` component. Saves independently per tab via sub-resource API calls.

---

### `/admin/tours/categories` & `/admin/tours/subcategories` - CMS CRUD

**Files:** `app/admin/tours/categories/page.tsx`, `app/admin/tours/subcategories/page.tsx`  
**Component:** `CmsCrudPage`  
**Permissions:** `categories.view`, `subcategories.view`

Standard CRUD: list, search, create, edit, delete, status toggle.

---

### `/admin/suppliers` - Supplier List

**File:** `app/admin/suppliers/page.tsx`  
**Component:** `ReviewListPage`  
**Permission:** `suppliers.view`

Features:
- Paginated list with approval status filter
- Inline Approve / Partial Approve / Reject actions
- Status badges: email_verification_pending, profile_incomplete, admin_review_pending, approved, rejected
- Links to supplier detail

---

### `/admin/suppliers/[id]` - Supplier Detail

**File:** `app/admin/suppliers/[id]/page.tsx`  
**Component:** `ReviewDetailPage`  
**Permission:** `suppliers.view`

Shows full supplier profile:
- Business info, contact details, vehicle info
- Document uploads
- Approval/rejection action buttons with reason entry
- Partial approval with required item list
- Request reupload action
- Markup percentage setting

---

### `/admin/agents/[id]` & `/admin/affiliates/[id]` - Agent / Affiliate Detail

Same structure as Supplier Detail via shared `ReviewDetailPage` component.

- Agent detail adds: **Discount percentage** setting
- Affiliate detail adds: **API link** configuration

---

### `/admin/roles` - Role Management

**File:** `app/admin/roles/page.tsx`  
**Permission:** `roles.view`

Features:
- List all roles with pagination
- **Create role** (name, slug, active status)
- **Edit role** (name, active status only for system roles)
- **Delete role** (blocked if `is_system = true`)
- **Manage permissions modal** - checkbox grid grouped by module with "Select All" / "Deselect All" per module

---

### `/admin/permissions` - Permission Management

**File:** `app/admin/permissions/page.tsx`  
**Permission:** `permissions.view`

Features:
- List all permissions with module/action filtering
- Create / Edit / Delete permissions
- Shows `slug`, `module`, `action` fields

---

### `/admin/payments` - Payment List

**File:** `app/admin/payments/page.tsx`  
**Permission:** `payments.view`

- Paginated payment list
- Filter by status, method, date range
- Status badges: pending, authorized, captured, partially_captured, voided, refunded, failed
- Links to related booking

---

### `/admin/invoices` - Invoice List

**File:** `app/admin/invoices/page.tsx`  
**Permission:** `invoices.view`

- Invoice list with search and pagination
- Download option (PDF - backend stub, not yet generated)
- View invoice detail

---

### `/admin/reports` - Reports

**File:** `app/admin/reports/page.tsx`  
**Permission:** `reports.view`

- Pre-built report cards (bookings, payments, suppliers, agents, customers)
- Date range filters
- Country filter
- Export options

---

### `/admin/chatbot` - FAQ/Chatbot Admin

**File:** `app/admin/chatbot/page.tsx`  
**Permission:** Bearer (any logged-in user)

- Manage FAQ entries used by the AI chatbot
- Categories: general, booking, payment, destinations, policies, other
- Create / Edit / Delete FAQ
- Sort order management
- Active / Inactive toggle
- Search FAQs

---

### `/admin/notifications` - Notification Center

**File:** `app/admin/notifications/page.tsx`  
**Permission:** `notifications.view`

- List all notifications with read/unread filter
- Mark as read
- Manual retry (max 5 per notification)
- Push notification support via VAPID

---

### `/admin/sessions` - Session Management

**File:** `app/admin/sessions/page.tsx`  
**Permission:** `sessions.view`

- List active user sessions (device, IP, last activity)
- Force logout a specific session
- Logout all sessions for a user

---

### `/admin/activity-logs` - Audit Trail

**File:** `app/admin/activity-logs/page.tsx`  
**Permission:** `activity_logs.view`

- Paginated audit log
- Filter by action type, entity type, user, date range
- Columns: Action, Entity Type, Entity ID, Actor, IP, Timestamp
- Export logs

---

### `/admin/email-templates` - Email Templates

**File:** `app/admin/email-templates/page.tsx`  
**Permission:** `email_templates.view`

- List system and custom email templates
- Create / Edit templates (HTML editor)
- Variable insertion helper (e.g., `{{name}}`, `{{reset_url}}`)

---

### `/admin/profile` - User Profile

**File:** `app/admin/profile/page.tsx`  
**Permission:** `profile.view`

- Edit own profile: Name, Email, Phone (split input), Address, Country, State, City, Pincode
- Profile image upload with preview
- Change password form: Current password + New password + Confirm

---

### `/admin/settings` - Settings

**Files:** `app/admin/settings/page.tsx`, `settings/payment/page.tsx`, `settings/api/page.tsx`  
**Permission:** `settings.view`

- **General settings** - Platform-level config
- **Payment settings** - Gateway credentials, currency config
- **API settings** - API keys, webhook endpoints

---

### `/admin/settings/countries` & `/admin/settings/cities`

**Files:** `app/admin/settings/countries/page.tsx`, `app/admin/settings/cities/page.tsx`  
**Permissions:** `countries.view`, `cities.view`

Standard CRUD via `CmsCrudPage` component. Cities are filterable by country.

---

## 11. Component Library

### Layout Components (`components/layout/` & `components/admin/`)

| Component | File | Purpose |
|---|---|---|
| `DashboardLayout` | `layout/DashboardLayout.tsx` | Main admin shell - sidebar + header + content area |
| `Header` | `layout/Header.tsx` | Top bar - user menu, notification bell, logout |
| `Sidebar` | `layout/Sidebar.tsx` | Left nav - permission-filtered menu items |
| `AdminLayout` | `admin/AdminLayout.tsx` | Thin wrapper with `data-route-scope="admin"` |
| `AdminHeader` | `admin/AdminHeader.tsx` | Admin header variant |
| `AdminSidebar` | `admin/AdminSidebar.tsx` | Admin sidebar variant |
| `AdminFooter` | `admin/AdminFooter.tsx` | Admin footer |

### Auth Components (`components/auth/`)

| Component | Purpose |
|---|---|
| `ProtectedRoute` | Wraps a page - shows `AccessDenied` if `hasPermission(requiredPermission)` fails |
| `AuthLayout` | Centered card container for auth pages - logo, title, subtitle |
| `AuthInput` | Reusable `<input>` with icon prefix support |

### UI Primitives (`components/ui/`)

| Component | Purpose |
|---|---|
| `Button` | Styled button with variants (primary, secondary, danger, ghost) |
| `Card` | White rounded container with optional padding/shadow |
| `Input` | Styled `<input>` field with label and error state |
| `DataTable` | Reusable table - columns config, pagination, search, empty state |
| `Pagination` | Page navigation - prev/next + page number buttons |
| `Loader` | Centered spinner (full-page or inline) |
| `StatCard` | Metric card - icon, label, value, optional trend |
| `ConfirmDialog` | Modal confirmation prompt - title, message, confirm/cancel |
| `ProfileImageUpload` | Avatar upload with file picker and preview |
| `NotificationInbox` | Dropdown notification list |
| `PageCard` | Page-level wrapper with title bar and content area |
| `ToastProvider` | Global toast system - listens to `tourvaa:toast` custom events |

### Booking Components (`components/bookings/`)

| Component | Purpose |
|---|---|
| `BookingTable` | Paginated booking list with status badges |
| `BookingFilters` | Search + status filter bar |
| `BookingStatusBadge` | Colored badge for booking/payment/supplier status |
| `BookingStatusTimeline` | Vertical timeline of status change history |
| `BookingSummaryCard` | Header card with booking overview |
| `BookingPaymentCard` | Payment breakdown - base, discounts, taxes, totals |
| `BookingAddonsCard` | Optional activities, accommodations, extensions |
| `BookingTravellerTable` | Passenger list with passport details |
| `BookingActionMenu` | Contextual action dropdown (confirm, cancel, assign supplier) |

### Customer Components (`components/customers/`)

| Component | Purpose |
|---|---|
| `CustomerTable` | Paginated list with booking/payment summary columns |
| `CustomerFilters` | Multi-filter toolbar (country, status, dates, sort) |
| `CustomerProfileCard` | Profile avatar + details card |
| `CustomerActionButtons` | Block, unblock, reset password buttons |
| `CustomerBookingHistory` | Embedded booking table for customer detail |
| `CustomerPaymentHistory` | Embedded payment table for customer detail |
| `CustomerCommunicationHistory` | Message thread list |
| `CustomerHistoryTables` | Tab wrapper for booking + payment + comms history |
| `SendCustomerMessageModal` | Compose and send message to customer |

### Tour Components (`components/tours/`)

| Component | Purpose |
|---|---|
| `TourEditPage` | Outer wrapper - tab navigation + save logic |
| `TourOverviewTab` | Basic tour info (title, description, SEO) |
| `TourPricingTab` | Pricing slabs per passenger count |
| `TourCalendarTab` | Availability calendar and departure dates |
| `TourGalleryTab` | Image grid with upload, alt text, ordering |
| `TourHighlightsTab` | Bullet point highlights list |
| `TourItineraryTab` | Day-by-day itinerary with drag reorder |
| `TourItemsTab` | Inclusions and exclusions list |
| `TourExtensionsTab` | Add-on extensions |
| `TourDiscountsTab` | Discount rules (percentage / fixed / date range) |
| `TourSimilarTab` | Similar tour link management |

### Operations Components (`components/operations/`)

| Component | Purpose |
|---|---|
| `ReviewListPage` | Generic paginated list for suppliers/agents/affiliates with approval actions |
| `ReviewDetailPage` | Generic detail page with approval/rejection workflow |
| `ActionModal` | Reusable modal for approve/reject/partial-approve with reason input |
| `AdminAssetUpload` | File/image upload for documents (supplier/agent verification) |
| `StatusBadge` | Colored badge for approval status |

### CMS Components (`components/cms/`)

| Component | Purpose |
|---|---|
| `CmsCrudPage` | Generic CRUD page - configurable for categories, subcategories, countries, cities |
| `TourFormPage` | Wrapper that initializes the tour form with data and passes to `TourEditPage` |

### Common Components (`components/common/`)

| Component | Purpose |
|---|---|
| `ModuleWrapper` | Checks page permission; renders `AccessDenied` if denied |
| `DynamicModulePage` | Generic module page for simple list/detail scenarios |
| `AccessDenied` | "You don't have permission" page with back button |
| `LoadingState` | Skeleton / spinner for async content |
| `ErrorState` | Error message display with retry button |
| `EmptyState` | "No records found" display with optional CTA |

### Public Components (`components/public/`)

| Component | Purpose |
|---|---|
| `PublicLayout` | Landing page shell (header + main + footer) |
| `PublicHeader` | Navigation bar for public pages |

---

## 12. Hooks Reference

### `useAuth()` - `hooks/useAuth.ts`

Primary hook for auth actions in components.

```typescript
const { login, logout, loading, error, user, dashboard, isLoggedIn, sessionLoading, refreshSession } = useAuth();

login({ email, password })   // POST /auth/login → loginWithToken → redirect
logout()                     // clears session → /login
```

### `useAuthContext()` - from `AuthProvider`

Low-level context hook for reading auth state:

```typescript
const { hasPermission, user, dashboard, token, isLoggedIn } = useAuthContext();
hasPermission("bookings.view")  // checks with alias expansion
```

### `useApi<T>()` - `hooks/useApi.ts`

Generic hook for API calls with loading/error state:

```typescript
const { data, loading, error, request } = useApi<MyType>();
await request("get", "/customers", { page: 1 });
await request("post", "/customers", payload);
```

### `useUsers()` - `hooks/useUsers.ts`

User list + CRUD with pagination state built in.

### `useRoles()` - `hooks/useRoles.ts`

Role list + permission assignment operations.

### `useDashboard()` - `hooks/useDashboard.ts`

Fetches dashboard-specific data (summary, charts, activities) with caching.

### `useAdminModules()` - `hooks/useAdminModules.ts`

Loads available admin modules for the sidebar.

### `usePagination()` - `hooks/usePagination.ts`

```typescript
const { page, setPage, limit, setLimit, resetPage } = usePagination();
```

### `useDebounce()` - `hooks/useDebounce.ts`

```typescript
const debouncedSearch = useDebounce(searchValue, 400);
```

Used on all search inputs to avoid firing an API call on every keystroke.

### `useToast()` - `hooks/useToast.ts`

```typescript
const toast = useToast();
toast.success("Customer updated");
toast.error("Something went wrong");
toast.warning("Please verify your email");
```

Dispatches `tourvaa:toast` custom events that `ToastProvider` listens to.

### `useConfirm()` - `hooks/useConfirm.tsx`

```typescript
const { confirm, ConfirmDialog } = useConfirm();
const confirmed = await confirm("Are you sure you want to delete this?");
// renders <ConfirmDialog /> in JSX
```

### `usePushNotifications()` - `hooks/usePushNotifications.ts`

Handles VAPID web push subscription. Calls `POST /api/notifications/push/subscribe`.

---

## 13. Service Layer

All services are thin wrappers around the `api` Axios instance. Located in `lib/services/`.

### `dashboardService.ts`

```typescript
getDashboardMe()                          // GET /dashboard/me
getDashboardSummary(filters?)             // GET /dashboard/summary
getDashboardCharts(filters?)              // GET /dashboard/charts
getDashboardRecentActivities(filters?)    // GET /dashboard/recent-activities
getDashboardAlerts(filters?)              // GET /dashboard/alerts
```

> **Note:** The dashboard page (`app/admin/dashboard/page.tsx`) calls analytics endpoints directly via `api.get()` rather than using this service - it calls `/dashboard/bookings`, `/dashboard/payments`, `/dashboard/reports`, and `/dashboard/recent-activities` in a single `Promise.all`. The service functions exist for reuse elsewhere.

### `customerService.ts`

```typescript
getCustomers(filters)                     // GET /customers
getCustomerDetail(id)                     // GET /customers/{id}
blockCustomer(id, reason)                 // POST /customers/{id}/block
unblockCustomer(id)                       // POST /customers/{id}/unblock
resetCustomerPassword(id)                 // POST /customers/{id}/reset-password
```

Type: `Customer` - id, first_name, last_name, full_name, email, phone, status, total_bookings, amount_paid, amount_pending

### `bookingService.ts`

```typescript
getBookings(filters)                      // GET /bookings
getBookingDetail(id)                      // GET /bookings/{id}
updateBookingStatus(id, status, reason)   // PATCH /bookings/{id}/status
cancelBooking(id, reason)                 // PATCH /bookings/{id}/cancel
```

Type: `Booking` - includes travellers[], optional_activities[], accommodations[], extensions[], status_history[], communications[]

### `cmsService.ts`

Generic CMS service for tours, categories, subcategories, countries, cities:

```typescript
listCms(module, filters)                  // GET /{module}
getCmsDetail(module, id)                  // GET /{module}/{id}
createCms(module, data)                   // POST /{module}
updateCms(module, id, data)               // PUT /{module}/{id}
deleteCms(module, id)                     // DELETE /{module}/{id}
updateCmsStatus(module, id, status)       // PATCH /{module}/{id}/status
```

### `tourDetailService.ts`

Manages all 11 tour sub-resources:

```typescript
getTourDetail(id)                         // GET /tours/{id}
getOverview(tourId)                       // GET /tours/{id}/overview
saveOverview(tourId, data)                // POST/PUT /tours/{id}/overview
listItineraries(tourId)                   // GET /tours/{id}/itineraries
createItinerary(tourId, data)             // POST /tours/{id}/itineraries
// ... same pattern for all 11 sub-resources
calculatePrice(tourId, request)           // POST /tours/{id}/calculate-price
```

### `paymentService.ts`

```typescript
getPayments(filters)                      // GET /payments
getPaymentDetail(id)                      // GET /payments/{id}
```

### `invoiceService.ts`

```typescript
getInvoices(filters)                      // GET /invoices
getInvoiceDetail(id)                      // GET /invoices/{id}
downloadInvoice(id)                       // GET /invoices/{id}/download
emailInvoice(id, email)                   // POST /invoices/{id}/email
```

### `activityLogService.ts`

```typescript
getActivityLogs(filters)                  // GET /audit-logs
exportActivityLogs(filters)               // GET /audit-logs/export
```

### `notificationService.ts`

```typescript
getNotifications(filters)                 // GET /notifications
markAsRead(id)                            // PATCH /notifications/{id}/read
retryNotification(id)                     // POST /notifications/{id}/retry
```

### `sessionService.ts`

```typescript
getSessions()                             // GET /sessions
logoutSession(id)                         // DELETE /sessions/{id}
logoutAllSessions()                       // POST /sessions/logout-all
```

### `operationsService.ts`

Generic for suppliers, agents, affiliates:

```typescript
listOperations(module, filters)           // GET /{module}
getOperationDetail(module, id)            // GET /{module}/{id}
approveOperation(module, id)              // POST /{module}/{id}/approve
rejectOperation(module, id, reason)       // POST /{module}/{id}/reject
partialApproveOperation(module, id, data) // POST /{module}/{id}/partial-approve
```

### `reportService.ts`

```typescript
getReports(filters)                       // GET /reports/summary
getBookingReport()                        // GET /reports/bookings
getPaymentReport()                        // GET /reports/payments
getSupplierReport()                       // GET /reports/suppliers
getAgentReport()                          // GET /reports/agents
getCustomerReport()                       // GET /reports/customers
exportReport(format)                      // GET /reports/exports
```

---

## 14. Types & Interfaces

### `types/auth.ts`

```typescript
type Permission = {
  name: string
  slug: string
  module: string
  action?: "get" | "post" | "put" | "delete"
}

type MenuItem = {
  label: string
  permission: string
  module: string
}

type AuthUser = {
  id: number
  name: string
  email: string
  user_type?: string
  profile_image?: string
  profile_status?: string | null
  approval_status?: string | null
  role: { id: number; name: string; slug: string }
  permissions: Permission[]
}

type DashboardStats = {
  users: number
  active_users: number
  roles: number
  permissions: number
  pending_users: number
}

type PendingApproval = {
  id: number
  name: string
  email: string
  role_id: number | null
  role_name?: string | null
  created_at: string
}
```

### `types/user.ts`

```typescript
type Role = {
  id: number
  name: string
  slug: string
  is_active: boolean
  is_system?: boolean
}

type User = {
  id: number
  name: string
  email: string
  phone: string
  profile_image: string
  address: string
  country: string
  state: string
  city: string
  pincode: string
  role_id: number | null
  is_active: boolean
  approval_status: "pending" | "approved" | "rejected"
  created_at: string
  role?: Role | null
}

type UserFormData = {
  name: string
  email: string
  phone: string
  profile_image: string
  address: string
  country: string
  state: string
  city: string
  pincode: string
  password?: string
  role_id: number | ""
  is_active?: boolean
  approval_status?: "pending" | "approved" | "rejected"
}
```

---

## 15. Utilities

### `lib/validators.ts`

```typescript
emailPattern      // /^\S+@\S+\.\S+$/
slugPattern       // /^[a-z0-9-]+$/
mobilePattern     // /^\+[1-9]\d{7,19}$/

validateEmail(value)          // boolean
validateSlug(value)           // boolean
validatePassword(value)       // ≥8 chars, uppercase, lowercase, digit
validateMobile(value, required?) // boolean
normalizeEmail(value)         // trim + lowercase

digitsOnly(value)             // strips non-digits
combinePhone(countryCode, number)  // "+91" + "9876543210" → "+919876543210"
splitPhone(value, countryCodes)    // "+919876543210" → { countryCode: "+91", number: "9876543210" }

passwordHelp   // "Use at least 8 characters with uppercase, lowercase, and a number."
mobileHelp     // "Select country code and enter numbers only..."
```

### `lib/error-handler.ts`

```typescript
getApiErrorMessage(error: unknown): string
// extracts error.response.data.detail (FastAPI)
// or error.message
// or "An unexpected error occurred"
```

### `lib/media-url.ts`

Converts relative storage paths (e.g., `storage/images/photo.jpg`) to full URLs using the backend origin.

### `lib/location-options.ts`

- `phoneCountryCodes` - array of `{ label: "India (+91)", value: "+91" }` objects for dropdowns
- `getStates(country)` - states list for a given country name
- `getCities(country, state)` - city list

### `lib/navigation.ts`

Navigation helper functions used by `Sidebar` to determine the active route.

---

## 16. Role-Based Dashboard Variations

| Role | Stat Cards | Approval Widgets | Sidebar Scope |
|---|---|---|---|
| `super-admin` | Bookings, Customers, Pending Payments, Revenue, Suppliers, Agents | Users + Suppliers + Agents pending | Full access |
| `admin` | Same as super-admin | Same as super-admin | Full access |
| `sub-admin` | Permission-based subset | Suppliers, Agents, Affiliates pending | Filtered by permissions |
| `supplier` | Active Tours, Bookings, Pending Payout | None | Own tours/bookings |
| `agent-reseller` | My Customers, Bookings, Commission | None | Own customers/bookings |
| `customer` | Upcoming Trips, Saved Tours, Open Requests | None | Self-service only |

The dashboard page reads `dashboard_type` from `GET /api/dashboard/me` to decide which layout to render.

---

## 17. Running the App

### Prerequisites

- Node.js 18+
- Backend running at `http://127.0.0.1:8000`

### Development

```bash
cd tourvaa-admin-frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000
```

No `.env.local` is required for development - `API_PROXY_TARGET` defaults to `http://127.0.0.1:8000` in `next.config.ts`.

If backend is on a different port, create `.env.local`:
```env
API_PROXY_TARGET=http://127.0.0.1:8000
```

### Production Build

```bash
npm run build
npm start
```

`API_PROXY_TARGET` **must** be set in production or the build will throw:
```
Error: API_PROXY_TARGET is required in production because /api/:path* proxies to the backend.
```

### Linting

```bash
npm run lint
```

### Tests

```bash
npm run test
# → runs tests/run-tests.mjs
```

---

## 18. Page-Permission Map

Every protected admin route and its minimum required permission:

| Route | Required Permission |
|---|---|
| `/admin/dashboard` | `dashboard.view` |
| `/admin/users` | `users.view` |
| `/admin/roles` | `roles.view` |
| `/admin/permissions` | `permissions.view` |
| `/admin/customers` | `customers.view` |
| `/admin/customers/[id]` | `customers.view` |
| `/admin/suppliers` | `suppliers.view` |
| `/admin/suppliers/[id]` | `suppliers.view` |
| `/admin/agents` | `agents.view` |
| `/admin/agents/[id]` | `agents.view` |
| `/admin/affiliates` | `affiliates.view` |
| `/admin/affiliates/[id]` | `affiliates.view` |
| `/admin/tours` | `tours.view` |
| `/admin/tours/create` | `tours.create` |
| `/admin/tours/[id]/edit` | `tours.edit` |
| `/admin/tours/categories` | `categories.view` |
| `/admin/tours/subcategories` | `subcategories.view` |
| `/admin/bookings` | `bookings.view` |
| `/admin/bookings/[id]` | `bookings.view` |
| `/admin/payments` | `payments.view` |
| `/admin/invoices` | `invoices.view` |
| `/admin/reports` | `reports.view` |
| `/admin/activity-logs` | `activity_logs.view` |
| `/admin/notifications` | `notifications.view` |
| `/admin/sessions` | `sessions.view` |
| `/admin/email-templates` | `email_templates.view` |
| `/admin/profile` | `profile.view` |
| `/admin/settings` | `settings.view` |
| `/admin/settings/payment` | `settings.view` |
| `/admin/settings/api` | `settings.view` |
| `/admin/settings/countries` | `countries.view` |
| `/admin/settings/cities` | `cities.view` |

**Public routes** (no auth required): `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`

---

*Documentation generated 2026-06-22 from source at `d:\ayati\tourvaa\tourvaa-admin-frontend`.*
