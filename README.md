# Tourvaa Admin Dashboard

Next.js admin dashboard for the Tourvaa travel platform. Provides role-based access to user management, tour CMS, customer/supplier/agent/affiliate operations, settings, and analytics.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | Tailwind CSS 4 |
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

### 2. Create `frontend/.env`

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

- JWT stored in memory (not localStorage) with an Axios interceptor
- Silent token refresh on 401 — queues concurrent requests until refresh completes
- Forced logout clears all sessions server-side

Login with the default super admin:

```text
Email:    admin@tourvaa.com
Password: Admin@123
```

---

## Roles & Access Control

The dashboard is fully role and permission aware. Each user sees only what their role allows.

| Role | Dashboard |
| --- | --- |
| Super Admin | Full platform overview |
| Admin | Permission-based module access |
| Sub Admin | Only permitted modules |
| Supplier | Own tours, bookings, revenue |
| Agent / Reseller | Own bookings, clients, commission |
| Customer | Own bookings, spend |
| Affiliate | Own referrals, commissions |

Protected routes use `<ProtectedRoute requiredPermission="...">`. The sidebar is built dynamically from the logged-in user's permissions.

---

## Pages

| Route | Description |
| --- | --- |
| `/login` | Login |
| `/register` | Registration |
| `/forgot-password` | Forgot password |
| `/reset-password` | Reset password with token |
| `/dashboard` | Role-based analytics dashboard |
| `/users` | User management |
| `/roles` | Role management |
| `/permissions` | Permission management |
| `/customers` | Customer list |
| `/customers/[id]` | Customer detail, booking/payment history |
| `/suppliers` | Supplier list and approval |
| `/agents` | Agent list and approval |
| `/affiliates` | Affiliate list and approval |
| `/tours` | Tour list |
| `/tours/create` | Create / edit tour |
| `/tours/categories` | Tour categories |
| `/tours/subcategories` | Tour subcategories |
| `/settings` | General settings |
| `/settings/api` | API integration settings |
| `/settings/payment` | Payment provider settings |
| `/settings/countries` | Country management |
| `/settings/cities` | City management |
| `/email-templates` | Email templates |
| `/profile` | User profile and avatar upload |
| `/reports` | Reports (stub — no real data yet) |

---

## Key Files

```text
frontend/
├── app/                         Next.js App Router pages
├── components/
│   ├── auth/ProtectedRoute.tsx  Permission-gated route wrapper
│   ├── dashboard/               Dashboard cards, charts, alerts
│   └── layout/                  Sidebar, header, layout shell
├── hooks/
│   └── useDashboard.ts          Dashboard data hook
├── lib/
│   ├── api.ts                   Axios instance + JWT interceptors
│   └── services/
│       └── dashboardService.ts  Dashboard API calls
├── providers/
│   └── AuthProvider.tsx         Auth context — user, permissions, menus
└── types/
    └── auth.ts                  AuthUser, Permission, MenuItem types
```

---

## Dashboard Service

`lib/services/dashboardService.ts` exposes five functions:

```typescript
getDashboardMe()                       // user profile, sidebar, allowed_modules
getDashboardSummary(filters?)          // stats cards
getDashboardCharts(filters?)           // chart data
getDashboardRecentActivities(filters?) // activity log
getDashboardAlerts(filters?)           // alerts
```

All calls hit `/api/dashboard/*` (not `/api/v1/*`).

---

## Tests

```bash
# Lint check
npm run lint

# Filesystem / integration tests
node tests/dashboard.test.mjs
```

The test file (`tests/dashboard.test.mjs`) verifies:

- `dashboardService.ts` exists and exports all five functions
- `AuthProvider` includes `dashboard_type`, `allowed_modules`, `sidebar_menu`
- `AuthUser` type has `user_type` and `approval_status`
- No `/api/v1` references anywhere in dashboard files
