# Project Name: Tourvaa Frontend

**Tourvaa** is a travel-booking platform. This repository contains its Next.js public site and role-based portals.

## Project Core

- Public tour discovery, destination search, availability, booking, checkout, and booking receipt access.
- Customer portal for bookings, travellers, payments, invoices, cancellation requests, and support.
- Supplier portal for tours, availability, booking decisions, operations, earnings, and payouts.
- Agent portal for customer bookings, supplier decisions, commissions, invoices, and messages.
- Affiliate portal for referral links, clicks, conversions, commissions, and payout requests.
- Admin portal for platform operations, users, tours, bookings, payments, CMS, notifications, reports, and settings.

## How to Run

### 1. Install dependencies

```powershell
npm install
```

### 2. Configure the environment

Create `.env` in this repository:

```env
API_PROXY_TARGET=http://127.0.0.1:8000
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Start the backend first, then update `API_PROXY_TARGET` only if it runs on a different host or port.

### 3. Start the frontend

```powershell
npm run dev
```

Open `http://localhost:3000`.

## Build and test

```powershell
npm run build
npm test
```

For a TypeScript-only check:

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
```

Use the local backend and test accounts for portal-flow testing. Do not perform real payments or email real users during development.

## Licence

Copyright © 2026 Tourvaa. Developed by Ayatiworks — Rubankumar Sankar.

All rights reserved. This software is proprietary and may not be copied, modified, distributed, or used without prior written permission from Tourvaa.
