# Rechly Web — Full Project Documentation

## 1) Project Overview

Rechly Web is a bilingual (German-first) invoicing web app built with **Next.js App Router** and **React**.
It targets freelancers and small businesses in Germany and focuses on:

- Creating compliant invoices
- Managing clients and products
- Exporting invoices to PDF
- Cloud-backed data synchronization via Appwrite
- Low-friction onboarding (email, Google OAuth, guest mode)

Primary stack:

- **Frontend**: Next.js 16, React 19, TypeScript, Ant Design 6, Tailwind CSS v4
- **State**: Zustand
- **Backend/Data/Auth**: Appwrite (client SDK + server SDK)
- **PDF rendering**: `@react-pdf/renderer`

## 2) Repository Structure (High-Level)

Top-level core files:

- `package.json` — scripts and dependencies
- `next.config.ts` — standalone output, Turbopack aliasing, package import optimizations
- `tsconfig.json` — strict TypeScript config + `@/*` alias
- `eslint.config.mjs` — Next + TS lint configuration

Main source layout (`src`):

- `app/` — Next.js App Router pages/layouts/API routes
- `components/landing/` — landing page UI sections
- `contexts/` — auth and language providers
- `lib/` — Appwrite clients, domain services, currency/date utilities
- `store/` — Zustand stores for clients/products/invoices
- `types/` — shared domain interfaces

## 3) Runtime & Build Characteristics

From config and scripts:

- Dev server: `npm run dev`
- Production build: `npm run build`
- Start: `npm run start`
- Lint: `npm run lint`
- Next config uses `output: "standalone"` for containerized/cloud deployments.
- Turbopack resolves `canvas` to `./empty-module.js` (to avoid browser/runtime issues with PDF-related dependencies).

## 4) Environment Variables

Used variables discovered in code:

### Public/browser-consumed

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`

### Server-only

- `APPWRITE_API_KEY`
- `APPWRITE_API_ENDPOINT` (used in cleanup route)
- `APPWRITE_PROJECT_ID` (used in cleanup route)
- `CLEANUP_API_SECRET`
- `NODE_ENV` (cookie security behavior)

### Important note

There are two endpoint/project variable pairs in use:

- `NEXT_PUBLIC_APPWRITE_ENDPOINT` / `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_ENDPOINT` / `APPWRITE_PROJECT_ID` (cleanup route)

These should be consistent in deployment to avoid accidental cross-project behavior.

## 5) Application Shell & Routing

### Root layout

`src/app/layout.tsx`:

- Registers Ant Design SSR support (`AntdRegistry`)
- Wraps app in `LanguageProvider` and `AuthProvider`
- Injects Google Analytics script
- Declares extensive SEO metadata (German-first)

### Root page behavior

`src/app/page.tsx`:

- If authenticated user is detected, redirects to `/dashboard`
- Otherwise renders landing page sections
- Injects JSON-LD structured data (`SoftwareApplication`, `Organization`, `FAQPage`, etc.)

## 6) Route Catalog

## 6.1 Public/Marketing Pages

- `/` — landing page
- `/features` — product features page
- `/login` — login page
- `/register` — registration page
- `/auth/callback` — client-side OAuth callback coordinator
- `/onboarding` — initial company profile setup
- `/impressum`, `/datenschutz`, `/agb`, `/cookies` — legal pages

## 6.2 Dashboard Pages

- `/dashboard` — overview and key stats
- `/dashboard/clients` — client CRUD UI
- `/dashboard/products` — product CRUD UI
- `/dashboard/invoices` — invoice list + filtering/actions
- `/dashboard/invoices/create` — invoice creation wizard
- `/dashboard/invoices/[id]` — invoice detail view
- `/dashboard/invoices/[id]/pdf` — interactive PDF preview/download/print flow
- `/dashboard/settings` — company profile + account controls

## 6.3 Metadata/SEO Routes

- `/robots.txt` via `src/app/robots.ts`
- `/sitemap.xml` via `src/app/sitemap.ts`

## 6.4 API Routes

Auth:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/user`
- `POST /api/auth/logout`
- `GET /api/auth/google`
- `GET /api/auth/callback`

Domain:

- `GET/POST /api/company`
- `GET/POST /api/clients` + `GET/PUT/DELETE /api/clients/[id]`
- `GET/POST /api/products` + `GET/PUT/DELETE /api/products/[id]`
- `GET/POST /api/invoices`
- `GET/PUT/DELETE /api/invoices/[id]`
- `GET /api/invoices/stats`

