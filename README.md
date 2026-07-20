# Tourvaa Platform Frontend

Single Next.js 16 (App Router) application serving both the public marketing/booking site and every role-based admin/self-service portal for the Tourvaa travel platform.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4 (`@theme` design tokens) |
| Fonts | `next/font/google` - Outfit (headings) + Work Sans (body), scoped to public pages |
| Icons | Lucide React |
| HTTP Client | Axios |
| Forms | React Hook Form |
| State | React Context + custom hooks |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

```env
API_PROXY_TARGET=http://127.0.0.1:8000
```

For production, point at the live backend:

```env
API_PROXY_TARGET=http://your-backend-host:8000
```

### 3. Start the development server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

---

## Build

```bash
npm run build
npm run start
```

---

## Authentication

- JWT stored in memory (not localStorage) with an Axios interceptor (`src/lib/api/client.ts`)
- Silent token refresh on 401 - queues concurrent requests until refresh completes
- Forced logout clears all sessions server-side
- Authenticated file downloads (e.g. invoice PDFs) use a blob-fetch through the authenticated client rather than a plain `<a href>`, since Bearer tokens can't ride on raw browser navigation

Login with the default super admin:

```text
Email:    admin@tourvaa.com
Password: Admin@123
```

---

## Roles & Portals

The app is fully role and permission aware. Each user is routed to their own portal and sees only what their role allows.

| Portal | Route Group | Access |
| --- | --- | --- |
| Public site | `(public)` | Anyone - homepage, tours, destinations, blogs, about/contact/legal, agent/supplier landing + registration |
| Admin | `admin/` | Super Admin, Admin, Sub-Admin (permission-scoped) |
| Customer | `customer/` | Customers - own bookings, invoices, payments, travellers, support |
| Supplier | `supplier/` | Suppliers - own tours, bookings, earnings, payouts |
| Agent | `agent/` | Agents/Resellers - own bookings, customers, commission, invoices |
| Affiliate | `affiliate/` | Affiliates - referral links, clicks, conversions, commissions, payouts |

Protected routes use `<ProtectedRoute requiredPermission="...">`. Each portal's sidebar is built dynamically from the logged-in user's permissions.

---

## Project Structure

Industry-standard `src/`-based layout - routing, UI, and application logic are cleanly separated:

```text
src/
├── app/                        Next.js App Router - routing only
│   ├── (public)/               Public marketing + booking site (own layout, fonts, palette)
│   ├── admin/                  Admin/Sub-Admin portal
│   ├── customer/                Customer self-service portal
│   ├── supplier/                Supplier self-service portal
│   ├── agent/                   Agent/reseller self-service portal
│   ├── affiliate/               Affiliate self-service portal
│   ├── login/, forgot-password/, reset-password/, join/, location/
│   └── globals.css              Tailwind v4 @theme tokens (dash-*, pub-*), fonts, base styles
├── components/
│   ├── public/                  Homepage hero, filter bar, destination cards, footer, etc.
│   ├── admin/, customers/, supplier/, agent/, bookings/, tours/, cms/, operations/
│   ├── layout/                  Sidebar, header, portal shells
│   ├── auth/                    ProtectedRoute
│   └── ui/                      Shared primitives (inputs, buttons, PhoneInput, etc.)
├── lib/
│   ├── api/
│   │   ├── client.ts             Axios instance + JWT interceptors, public path allowlist
│   │   ├── publicClient.ts       Unauthenticated client for public-site calls
│   │   ├── session.ts            Token storage/retrieval
│   │   └── services/             One file per resource (bookingService, invoiceService, etc.)
│   ├── constants/                Shared enums/config values
│   └── utils/                    errorHandler, formatting, misc helpers
├── hooks/                      Data-fetching and UI hooks (useDashboard, useUsers, etc.)
├── providers/                  AuthProvider - user, permissions, menus
├── config/                     App-level configuration
└── types/                      Shared TypeScript types (auth.ts, etc.)
```

---

## Key Services (`src/lib/api/services/`)

| Service | Covers |
| --- | --- |
| `dashboardService.ts` | `getDashboardMe/Summary/Charts/RecentActivities/Alerts` - all hit `/api/dashboard/*` |
| `bookingService.ts` | Booking CRUD, calculate-price, calendar, status history |
| `paymentService.ts` | Payment authorize/capture/refund/status |
| `invoiceService.ts` | Invoice list/detail, `downloadInvoicePdf()` (authenticated blob download), `regenerateInvoicePdf()` |
| `customerService.ts` | Customer CRUD, communications |
| `cmsService.ts` | Tours, categories, countries/cities, pricing, calendar |
| `discountService.ts` | Tour discount rules |
| `activityLogService.ts`, `reportService.ts` | Audit/activity feed, reporting |
| `sessionService.ts` | Active session listing, revoke, force-logout |
| `notificationService.ts` | Notification list, mark-all-read |
| `operationsService.ts` | Misc admin operations |
| `tourDetailService.ts` | Public tour detail page data |

---

## Public Site Highlights

- Sky-blue / orange design system, distinct from the dashboard palette, scoped entirely to the `(public)` route group via CSS variables - no bleed into admin/portal styling.
- Homepage hero includes a 4-field filter bar (`components/public/HeroFilterBar.tsx`): destination (flag-icon country list, wired to `/tours?country=`), flexible/specific date range picker, duration presets + custom slider (wired to `/tours?min_days=&max_days=`), and traveller count.
- `/tours` reads all filters from URL search params on load (shareable/bookmarkable filtered URLs).

---

## Tests

```bash
# Lint check
npm run lint

# Filesystem / integration tests
node tests/dashboard.test.mjs
```

The test file (`tests/dashboard.test.mjs`) verifies:

- `dashboardService.ts` exists and exports all five dashboard functions
- `AuthProvider` includes `dashboard_type`, `allowed_modules`, `sidebar_menu`
- `AuthUser` type has `user_type` and `approval_status`
- No `/api/v1` references anywhere in dashboard files

No automated browser/E2E suite exists yet - UI/flow verification is currently manual (API-contract + reachability checks). Consider adding Playwright for real browser-level coverage.

---

## Known Gaps

- **Affiliate self-service portal** (`app/affiliate/*`) has UI pages but no working self-registration or scoped permissions on the backend yet - treat as non-functional until the backend affiliate-auth work lands.
- `/admin/reports` is a UI stub with no real data wired up.
