# Tourvaa Admin Frontend

Tourvaa Admin Frontend is a Next.js web dashboard for managing the Tourvaa travel platform. It includes login, registration, role-based dashboard views, users, roles, permissions, profile, settings, and email template screens.

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Axios

## How To Run

1. Install dependencies:

```bash
npm install
```

2. Create `.env` in the `frontend` folder:

```env
API_PROXY_TARGET=http://127.0.0.1:8000
```

For Vercel production, point the server-side proxy at the live backend:

```env
API_PROXY_TARGET=http://89.167.92.220:8011
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

```txt
http://localhost:3000
```

## Build

```bash
npm run build
npm run start
```

## Test / Check

```bash
npm run lint
npm run build
```
