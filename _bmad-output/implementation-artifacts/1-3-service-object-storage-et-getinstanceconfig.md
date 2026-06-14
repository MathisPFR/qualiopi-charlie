# Story 1.3: Service object-storage et getInstanceConfig

Status: review

## Story

As a **developer**,
I want **a local/R2 storage abstraction and unified config merge**,
so that **file access is centralized via object-storage and workflows read merged instance config**.

## Acceptance Criteria

1. **Given** `STORAGE_DRIVER=local` in dev
   **When** `object-storage.ts` exposes put/get/list/delete with keys `formations/{id}/{phase}/{file}`
   **Then** operations work on `storage/` local filesystem

2. **Given** `STORAGE_DRIVER=r2` with valid R2 env vars
   **When** same API is called
   **Then** operations use S3-compatible R2 client (same key convention)

3. **Given** `config/client.json` and seeded `InstanceSettings`
   **When** `getInstanceConfig()` is called
   **Then** it merges client.json defaults with DB overrides (InstanceSettings wins for non-null string fields)
   **And** workflow defaults come from DB when row exists

4. **Given** story scope
   **When** reviewing the diff
   **Then** existing `storage.ts` POC is untouched; no workflow migration yet (Story 5.3)

## Tasks / Subtasks

- [x] **object-storage.ts** (AC: #1, #2)
  - [x] Interface put/get/list/delete + `getObjectStorage()` factory
  - [x] Local driver → `storage/{key}`
  - [x] R2 driver → `@aws-sdk/client-s3`
  - [x] Helper `formationObjectKey(formationId, phase, filename)`

- [x] **instance-config.ts** (AC: #3)
  - [x] `getInstanceConfig()` async merge client.json + InstanceSettings
  - [x] Export `InstanceConfig` type

- [x] **Env** (AC: #2)
  - [x] Document `STORAGE_DRIVER`, `R2_*` in `.env.example`

- [x] **Verification** (AC: #4)
  - [x] `npm run build`
  - [x] Smoke test local driver in Docker

## Dev Notes

- Location: `src/server/services/object-storage.ts`, `src/lib/instance-config.ts`
- Key format: `formations/{formationId}/{phase}/{filename}` — phases from project-context
- `storagePrefix` stays client.json-only (legacy POC paths); not in InstanceSettings v1
- Do NOT migrate workflows off `storage.ts` in this story

## Dev Agent Record

### Completion Notes List

- `object-storage.ts` : drivers `local` (filesystem `storage/`) et `r2` (S3 SDK), API put/get/list/delete
- `formationObjectKey()` pour clés `formations/{id}/{phase}/{file}`
- `getInstanceConfig()` merge `client.json` + `InstanceSettings` (DB gagne si non-null)
- `.env.example` documente `STORAGE_DRIVER` et variables R2
- `@aws-sdk/client-s3` ajouté ; build ✅ ; smoke script OK

### File List

- `src/server/services/object-storage.ts` (new)
- `src/lib/instance-config.ts` (new)
- `scripts/smoke-object-storage.ts` (new)
- `.env.example`
- `package.json`
- `package-lock.json`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

## Change Log

- 2026-06-14 — Story 1.3 implemented: object-storage abstraction + getInstanceConfig merge