Maintenance:

- `POST /api/cleanup-guests` (secret-protected)
- `GET /api/cleanup-guests` (health-style info)

## 7) Authentication & Session Model

Implemented via `AuthContext` + Appwrite + SSR cookies.

### Modes supported

- Email/password login
- Email/password registration
- Google OAuth login
- Anonymous guest login

### Session approach

- SSR session token stored in HTTP-only cookie (`appwrite-session`)
- `GET /api/auth/user` is the canonical session check used by client-side auth state
- Auth provider manages `user`, `loading`, and `isAnonymous`

### Guest behavior

- Guest sessions are tracked in `sessionStorage`
- Tab close/visibility logic marks guest sessions for cleanup behavior
- Separate cleanup endpoint deletes old anonymous users + related data after timeout

### OAuth flow

1. Client navigates to `/api/auth/google`
2. Server determines origin and gets OAuth redirect URL via Appwrite
3. Provider redirects to `/api/auth/callback`
4. Callback exchanges userId/secret for session and sets cookie
5. Redirects to `/auth/callback` client page
6. Client checks session + company profile and redirects to `/dashboard` or `/onboarding`

## 8) Data Model (Domain Types)

Defined in `src/types/index.ts`.

Core entities:

- `UserCompany`
    - Legal/business identity, contact, tax data, bank data, invoice defaults, optional logo
- `Client`
    - Company/customer address and contact fields (+ optional tax references)
- `Product`
    - Name, description, unit price, tax rate, unit of measure
- `Invoice`
    - Client linkage, invoice number/dates, totals, status, notes
- `InvoiceItem`
    - Line-level billing details and computed amounts

Invoice statuses:

- `draft`
- `sent`
- `paid`
- `cancelled`

Extended composition types:

- `InvoiceWithClient`
- `InvoiceWithDetails` (includes client + items)

## 9) Persistence & Data Access Pattern

### Appwrite clients

- Browser SDK in `src/lib/appwrite.ts`
- Server SDK in `src/lib/appwrite-server.ts`

### Collection IDs (shared across client/server)

- `user_company`
- `clients`
- `products`
- `invoices`
- `invoice_items`

### Access model

- Most API handlers first verify session via `createSessionClient`
- Data operations are executed using `createAdminClient` and constrained by `userId`
- New docs are created with explicit user-scoped permissions (`read/update/delete` for that user)

## 10) State Management (Zustand)

Stores:

- `useClientStore`
- `useProductStore`
- `useInvoiceStore`

Common behavior:

- In-memory caching with 5-minute TTL
- `loading`, `error`, `lastFetched` state
- API route-backed CRUD actions
- cache invalidation after mutating writes

Invoice store adds:

- `stats` caching
- status update and delete handling
- `getInvoice` detail fetch

## 11) Service Layer

Service wrappers in `src/lib/*Service.ts` centralize fetch logic for UI usage:

- `clientService.ts`
- `productService.ts`
- `invoiceService.ts`
- `companyService.ts`

These are thin API consumers (no direct Appwrite calls), which keeps browser code decoupled from backend SDK details.

## 12) Invoice Calculation & Date Utilities

### Currency/Math (`src/lib/currencyUtils.ts`)

- Locale-sensitive formatting (DE/EN)
- VAT calculations
- line-item total calculations (subtotal/discount/tax/total)
- invoice-level totals with VAT breakdown
- rounding helpers

### Dates (`src/lib/dateUtils.ts`)

- German display formatting via Day.js
- ISO date formatting for storage
- due-date calculation helpers

## 13) Dashboard Functional Areas

### Dashboard home

- Aggregates invoices, clients, products, company info
- Displays key metrics and recent activity

### Clients

- Search, table, modal create/edit, delete confirmation

### Products

- Search, table, modal create/edit, price + tax + unit controls

### Invoices list

- Search + status filtering
- Actions: view/edit/PDF/status changes/delete
- summary stats cards

### Invoice create wizard

- Step 1: choose client
- Step 2: add line items (from product or custom)
- Step 3: invoice metadata + submit
- Step 4: success actions

### Invoice detail

- Read-only display of recipient, items, totals, notes
- Status transitions
- PDF/open print/email actions

### PDF page

- Uses `@react-pdf/renderer`
- Contains custom invoice template and downloadable PDF output

### Settings

- Company profile form
- Logo upload (base64 preview)
- Account metadata display
- Logout and destructive account deletion flow

