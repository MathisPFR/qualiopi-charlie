# Story 1.2: Schéma Prisma rôles et InstanceSettings

Status: review

## Story

As an **ADMIN**,
I want **User roles and a singleton InstanceSettings row in the database**,
so that **the instance can be configured without recompilation**.

## Acceptance Criteria

1. **Given** the POC User schema has no `role`
   **When** a Prisma migration adds `UserRole` enum (`ADMIN` | `OPERATEUR`) and `role` on `User`
   **Then** existing users get a safe default and the migration applies cleanly

2. **Given** no `InstanceSettings` table
   **When** the migration runs
   **Then** a singleton model exists with `id = "singleton"` and fields seedable from `config/client.json` (`orgName`, `orgEmail`, `formBaseUrl`) plus workflow defaults (`devisRequired`, `sendProgrammeOnLaunch`, `emargementModeDefault`)

3. **Given** migration applied
   **When** `npm run db:seed` runs
   **Then** the admin user from env/`ADMIN_EMAIL` has `role: ADMIN`
   **And** one `InstanceSettings` row is upserted from `config/client.json`

4. **Given** project enum conventions
   **When** inspecting new enums
   **Then** values use SCREAMING_SNAKE (`UserRole`, `EmargementMode`)

5. **Given** story scope
   **When** reviewing the diff
   **Then** no Auth.js session/JWT role wiring (Story 1.4), no `getInstanceConfig()` (Story 1.3), no `UserStatus`/invitation fields (Story 1.6)

## Tasks / Subtasks

- [x] **Schema** (AC: #1, #2, #4)
  - [x] Add `UserRole`, `EmargementMode` enums
  - [x] Add `role UserRole @default(OPERATEUR)` on `User`
  - [x] Add `InstanceSettings` singleton model per architecture research B5 (minimal v1 fields)

- [x] **Migration** (AC: #1, #2)
  - [x] Create migration `add_user_role_and_instance_settings` via `prisma migrate dev`
  - [x] Verify applies on Docker Postgres (`docker compose exec app ...`)

- [x] **Seed** (AC: #3)
  - [x] Load `config/client.json` in `prisma/seed.mjs`
  - [x] Upsert admin with `role: ADMIN`
  - [x] Upsert `InstanceSettings` id `singleton` from client.json

- [x] **Verification** (AC: #5)
  - [x] `npx prisma validate`
  - [x] `npm run build`
  - [x] Do not modify `src/lib/auth.ts` callbacks yet

## Dev Notes

### Previous story learnings (1.1)

- Docker dev uses volume `app_node_modules` — run migrate/seed inside container or after entrypoint sync
- Use `prisma migrate dev` (architecture) — POC used `db push`; first formal migration in this story
- `.npmrc` has `legacy-peer-deps=true`

### InstanceSettings — minimal scope for 1.2

Seed from `config/client.json` today:

```json
{ "orgName", "orgEmail", "formBaseUrl" }
```

Model (nullable overrides + workflow defaults — Brevo fields **Story 2.2**):

```prisma
model InstanceSettings {
  id                      String         @id @default("singleton")
  orgName                 String?
  orgEmail                String?
  formBaseUrl             String?
  devisRequired           Boolean        @default(true)
  sendProgrammeOnLaunch   Boolean        @default(false)
  emargementModeDefault   EmargementMode @default(PDF)
  updatedAt               DateTime       @updatedAt
}
```

Do **not** add Brevo encrypted columns yet.

### User model change

```prisma
enum UserRole {
  ADMIN
  OPERATEUR
}

model User {
  // ...
  role UserRole @default(OPERATEUR)
}
```

Existing seed admin → set `role: ADMIN` on upsert.

### Out of scope

- `getInstanceConfig()` merge logic → Story 1.3
- Middleware / `requireAdmin()` → Story 1.4
- Auth.js JWT `role` in session → Story 1.4
- `UserStatus`, `AccountToken`, invitation → Story 1.6

### References

- [Source: epics.md § Story 1.2]
- [Source: architecture.md § Architecture des données]
- [Source: research/technical-bloc-b-donnees-auth-research-2026-06-11.md § B1, B5]
- [Source: config/client.json]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Enums `UserRole` / `EmargementMode` + modèle `InstanceSettings` singleton ajoutés au schéma Prisma
- Migration baseline manuelle (POC sans historique migrate) : `db execute` + `migrate resolve --applied`
- Seed : admin `role: ADMIN`, `InstanceSettings` upsert depuis `config/client.json`
- `npx prisma validate` ✅, `npm run build` ✅ (Docker)
- Hors scope respecté : pas de changement `auth.ts`, pas de `getInstanceConfig()`

### File List

- `prisma/schema.prisma`
- `prisma/seed.mjs`
- `prisma/migrations/20260614180000_add_user_role_and_instance_settings/migration.sql`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-14 — Story 1.2 implemented: UserRole, InstanceSettings, migration baseline, seed OK
