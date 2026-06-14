# Story 1.4: Middleware et gardes ADMIN/OPERATEUR

Status: review

## Story

As an **OPERATEUR**,
I want **only authorized users to access the right routes**,
so that **ADMIN/OPERATEUR permissions from the PRD are enforced**.

## Acceptance Criteria

1. **Given** a logged-in OPERATEUR
   **When** accessing `/types` or `/parametres`
   **Then** access is denied (redirect to dashboard)

2. **Given** a logged-in ADMIN
   **When** accessing `/types` or `/parametres`
   **Then** access is allowed

3. **Given** auth session
   **When** inspecting JWT/session callbacks
   **Then** `user.role` is present (`ADMIN` | `OPERATEUR`)

4. **Given** Server Actions
   **When** importing from `lib/permissions.ts`
   **Then** `requireAuth()` and `requireAdmin()` are available

5. **Given** OPERATEUR nav (UX-DR19)
   **When** viewing dashboard header
   **Then** Types and Paramètres links are hidden

## Tasks / Subtasks

- [x] **Auth JWT** (AC: #3)
  - [x] Role in authorize + jwt + session callbacks
  - [x] Extend `next-auth.d.ts`

- [x] **permissions.ts** (AC: #4)
  - [x] `requireAuth()`, `requireAdmin()`, `isAdmin()`
  - [x] Refactor `formations.ts` to use shared helper

- [x] **Middleware** (AC: #1, #2)
  - [x] Block OPERATEUR on `/types`, `/parametres`
  - [x] Shared route list in `admin-routes.ts`

- [x] **UI + stubs** (AC: #5)
  - [x] Hide admin nav links for OPERATEUR
  - [x] Stub pages `/types`, `/parametres`

- [x] **Seed dev** 
  - [x] OPERATEUR test user in seed

- [x] **Verification**
  - [x] `npm run build`

## Dev Agent Record

### Completion Notes List

- Role propagé dans JWT/session Auth.js v5
- Middleware redirige OPERATEUR hors routes admin
- Nav masque Types/Paramètres pour OPERATEUR
- Seed : `operateur@charlie.local` / `operateur123` (override via env)

### File List

- `src/lib/auth.ts`
- `src/lib/permissions.ts` (new)
- `src/lib/admin-routes.ts` (new)
- `src/types/next-auth.d.ts`
- `src/middleware.ts`
- `src/components/dashboard-nav.tsx`
- `src/app/(dashboard)/types/page.tsx` (new)
- `src/app/(dashboard)/parametres/page.tsx` (new)
- `src/server/actions/formations.ts`
- `prisma/seed.mjs`
- `.env.example`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-14 — Story 1.4: middleware role guards, permissions helpers, nav UX
