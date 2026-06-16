# Wichi Farms And Agro Solutions — WICHI System

Business management system for Wichi Farms And Agro Solutions (Malawi): quotation/document builder with multi-type conversion, inventory catalogue, sales leads CRM, and full multi-user auth with approval workflows.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — express-session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + connect-pg-simple
- DB: PostgreSQL + Drizzle ORM
- Auth: bcryptjs password hashing, session-based auth stored in `sessions` table
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + Tailwind v4 + shadcn/ui + wouter + framer-motion + TanStack Query

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all endpoints)
- `lib/api-spec/orval.config.ts` — Orval codegen config; patched to fix index.ts collision
- `lib/api-zod/src/` — generated Zod schemas
- `lib/api-client-react/src/` — generated React Query hooks
- `lib/db/src/schema.ts` — Drizzle DB schema (quotations, users, inventory, leads)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/wichi-quotation/src/` — React frontend
- `artifacts/wichi-quotation/src/contexts/auth.tsx` — Auth context (login/logout/refreshUser)
- `artifacts/wichi-quotation/src/pages/` — home, preview, history, inventory, leads, login, profile, admin

## Architecture decisions

- Orval codegen `schemas` output removed to prevent TS2308 collision (types inferred from Zod); a post-codegen `printf` command overwrites the generated index.ts to only export from `./generated/api`.
- Sessions stored in PostgreSQL `sessions` table via `connect-pg-simple` (table auto-created on first start).
- `userRole` is stored in session alongside `userId` so auth middleware can check role without a DB round-trip.
- PDF download requires document status = `approved` (or user is admin); non-admins must submit for approval first.
- Document types: quotation, invoice, receipt, delivery_note, sale_order — all share one table with `documentType` column.

## Product

- **Document Builder** — create/edit quotations, invoices, receipts, delivery notes, sale orders; auto-fill preparedBy & signature from user profile
- **Approval Workflow** — staff submit docs for approval; admins approve/reject with reason; PDF blocked until approved
- **PDF Export** — html-to-image → jsPDF, 794px A4 width
- **History** — searchable list with status badges (draft/pending/approved/rejected)
- **Inventory** — product catalogue with unit pricing
- **Leads CRM** — sales leads with follow-up tracking
- **Auth** — login/logout, profile page (name + signature upload), change password
- **Admin Panel** — approve/reject pending docs, manage users (super_admin only)

## Default credentials

- Username: `admin` / Password: `admin123`
- Role: `super_admin` — change password after first login via Profile page

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After `pnpm --filter @workspace/api-spec run codegen`, the index.ts in `lib/api-zod/src/` is automatically patched by the codegen script to remove the `./generated/types` re-export that Orval adds.
- The `sessions` table is created automatically by `connect-pg-simple` on first API server start.
- PDF export uses `html-to-image` (NOT html2canvas). Fixed 794px A4 width via inline style.
- To pass savedId to preview for approval check, use `?id=<savedId>` URL param.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
