# Story 1.1: Initialiser shadcn/ui et composants de base

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **to formalize shadcn/ui with the required components**,
so that **all epics share a common UI foundation**.

## Acceptance Criteria

1. **Given** the POC has no `components.json`
   **When** `npx shadcn@latest init` runs successfully
   **Then** `components.json` exists at project root with correct aliases (`@/components`, `@/lib/utils`, `@/components/ui`)

2. **Given** init is complete
   **When** `npx shadcn@latest add sidebar sheet alert-dialog skeleton badge toast table checkbox select` runs
   **Then** all listed components exist under `src/components/ui/`

3. **Given** shadcn init completes
   **When** inspecting `src/app/globals.css`
   **Then** shadcn CSS variables are present (including sidebar tokens required by `sidebar` component: `--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, etc.)

4. **Given** existing POC pages use `button`, `card`, `input`, `label`, `badge`
   **When** init/add completes
   **Then** `npm run build` succeeds with no TypeScript errors and existing imports from `@/components/ui/*` still resolve

5. **Given** new toast component is installed
   **When** inspecting root layout wiring
   **Then** `<Toaster />` (or Sonner equivalent from shadcn toast) is mounted in `src/app/layout.tsx` so future stories can trigger toasts

## Tasks / Subtasks

- [ ] **Preflight brownfield audit** (AC: #1, #4)
  - [ ] Confirm missing `components.json`; note existing partial setup: `tailwind.config.ts`, `globals.css`, `src/lib/utils.ts`, 5 manual UI components
  - [ ] Run `npm run build` baseline before changes — capture any pre-existing failures separately

- [ ] **Initialize shadcn CLI** (AC: #1, #3)
  - [ ] Run: `npx shadcn@latest init --yes --defaults --base-color neutral` (or interactive equivalent if flags fail)
  - [ ] If React 19 peer-deps block install: use `--force` per [shadcn React 19 guide](https://ui.shadcn.com/react-19)
  - [ ] Verify `components.json` paths point to `src/` (`css: src/app/globals.css`, `tailwind.config: tailwind.config.ts`)
  - [ ] Merge (don't blindly overwrite) any changes to `globals.css` — preserve existing `:root` tokens; add missing sidebar/chart/popover tokens from shadcn template

- [ ] **Install required components** (AC: #2)
  - [ ] Run: `npx shadcn@latest add sidebar sheet alert-dialog skeleton badge toast table checkbox select`
  - [ ] If `badge` already exists: accept CLI overwrite only if API-compatible; verify `formation-statut-badge.tsx` and list pages still compile
  - [ ] Install transitive deps (`tailwindcss-animate`, `@radix-ui/react-checkbox`, sonner for toast, sidebar deps) via CLI — do not hand-pick versions unless CLI fails

- [ ] **Tailwind & tooling alignment** (AC: #3, #4)
  - [ ] Ensure `tailwindcss-animate` plugin added to `tailwind.config.ts` if CLI requests it
  - [ ] Ensure `content` paths still cover `./src/**/*.{ts,tsx}`
  - [ ] Add `src/hooks/use-mobile.tsx` if sidebar CLI generates it (standard shadcn sidebar dependency)

- [ ] **Wire toast provider** (AC: #5)
  - [ ] Import and mount `<Toaster />` in `src/app/layout.tsx` (client boundary as required by shadcn toast/sonner)

- [ ] **Regression verification** (AC: #4)
  - [ ] Run `npm run lint` and `npm run build`
  - [ ] Smoke-check pages still render: `/login`, `/` (dashboard list), one formation detail page
  - [ ] Do **not** refactor `DashboardNav` → `AppSidebar` in this story (Story 4.1 scope)

## Dev Notes

### Epic context (Epic 1 — Fondation instance & accès sécurisé)

This is the **first story** of Epic 1 and the **first implementation story of the entire project**. It unblocks all UI-heavy epics (2–9). Subsequent Epic 1 stories (1.2–1.8) depend on this foundation but must not be started here.

Cross-epic components required by architecture/UX that this story installs (used later, not implemented here):

| Component | Used in |
|-----------|---------|
| `sidebar` + `sheet` | Story 4.1 — contextual App ↔ Formation nav (UX-DR1, DR5, DR16) |
| `alert-dialog` | Stories 4.4, 5.4 — irreversible status transitions (UX-DR15) |
| `skeleton` | UX-DR18 — loading states matching final layout |
| `toast` | Story 5.x — launch success/failure feedback |
| `table` | Story 5.6 — post-launch recipient tracking (UX-DR12) |
| `checkbox` | Story 9.2 — Bibliothèque multi-select ZIP export |
| `select` | Formation editors, Paramètres forms |

### Brownfield state — READ BEFORE TOUCHING FILES

**Already present (manual/partial shadcn setup):**

| File | Current state |
|------|---------------|
| `src/app/globals.css` | Has core shadcn HSL variables (`--background`, `--primary`, `--radius`, etc.) — likely incomplete vs latest shadcn template (missing sidebar vars) |
| `tailwind.config.ts` | Has `darkMode: ["class"]`, color tokens mapped to CSS vars — **no** `tailwindcss-animate` plugin yet |
| `src/lib/utils.ts` | Has `cn()` helper — shadcn init may rewrite; preserve `formatDateFr()` if overwritten |
| `src/components/ui/` | **5 files**: `button`, `card`, `input`, `label`, `badge` — hand-maintained, used across 15+ import sites |
| `components.json` | **Missing** — primary deliverable of this story |

**Explicitly out of scope:**

- Building `AppSidebar`, `NavApp`, `NavFormation` (Story 4.1)
- Refactoring `(dashboard)/layout.tsx` or removing `DashboardNav`
- Instance branding / CSS `--primary` override from InstanceSettings (Story 2.4)
- Installing components not listed in AC (tabs, dialog, dropdown-menu, etc.) unless required as sidebar transitive deps

### Project Structure Notes

Target structure per architecture — this story only touches the `ui/` shell layer:

```
src/
  app/
    globals.css          # UPDATE — shadcn tokens (+ sidebar vars)
    layout.tsx           # UPDATE — add Toaster
  components/
    ui/                  # ADD/MERGE — 9 component groups from CLI
  lib/
    utils.ts             # MAY UPDATE — preserve formatDateFr()
  hooks/
    use-mobile.tsx       # ADD if sidebar requires it
components.json          # CREATE
tailwind.config.ts       # UPDATE — animate plugin if needed
package.json             # UPDATE — new radix/sonner deps via CLI
```

Alias convention: `@/*` → `./src/*` (already in `tsconfig.json`). `components.json` must use `@/components/ui` for UI path.

### Technical Requirements

**Init command (brownfield, non-interactive preferred):**

```bash
npx shadcn@latest init --yes --defaults --base-color neutral
# If peer-deps fail on React 19:
npx shadcn@latest init --yes --defaults --base-color neutral --force
```

**Add command (exact list from epics + architecture):**

```bash
npx shadcn@latest add sidebar sheet alert-dialog skeleton badge toast table checkbox select
```

**Expected `components.json` essentials:**

- `style`: `"new-york"` (CLI default — acceptable)
- `rsc`: `true`
- `tsx`: `true`
- `tailwind.css`: `"src/app/globals.css"`
- `tailwind.config`: `"tailwind.config.ts"`
- `aliases.components`: `"@/components"`
- `aliases.ui`: `"@/components/ui"`
- `aliases.utils`: `"@/lib/utils"`

**React 19 / Next 15.1:** Project uses React 19.0.0 + Next 15.1.0. shadcn CLI may prompt for `--force` on install — accept it. Do **not** downgrade React.

**Toast note:** Modern shadcn `toast` uses **Sonner** (`sonner` package + `<Toaster />`). Mount in root layout; do not build custom toast system.

**Sidebar note:** shadcn Sidebar is a compound component set (`sidebar.tsx`, `sidebar-provider`, etc.) — expect multiple files, not a single component. Requires sidebar CSS variables in `globals.css`.

### Architecture Compliance

- [Source: `_bmad-output/planning-artifacts/architecture.md` § Starter Template] Brownfield incremental — **do not** run `create-next-app`
- [Source: architecture.md § Implementation Patterns] `components/ui/` = shadcn only, no business logic
- [Source: architecture.md § Handoff] Priority #1: `npx shadcn@latest init` + sidebar components
- [Source: `_bmad-output/project-context.md` § Framework Rules] Use shadcn for Button, Card, Dialog, Sidebar — no custom reimplementation
- 4-layer architecture unchanged — this story is infrastructure only, no Server Actions/workflows

### Library & Framework Requirements

| Package | Status | Action |
|---------|--------|--------|
| `class-variance-authority`, `clsx`, `tailwind-merge` | Installed | Keep |
| `@radix-ui/react-slot` | Installed | Keep |
| `@radix-ui/react-dialog` | Installed | Used by alert-dialog/sheet |
| `@radix-ui/react-select` | Installed | May be upgraded by checkbox/select add |
| `@radix-ui/react-label` | Installed | Keep |
| `lucide-react` | Installed | Required by sidebar |
| `tailwindcss-animate` | Missing | Install via shadcn init/add |
| `sonner` | Missing | Install via toast add |

### Testing Requirements

- No unit test framework in POC — do not introduce Jest/Vitest in this story
- **Mandatory:** `npm run build` + `npm run lint` pass
- **Manual smoke (MCP browser or curl):** `/login`, `/` load without console errors
- Do not run full A4-7 smoke checklist — that's deployment validation, not story 1.1

### Regression Guardrails

**Files with existing `@/components/ui/*` imports — must still compile:**

- `src/app/login/page.tsx`
- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/formations/[id]/page.tsx`, `edit/page.tsx`
- `src/components/formation-form.tsx`, `formation-actions.tsx`, `formation-drive.tsx`
- `src/components/dashboard-nav.tsx`, `devis-upload.tsx`, editors (`seances`, `stagiaires`, `objectifs`)
- `src/components/public-form.tsx`

If shadcn overwrites `button.tsx` or `badge.tsx` with breaking API changes, fix call sites minimally — do not revert to pre-shadcn manual components.

**Preserve in `utils.ts`:**

```typescript
export function formatDateFr(date: Date): string { ... }
```

### References

- [Source: `_bmad-output/planning-artifacts/epics.md` § Story 1.1] User story + BDD acceptance criteria
- [Source: `_bmad-output/planning-artifacts/architecture.md` L155–157, L563, L611] Init commands + gap note
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-app-2026-06-11/DESIGN.md` L139] Component inventory (Sidebar, AlertDialog, Toast, Skeleton, Table, Checkbox)
- [Source: `_bmad-output/planning-artifacts/ux-designs/ux-app-2026-06-11/EXPERIENCE.md` L62, L139] Sidebar contextual pattern + WCAG via shadcn defaults
- [Source: `_bmad-output/project-context.md` § Technology Stack, Framework Rules] React 19, Tailwind 3.4, shadcn target
- [External: https://ui.shadcn.com/docs/components/sidebar] Sidebar installation requirements
- [External: https://ui.shadcn.com/react-19] React 19 peer dependency handling

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
