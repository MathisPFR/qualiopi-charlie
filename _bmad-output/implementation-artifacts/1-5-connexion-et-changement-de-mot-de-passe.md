# Story 1.5: Connexion et changement de mot de passe

Status: review

## Story

As an **OPERATEUR**,
I want **to log in and change my password**,
so that **I can access the dashboard securely** (FR-1, FR-2).

## Acceptance Criteria

1. **Given** valid credentials **When** login on `/login` **Then** redirect to dashboard
2. **Given** invalid credentials **When** login **Then** generic error (no email enumeration)
3. **Given** authenticated user **When** changing password on `/compte` **Then** bcrypt hash updated, sign out, new password required on next login

## Tasks / Subtasks

- [x] Login error UX (AC: #1, #2) — done in 1.5 continuation of 1.4 fix
- [x] `/compte` page — Mon compte for all roles (AC: #3)
- [x] `changePassword` server action with validation (AC: #3)
- [x] Nav link Mon compte (OPERATEUR + ADMIN)
- [x] Success message on `/login?passwordChanged=1`
- [x] `npm run build`

## Dev Agent Record

### Completion Notes List

- Page `/compte` : identité + formulaire changement MDP
- `changePassword` : zod, bcrypt verify/hash, signOut après succès
- Login : message générique + confirmation après changement MDP

### File List

- `src/server/actions/account.ts` (new)
- `src/components/change-password-form.tsx` (new)
- `src/app/(dashboard)/compte/page.tsx` (new)
- `src/components/dashboard-nav.tsx`
- `src/app/login/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-14 — Story 1.5: Mon compte + changement mot de passe bcrypt
