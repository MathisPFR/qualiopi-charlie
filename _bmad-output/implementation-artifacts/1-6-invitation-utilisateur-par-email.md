# Story 1.6: Invitation utilisateur par email

Status: done

## Story

As an **ADMIN**,
I want **to invite an operator by email with an activation link**,
so that **the team can access without self-registration** (FR-4).

## Acceptance Criteria

1. **Given** an ADMIN on user management **When** inviting email with OPERATEUR or ADMIN role **Then** user created with PENDING status and email sent with `/auth/activer` link
2. **Given** invited user with valid token **When** setting password on `/auth/activer` **Then** account becomes ACTIVE and user can log in

## Tasks / Subtasks

- [x] Prisma `UserStatus`, `AccountToken`, migration (AC: #1)
- [x] `inviteUser` + `activateAccount` server actions (AC: #1, #2)
- [x] Email template `user-invite` via `sendMail` (AC: #1)
- [x] `/parametres/utilisateurs` admin UI + `/auth/activer` public page (AC: #1, #2)
- [x] Middleware public `/auth/*`, auth rejects PENDING login (AC: #2)
- [x] Vitest unit tests
- [x] `npm run build` + `npm test`

## Dev Agent Record

### Completion Notes List

- Migration : `UserStatus`, `AccountToken`, `passwordHash` nullable, statut ACTIVE pour users existants
- Tokens INVITE SHA-256, TTL 7 jours, invalidation à la ré-invitation
- Page admin sous `/parametres/utilisateurs`, lien depuis Paramètres
- Activation publique `/auth/activer?token=...` → redirect `/login?activated=1`

### File List

- `prisma/schema.prisma`
- `prisma/migrations/20260614210000_add_user_status_and_account_tokens/migration.sql`
- `prisma/seed.mjs`
- `src/lib/account-tokens.ts`
- `src/lib/account-tokens.test.ts`
- `src/lib/auth.ts`
- `src/middleware.ts`
- `src/server/actions/users.ts`
- `src/server/actions/users.test.ts`
- `src/server/actions/account.ts`
- `src/server/services/mail-templates/user-invite.ts`
- `src/server/services/mail-templates/user-invite.test.ts`
- `src/components/invite-user-form.tsx`
- `src/components/activate-account-form.tsx`
- `src/app/auth/activer/page.tsx`
- `src/app/(dashboard)/parametres/page.tsx`
- `src/app/(dashboard)/parametres/utilisateurs/page.tsx`
- `src/app/login/page.tsx`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-14 — Story 1.6: invitation email + activation compte PENDING→ACTIVE
