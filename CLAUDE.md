# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GoldTrack — frontend for a gold shop (toko emas) management system: sales, buyback, stock, purchase orders, stock opname (inventory count), and reports. Bahasa Indonesia is used in domain terms and some commit/UI copy; code and identifiers are English.

## Commands

```bash
npm install
cp .env.example .env    # set VITE_API_BASE_URL
npm run dev              # vite dev server
npm run build             # tsc -b && vite build (type-check then build)
npm run lint               # oxlint
npm run preview
```

There is no test runner configured in this repo. Type-checking happens via `npm run build` (`tsc -b`), not a separate typecheck script.

## Architecture

### Folder layout

```
src/
  app/            router (data router), query client, route guards (ProtectedRoute, RoleGuard)
  components/
    ui/           primitive shadcn components (Button, Input, Table, Dialog, ...)
    layout/       app shell (sidebar, topbar, AppLayout)
    data-table/   generic DataTable (search, filter slot, pagination)
    ...           other reusable components (FormField, ConfirmDialog, EmptyState, StatusBadge)
  config/         nav.ts — sidebar menu structure + per-item role gating
  lib/            api client, toast helper, domain-status mappings, validation, print helpers
  pages/          one file per page/route
  store/          zustand stores (auth, sell-cart, buyback-cart)
  types/          shared types (Role, ApiEnvelope, domain entities)
```

Path alias: `@/*` → `src/*` (configured in both `tsconfig.app.json` and `vite.config.ts`).

### Auth & roles

Token + user (`id/name/role`) live in `useAuthStore` (`src/store/auth-store.ts`). Roles: `ADMIN | KASIR | SUPER_ADMIN` (`src/types/role.ts`). Routes are protected via `ProtectedRoute` (requires login) and `RoleGuard` (requires specific roles) wrapping route subtrees in `src/app/router.tsx`. The sidebar menu (`src/config/nav.ts`) and route `RoleGuard`s must stay in sync — both read role lists from `nav.ts` (`ADMIN_ROLES`, `SUPER_ADMIN_ROLES`, `ALL_ROLES`). Don't hardcode role checks elsewhere.

### Per-action permissions (UI only)

Use `useCan(action, resource)` from `src/lib/permissions.ts` to hide create/edit/delete buttons a role shouldn't see. Default is admin-only (`ADMIN`/`SUPER_ADMIN`); add an entry to `RESOURCE_OVERRIDES` only for exceptions (e.g. `customers.create` is open to `KASIR`). This is UX only — the real guard is the backend's 403; never treat this as a security boundary.

### API client

`src/lib/api/client.ts` wraps an axios instance (`httpClient`):
- Base URL from `env.apiBaseUrl` (`VITE_API_BASE_URL`, required — throws if missing, see `src/lib/env.ts`).
- Request interceptor auto-attaches `Authorization: Bearer <token>` from the auth store.
- Response interceptor auto-unwraps the envelope `{success, data}` → callers get `T` directly, not `AxiosResponse<T>`.
- On `{success:false, error:{code,message}}`, throws `ApiError` (`src/lib/api/error.ts`).
- `401` (except on `/auth/login`) → clears auth store + redirects to `/login`. `403` → redirects to `/403`.

Always call through `api.get/post/put/patch/delete` (exported from `client.ts`), never axios directly — bypassing it skips auth headers, envelope unwrapping, and 401/403 handling.

### Pagination

Most list endpoints return `{items: [...], pagination: {page, limit, total, total_pages}}`, matching what `DataTable` (`src/components/data-table`) expects via its `pagination` prop. Exception: `GET /api/expense-categories` returns a plain array — don't pass a `pagination` prop to `DataTable` for endpoints shaped like this.

### Toasts

Use `showSuccessToast` / `showErrorToast` from `src/lib/toast.ts` — not `toast()` from `sonner` directly. `showErrorToast` knows how to read `.message` off an `ApiError`.

### Design system

Color/typography/spacing/radius tokens live as CSS variables in `src/index.css`, documented in `docs/design-system.md` (includes a ready-to-paste prompt block for Google Stitch). Don't hardcode hex/px values in components — use the already-themed Tailwind utilities (e.g. `bg-green-500`, `text-h1`, `rounded-lg`). `src/pages/design-system-page.tsx` renders a live reference of the tokens/components.

### Domain status mappings

`src/lib/domain-status.ts` centralizes status → visual tone (`success | warning | error | gray`) for domain enums (PO status, stock status, opname results, etc.) — extend this file rather than mapping status strings to colors inline.

### Validation & formatting

Per-entity validation lives in `src/lib/*-validation.ts` (e.g. `product-validation.ts`, `customer-validation.ts`). Number/currency/date formatting helpers are in `src/lib/format.ts`.

### shadcn/ui config

`components.json` — style `radix-nova`, base color `neutral`, icon library `lucide`, CSS variables enabled, no prefix. Aliases: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`, `@/lib/utils`.