## 14) Internationalization & Content Strategy

- Language context in `src/contexts/LanguageContext.tsx`
- Translation dictionary is in-file (DE/EN string map)
- Default language intentionally German for SEO/business focus
- User language preference persisted in `localStorage`

## 15) SEO & Discoverability

Implemented with Next metadata APIs + structured data.

- Extensive metadata in root layout
- OG/Twitter metadata for sharing
- JSON-LD on home page
- `robots` route disallows private/app/API surfaces
- `sitemap` route defines public URLs and priorities

## 16) Security & Privacy Notes

Positive patterns:

- HTTP-only session cookie for SSR auth flows
- Cookie `secure` in production
- User-scoped Appwrite permissions on created documents
- API route auth checks before operations

Areas to watch:

- Several endpoint handlers use admin DB client after auth but rely mostly on ID-level access and filtering; ownership validation should remain explicit for single-document operations.
- OAuth and login flows contain extensive console logging; avoid leaking sensitive operational details in production logs.
- Cleanup route uses separate env keys (`APPWRITE_API_ENDPOINT`, `APPWRITE_PROJECT_ID`) from main app keys.

## 17) Operational Behavior & Deployment Expectations

- Works as a stateless Next.js app with cookie-backed sessions.
- `output: "standalone"` supports container deployment.
- Requires correctly configured Appwrite project, collections, attributes, indexes, and API key permissions.
- Guest cleanup endpoint is intended to be called by an external scheduler (cron).

## 18) Known Architectural Tradeoffs

1. **Monolithic translation file**
    - Easy to start, harder to scale and maintain.

2. **Inline styles in many UI files**
    - Fast implementation, but can increase visual inconsistency over time.

3. **Service + store overlap**
    - Both abstract API calls; can be unified later for less duplication.

4. **Client-side flow complexity in auth callback**
    - Robust handling, but more moving parts in OAuth debugging.

## 19) Suggested Next Improvements (Prioritized)

1. Add strong ownership checks in every `[id]` API route before update/delete.
2. Add centralized request validation schemas (e.g., Zod) for API inputs.
3. Normalize environment variable names across all routes.
4. Split i18n dictionaries into modular files per domain/page.
5. Add integration tests for auth + invoice creation + PDF generation flows.
6. Add formal API contract docs (request/response examples) for each endpoint.

## 20) Quick Start for New Maintainers

1. Install dependencies: `npm install`
2. Configure required environment variables (Appwrite + app URL + secrets)
3. Run dev server: `npm run dev`
4. Verify auth flow (`/login`, `/register`, Google OAuth)
5. Verify onboarding flow (`/onboarding`)
6. Verify dashboard CRUD areas (`/dashboard/clients`, `/dashboard/products`, `/dashboard/invoices`)
7. Verify PDF route (`/dashboard/invoices/[id]/pdf`)

## 21) File Map (Most Important Files)

### Core app

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/dashboard/layout.tsx`

### Auth

- `src/contexts/AuthContext.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/user/route.ts`
- `src/app/api/auth/google/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/app/auth/callback/page.tsx`

### Data/API

- `src/lib/appwrite.ts`
- `src/lib/appwrite-server.ts`
- `src/app/api/company/route.ts`
- `src/app/api/clients/route.ts`
- `src/app/api/clients/[id]/route.ts`
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`
- `src/app/api/invoices/route.ts`
- `src/app/api/invoices/[id]/route.ts`
- `src/app/api/invoices/stats/route.ts`

### State/services/types

- `src/store/clientStore.ts`
- `src/store/productStore.ts`
- `src/store/invoiceStore.ts`
- `src/lib/clientService.ts`
- `src/lib/productService.ts`
- `src/lib/invoiceService.ts`
- `src/lib/companyService.ts`
- `src/types/index.ts`

### Utilities & UX

- `src/lib/currencyUtils.ts`
- `src/lib/dateUtils.ts`
- `src/contexts/LanguageContext.tsx`
- `src/app/robots.ts`
- `src/app/sitemap.ts`

## 22) Final Summary

This codebase is a solid, production-oriented MVP for invoice management:

- modern Next.js architecture
- practical Appwrite-backed auth/data model
- clean dashboard domain separation (clients/products/invoices)
- end-to-end invoice PDF pipeline
- strong German SEO orientation

The primary opportunities now are hardening (authorization validation + input validation), operational consistency (env alignment), and maintainability improvements (i18n modularization and tests).
