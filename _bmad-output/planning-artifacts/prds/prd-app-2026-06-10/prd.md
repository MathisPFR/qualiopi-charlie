---
title: "PRD — Qualiopi Automation System"
status: final
created: 2026-06-10
updated: 2026-06-10
working_title: "Système d'automatisation Qualiopi"
commercial_name: TBD
---

# PRD: Système d'automatisation Qualiopi

_Working title — commercial name to be chosen later._

## 0. Document Purpose

This PRD defines the product requirements for a **professional Qualiopi administrative automation system**, evolving from an existing brownfield POC. It is intended for product decisions, UX design (`bmad-ux`), architecture (`bmad-create-architecture`), and epic/story breakdown.

**Inputs:** brownfield codebase (`qualiopi-charlie` repo), `context/CONTEXT_Qualiopy_POC.md` (Make/Notion parity), `docs/WORKFLOWS.md`, stakeholder discovery with Root (2026-06-10).

**Structure:** Glossary-anchored vocabulary (§3), user journeys (§2.3), features with FR-1–FR-33 (§4), assumptions indexed (§9).

## 1. Vision

Many SaaS tools already automate Qualiopi administrative work. This product competes not on “replacing Make or Notion,” but on **deep personalization**: working sessions with each client, understanding their exact documents, workflows, and optional modules, and integrating those choices into a **dedicated instance** deployed on the client's VPS.

The system is the **operational interface for a Formation** — the place where training organizations create and manage formations, trigger document generation, send emails, collect evaluations, store audit evidence, and (in v1) manage electronic signatures. It must be **reliable, user-friendly, and maintainable** — addressing the fragility and maintenance burden of the prior Notion + Make stack.

**First user:** Anne-Hélène (collaborator, former employer) — internal production use on her own formations.

**Commercial model:** Small to medium training organizations (or companies that deliver training). Setup (~€4,000) covers VPS deployment, onboarding meetings, and client-specific configuration (documents, modules, signature options). Ongoing support (~€80/month) includes maintenance, small module additions, VPS costs, and direct access to Root.

**Deployment model:** One GitHub repo, **one instance per client** on their VPS — not multi-tenant SaaS.

### 1.1 Differentiation

| Market SaaS | This product |
|-------------|--------------|
| Standardized feature set | Client-specific templates, modules, and workflows |
| Self-serve onboarding | Guided setup with meetings and integration |
| Shared infrastructure | Dedicated instance per client |

### 1.2 v1 Product Surface

- **In scope:** Admin dashboard for the training organization (operators/admins).
- **Out of scope (v1):** Stagiaire or entreprise login portals. Stagiaires and client companies interact only via **email and public forms** (`/f/{slug}/...`).
- **v2 candidate (not v1):** Per-module QCM for stagiaires (Qualiopi requirement), potentially AI-generated from the training program and sent by email.

### 1.3 v1 Workflow Scope

All Make-parity workflows from the brownfield POC, **plus electronic signatures in v1**:

| Workflow | v1 |
|----------|-----|
| Formation launch (documents + emails) | Required |
| Attendance sheets (émargements) | Required |
| End of formation (certificates + evaluations) | Required |
| Cold evaluation (M+2) | Required |
| Public forms (needs, hot/cold evaluations) | Required |
| Electronic signatures | Required — provider TBD; must support **free/low-cost testing** for development |

`[ASSUMPTION: Signature provider is not Zoho Sign by default — evaluate free/self-hosted options first.]`

### 1.4 Success Criteria (v1)

The v1 release is successful when:

1. **Anne-Hélène** manages 100% of her formations in the system (no parallel Notion/Make process).
2. **Three paying clients** are deployed on their own VPS instances with client-specific configuration.
3. **Zero audit incidents** attributable to missing documents, failed sends, or disorganized evidence during Qualiopi audits.

_Counter-metric: raw feature count — do not optimize for matching every SaaS checkbox; optimize for reliability and client-fit._

---

## 2. Target User

### 2.1 Personas (v1)

| Persona | Description | App access |
|---------|-------------|------------|
| **Operator** (e.g. Anne-Hélène) | Day-to-day formation management for one training organization | Admin dashboard |
| **Client admin** | Same role at a commercial client's dedicated instance | Admin dashboard |
| **Stagiaire** | Learner enrolled in a Formation | Email + public forms only |
| **Entreprise cliente** | Company commissioning the Formation | Email + public forms only |
| **Integrator** (Root) | Deployment, initial configuration, support | Outside daily app use |

### 2.2 Jobs To Be Done

**Operator**
- Create and launch a Formation without juggling Notion, Make, and scattered folders.
- Trust that documents, emails, and signatures ran correctly — and fix failures quickly.
- Find every generated file for a Formation in one place (audit-ready).
- Configure what is mandatory vs optional per client (devis timing, program send, etc.).

**Stagiaire**
- Receive clear emails with the right attachments and one simple form to complete.
- Complete forms on phone or desktop with minimal re-typing.

**Integrator**
- Deploy a client instance with their templates and rules pre-configured; allow the client to adjust later.

### 2.3 Key User Journeys

#### UJ-1. Anne-Hélène launches a new Formation

- **Persona + context:** Anne-Hélène, operator at her training organization, starting a new client engagement she has already quoted offline.
- **Entry state:** Authenticated on the admin dashboard (credentials provided at onboarding; she may change her password later).
- **Path:**
  1. Clicks **New Formation**.
  2. Enters **Entreprise**, **Stagiaires**, **dates**, **Séances**, **Objectifs**, and uploads the **Devis** (current process: devis required before launch).
  3. `[ASSUMPTION: Optionally links an existing Formation Type — see §2.4 — or creates without one.]`
  4. Reviews all entered data for accuracy.
  5. Clicks **Valider et lancer**.
  6. System generates required documents, sends emails (stagiaire + entreprise), attaches PDFs, and triggers signature flow (link in email or dedicated signature email — TBD with provider).
  7. Optionally sends **programme de formation** by email when configured.
- **Climax:** A clear **success state** on the Formation: all emails marked sent, all documents generated and filed.
- **Resolution:** Anne-Hélène sees the Formation's document library organized in-app; stagiaires/entreprise receive their first mails and forms.
- **Edge cases:**
  - **Email failure:** Visible indicator per recipient; ability to **retry** and surface **why** it failed.
  - **Document generation failure:** Visible error on the affected document; not silently skipped.

#### UJ-2. Anne-Hélène runs a Formation through EN_COURS → TERMINEE

- **Persona + context:** Anne-Hélène, Formation already launched, sessions underway or complete.
- **Entry state:** Authenticated; Formation detail page.
- **Path:**
  1. Sets Formation status to **EN_COURS** → system generates **émargements**.
  2. **v1 default:** one émargement PDF **per stagiaire**, containing all relevant Séances. `[ASSUMPTION: Per-client variants — e.g. one shared PDF — configurable later.]`
  3. When training ends, sets status to **TERMINEE** → system sends end-of-formation emails with required forms/attachments.
- **Climax:** Émargements filed; end emails sent with same success/failure visibility as UJ-1.
- **Resolution:** Formation moves toward audit-complete evidence set under `apres-la-formation/` and related folders.

#### UJ-3. Marc (stagiaire) completes a public form after launch email

- **Persona + context:** Marc, stagiaire told he will receive an email about his Formation.
- **Entry state:** Unauthenticated; mobile or desktop mail client.
- **Path:**
  1. Receives launch email with context, PDF attachments, and link to **besoins stagiaire** form (and signature link if applicable).
  2. Opens link → public form in the app (`/f/{slug}/...`).
  3. Fields **pre-filled** from data the operator already entered; completes any missing fields.
  4. Later: receives **évaluation à chaud** form at end of Formation; **évaluation à froid** ~2 months after `dateFin`.
  5. Receives owed documents as **email attachments** when applicable.
- **Climax:** Form submitted; operator sees submission recorded on the Formation.
- **Resolution:** Marc needs no account; evidence stored for Qualiopi audit.
- **Edge case:** Pre-fill incomplete → Marc supplies missing data without contacting support.

#### UJ-4. Sophie (entreprise cliente) completes her side of the launch

- **Persona + context:** Sophie, HR or training manager at the **Entreprise cliente**, commissioning the Formation.
- **Entry state:** Unauthenticated; receives a **distinct email** from stagiaires (same channel pattern, different content).
- **Path:**
  1. Receives launch email with **entreprise-specific** PDF attachments and link to **besoins entreprise** form.
  2. Opens form → pre-filled where possible; completes missing fields.
  3. Returns **signed** Convention and Devis (signature link in email or same mail — provider TBD).
  4. At **TERMINEE:** receives **attestation de présence** + **évaluation entreprise** form (no certificat — that is per stagiaire).
- **Climax:** Entreprise submissions and signed docs stored; operator sees entreprise evidence separate from stagiaire evidence.
- **Resolution:** Audit trail shows what was sent to `entreprise.email`, distinct from each stagiaire.
- **Edge case:** Same as UJ-3 — mail failure visible to operator with retry.

---

### 2.4 Formation Type vs Formation (instance)

Many clients sell the **same catalog offerings repeatedly** (e.g. five recurring "Formation commercial" products). The product should support:

| Concept | Definition |
|---------|------------|
| **Formation Type** | Reusable catalog entry: program, document set, exercises, QCM (v2), default emails — configured once per client. |
| **Formation** | A **specific delivery** (dates, stagiaires, entreprise, devis) — may optionally **inherit** from a Formation Type. |

**UX intent (validated with stakeholder):**
- On **New Formation**, operator can: **(a)** start blank, **(b)** select an existing Formation Type, or **(c)** create a new Formation Type inline.
- Naming must distinguish Type vs instance clearly in the UI.
- Competitors offer similar catalog → worth including; exact UX (select vs wizard vs optional toggle) **TBD in UX phase**.

**v1 decisions (stakeholder):**
- **ADMIN** creates and edits Formation Types; **OPERATEUR** selects Types when creating Formations.
- **Settings:** deployment defaults + **in-app override** (ADMIN) for mandatory/optional rules.

`[NOTE FOR PM: Formation Type depth for v1 vs v2 needs scoping — program + documents likely v1; QCM linkage v2.]`

### 2.5 Document & form ownership (brownfield baseline)

The PRD must preserve **who receives what**. Current app behavior (to extend, not blur):

| Phase | Stagiaire | Entreprise cliente |
|-------|-----------|-------------------|
| **Lancement — email PJ** | Programme *(if uploaded)*, Livret d'accueil *(présentiel/mixte)*, Règlement intérieur | Convention, Devis, CGV *(if available)* |
| **Lancement — formulaire** | `besoins-stagiaire` | `besoins-entreprise` |
| **Lancement — signature** *(v1 required)* | Règlement intérieur | Convention + Devis |
| **EN_COURS — généré** | Émargement PDF *(1 per stagiaire, filed)* **or** per-session **digital signature** *(operator sends link; proof stored in-app)* — see §4.4 | — |
| **TERMINEE — email PJ** | Certificat de réalisation | Attestation de présence |
| **TERMINEE — formulaire** | `eval-chaud` | `eval-entreprise` |
| **M+2 — email** | `eval-froid` *(stagiaires only)* | — |

**Preuves Qualiopi:** separate proof PDFs per send (`Preuve_envoi_stagiaire_*`, `Preuve_envoi_entreprise`, `Preuve_eval_*`) under `preuves-qualiopi/`.

`[ASSUMPTION: Émargements PDF-only mode does not auto-email; digital-signature mode sends a sign link per session per stagiaire.]`

## 3. Glossary

| Term | Definition |
|------|------------|
| **Formation** | A specific training delivery for an Entreprise and Stagiaires, with dates, status, and generated evidence. |
| **Formation Type** | Client-specific reusable template (program, documents, optional modules) from which Formations may be created. |
| **Operator** | Authenticated user with role ADMIN or OPERATEUR (see §4.1). |
| **Stagiaire** | Learner; external to the admin app. |
| **Entreprise cliente** | Client company commissioning a Formation; external to the admin app. |
| **Lancement** | Workflow triggered by **Valider et lancer** — documents, emails, signatures. |
| **Émargement** | Attendance record — PDF file and/or per-session digital signature with stored proof. |
| **Instance** | One deployed copy of the application on a client's VPS (single-tenant). |

## 4. Features

### 4.1 Authentication & operator access

**Description:** Operators access the admin dashboard via credentials. Two roles in v1: **ADMIN** (full access) and **OPERATEUR** (day-to-day Formation operations and automations without changing catalog content or instance settings). Realizes UJ-1 entry state.

**Functional Requirements:**

#### FR-1: Operator login

An Operator can sign in with email and password and reach the admin dashboard. Realizes UJ-1.

**Consequences (testable):**
- Unauthenticated requests to admin routes redirect to login.
- Invalid credentials show an error without revealing whether the email exists.

#### FR-2: Password change

An Operator can change their password after initial login. Realizes UJ-1.

**Consequences (testable):**
- After password change, the new password is required on next login.
- Password is stored hashed, never in plain text.

#### FR-3: Session protection

All admin routes except login, public forms (`/f/*`), auth API, and cron API require an authenticated session.

**Consequences (testable):**
- Middleware blocks unauthenticated access to dashboard routes.
- Public form URLs remain accessible without login.

#### FR-4: Role — ADMIN

A user with role **ADMIN** can access all features: Formation Types, client settings, templates, user management, and all OPERATEUR capabilities.

**Consequences (testable):**
- ADMIN can create/edit Formation Types and client settings.
- ADMIN can provision and assign roles to other users.

#### FR-5: Role — OPERATEUR

A user with role **OPERATEUR** can **create and edit Formation instances** (Entreprise, Stagiaires, dates, Séances, Objectifs, Devis upload), select an existing Formation Type, change Formation status, trigger automations (lancement, émargements, fin, retries), view document library, and send émargement signature links — but **cannot** modify Formation Type definitions, document templates, client settings, or user accounts.

**Consequences (testable):**
- OPERATEUR UI hides or disables Formation Type editor, settings, and user admin.
- OPERATEUR attempting restricted actions receives a clear permission error.

**Out of Scope (v1):**
- Fine-grained per-Formation permissions.
- SSO / OAuth.

---

### 4.2 Formation Type catalog

**Description:** Operators with **ADMIN** role manage **Formation Types** — reusable catalog entries (program, default documents, email rules). **OPERATEUR** can select Types when creating Formations but cannot edit Type content. When a Type is updated, changes propagate according to linked Formation status (see FR-9–FR-11). Realizes UJ-1.

**Functional Requirements:**

#### FR-6: Create Formation Type

An ADMIN can create a Formation Type with at minimum: name, optional programme file, and associated document/template set. Realizes UJ-1.

**Consequences (testable):**
- Formation Type appears in a list manageable from the admin UI.
- Name clearly distinguishes Type from Formation instance in the UI.
- OPERATEUR cannot access this action.

#### FR-7: Edit Formation Type

An ADMIN can update an existing Formation Type's name, programme, and document associations. Saving shows a **warning** summarizing impact on linked Formations.

**Consequences (testable):**
- Changes persist and are visible on next edit.
- Warning lists counts of linked Formations by status (BROUILLON, active, TERMINEE).

#### FR-8: Propagation — BROUILLON

When a Formation Type is saved, linked Formations in status **BROUILLON** **automatically inherit** the updated Type defaults (programme, documents).

**Consequences (testable):**
- BROUILLON Formations reflect Type changes without manual action.
- Operator sees which fields were updated from the Type.

#### FR-9: Propagation — active Formations (optional apply)

When a Formation Type is saved, linked Formations in status **A_LANCER** or **EN_COURS** are **not** auto-updated. The ADMIN sees a simple **apply changes** control listing eligible Formations and can apply per Formation or in bulk.

**Consequences (testable):**
- TERMINEE and ARCHIVEE Formations never appear in the apply list.
- Apply is explicit (button/checkbox per Formation); no silent overwrite of in-flight deliveries.

#### FR-10: Propagation — frozen (completed)

Formations in status **TERMINEE** or **ARCHIVEE** linked to a Type are **never modified** when the Type changes.

**Consequences (testable):**
- Historical evidence and document set remain unchanged for audit.

#### FR-11: Link Type on Formation create

When creating a Formation, an Operator can: start blank, select an existing Formation Type, or (ADMIN only) create a new Type inline. Realizes UJ-1.

**Consequences (testable):**
- Selecting a Type pre-fills programme and document defaults where configured.
- Operator can still override instance-specific fields (dates, stagiaires, devis).

#### FR-12: List and archive Formation Types

An ADMIN can list all Formation Types and deactivate/archive Types no longer sold.

**Consequences (testable):**
- Archived Types cannot be selected for new Formations but remain visible for historical reference.

**Notes:**
- QCM per module linked to Formation Type → v2 (§1.2).

---

### 4.3 Formation instance management

**Description:** Operators create and edit a **Formation** — the specific delivery for an Entreprise, Stagiaires, Séances, Objectifs, dates, and uploaded Devis. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-13: Create Formation

An Operator can create a Formation with Entreprise, Stagiaires, dates, Séances, Objectifs, and Devis upload. Realizes UJ-1.

**Consequences (testable):**
- Devis is stored and associated with the Formation before launch is allowed.
- Formation receives a unique public slug for forms.

#### FR-14: Edit Formation (pre-launch)

An Operator can edit Formation fields until launch constraints apply. Realizes UJ-1.

**Consequences (testable):**
- Post-launch edits follow rules that prevent breaking sent evidence `[NOTE FOR PM: detail in lancement feature]`.

#### FR-15: Formation status lifecycle

An Operator can transition Formation status: BROUILLON → A_LANCER → EN_COURS → TERMINEE (and ARCHIVEE). Realizes UJ-2.

**Consequences (testable):**
- EN_COURS triggers émargement workflow (§4.4).
- TERMINEE triggers fin-de-formation workflow (§4.6).

#### FR-16: Formation document library

An Operator can view all generated documents for a Formation, organized by phase folder and recipient where relevant. Realizes UJ-1 climax.

**Consequences (testable):**
- Documents from lancement, pendant, apres, and preuves-qualiopi are browsable from the Formation detail view.
- Stagiaire vs entreprise artifacts are distinguishable in the UI.

---

### 4.4 Émargements (dual mode)

**Description:** When Formation is **EN_COURS**, attendance is handled in one of two client-configurable modes. Realizes UJ-2.

**Functional Requirements:**

#### FR-17: PDF émargement mode

When PDF mode is active, the system generates one émargement PDF per stagiaire (all relevant Séances), stores it under `pendant-la-formation/`, and does **not** auto-email it. Realizes UJ-2.

**Consequences (testable):**
- One file per stagiaire named consistently (e.g. `Emargement-{intitule}-{nom}.pdf`).
- Operator can view/download from Formation document library.

#### FR-18: Digital signature émargement mode

When digital signature mode is active, an Operator can open a **Séance** and send each enrolled stagiaire an email with a **sign link** for that session's émargement. Realizes UJ-2.

**Consequences (testable):**
- Signature proof is stored in-app and linked to Formation + Séance + stagiaire.
- Unsigned sessions are visible to the Operator.

#### FR-19: Émargement mode configuration

An ADMIN can set the default émargement mode (PDF vs digital signature) in client settings; both modes remain available per Formation where configured. Realizes UJ-2.

**Consequences (testable):**
- Mode is explicit on Formation or instance settings — not implicit.

**Notes:**
- Signature provider shared with lancement signatures (Open Question §8).

---

### 4.5 Lancement workflow

**Description:** **Valider et lancer** triggers the lancement automation: generate documents per recipient rules (§2.5), send emails with PDF attachments, initiate e-signatures, record Qualiopi proof PDFs, and surface success/failure state. Idempotent — re-run skips if already completed unless operator forces retry. Realizes UJ-1, UJ-3, UJ-4.

**Functional Requirements:**

#### FR-20: Launch prerequisites

An Operator cannot launch until mandatory fields are complete, including uploaded **Devis** and at least one stagiaire with email. Realizes UJ-1.

**Consequences (testable):**
- Launch button disabled or blocked with explicit message if Devis missing.
- Entreprise email required if entreprise-side documents are generated.

#### FR-21: Launch — document generation

On launch, the system generates and files documents per §2.5 matrix:

- **Shared:** Convention, CGV *(if template available)*, storage folder structure.
- **Stagiaire (per stagiaire):** Règlement intérieur PDF; programme PDF *(if uploaded)*; livret *(présentiel/mixte only)*.
- **Entreprise:** Convention, Devis, CGV attached to entreprise email.

Realizes UJ-1, UJ-3, UJ-4.

**Consequences (testable):**
- Files land under `avant-la-formation/` and `preuves-qualiopi/` as today.
- Failed document generation reports **which document** failed — not silent skip.

#### FR-22: Launch — emails

On launch, the system sends distinct emails to each stagiaire and to entreprise (if email present) with correct attachments and form links (`besoins-stagiaire`, `besoins-entreprise`). Programme inclusion follows client settings. Realizes UJ-3, UJ-4.

**Consequences (testable):**
- Stagiaire and entreprise receive **separate** emails with **recipient-specific** attachments only.
- Email subject/body match configured templates (French).

#### FR-23: Launch — e-signatures

On launch, the system initiates e-signature requests for: stagiaire **Règlement intérieur**; entreprise **Convention** and **Devis** — via link in email or dedicated signature email (provider TBD). Realizes UJ-1, UJ-3, UJ-4.

**Consequences (testable):**
- Signed documents are retrieved and filed in Formation storage when complete.
- Unsigned status visible per document/recipient.

#### FR-24: Launch — success indicators

After launch, the Operator sees per-recipient status: email sent / failed, documents generated / failed, signature pending / completed. Realizes UJ-1 climax.

**Consequences (testable):**
- Aggregate Formation state shows lancement complete only when all required sends/generations succeeded or explicitly acknowledged.
- Document library lists all generated artifacts.

#### FR-25: Launch — retry failed email

An Operator can retry a failed email send from the Formation detail view and see the error reason. Realizes UJ-1 edge case.

**Consequences (testable):**
- Retry does not duplicate successful sends for the same recipient/step without explicit force.
- Error message is human-readable (provider error, invalid address, etc.).

#### FR-26: Launch — Qualiopi proof records

For each launch email sent, the system generates a proof PDF (`Preuve_envoi_stagiaire_*`, `Preuve_envoi_entreprise`) stored under `preuves-qualiopi/`. Realizes UJ-1.

**Consequences (testable):**
- Proof references recipient, date/time, attachments, and form links.

#### FR-27: Launch idempotence

Re-triggering launch on an already-launched Formation returns skipped/safe state without duplicating sends unless operator explicitly forces re-launch. Realizes UJ-1.

**Consequences (testable):**
- `conventionGenerated` (or equivalent) flag prevents duplicate lancement.
- Automation run logged in audit trail (RUNNING / SUCCESS / FAILED).

**Feature-specific NFRs:**
- Launch workflow completes synchronously from operator action; individual signature completion may be asynchronous.

---

### 4.6 Fin de formation & éval à froid

**Description:** When Formation becomes **TERMINEE**, send end emails with correct attachments and forms; cron triggers **éval à froid** at `dateFin + 2 months`. Realizes UJ-2, UJ-3, UJ-4.

**Functional Requirements:**

#### FR-28: Fin de formation

On TERMINEE, per §2.5: stagiaires receive certificat + `eval-chaud` link; entreprise receives attestation de présence + `eval-entreprise` link; proof PDFs generated. Realizes UJ-2.

**Consequences (testable):**
- Same success/failure/retry pattern as launch (FR-24, FR-25).
- Idempotent — no duplicate fin processing.

#### FR-29: Éval à froid (M+2)

A scheduled job sends `eval-froid` form link to each stagiaire at `dateFin + 2 months`; proof PDF stored; no duplicate send. Realizes UJ-3.

**Consequences (testable):**
- Cron secured with shared secret.
- Only stagiaires receive éval à froid (not entreprise).

---

### 4.7 Formulaires publics

**Description:** Stagiaires and entreprise complete forms at `/f/{slug}/{formType}` without login; known fields pre-filled. Realizes UJ-3, UJ-4.

**Functional Requirements:**

#### FR-30: Public form access

External users access forms via unique Formation slug URLs without authentication. Realizes UJ-3, UJ-4.

**Consequences (testable):**
- Form types: `besoins-stagiaire`, `besoins-entreprise`, `eval-chaud`, `eval-entreprise`, `eval-froid`.
- Stagiaire-scoped forms accept `?stagiaire={id}` for pre-fill.

#### FR-31: Pre-fill and submission

Forms pre-fill stagiaire/entreprise data already known; user completes missing required fields; submission stored and PDF evidence generated where applicable. Realizes UJ-3, UJ-4.

**Consequences (testable):**
- Operator sees submission status on Formation detail.
- Response PDF filed in Formation storage.

---

### 4.8 Client settings (defaults + override)

**Description:** ADMIN configures instance defaults at deployment; ADMIN (and optionally documented OPERATEUR limits) adjusts in-app what is mandatory vs optional — e.g. Devis required before launch, programme email on launch, émargement mode. Realizes UJ-1 configuration intent.

**Functional Requirements:**

#### FR-32: Deployment defaults

Integrator can set initial client settings via deployment config (org name, email, template paths, default mandatory rules). Realizes commercial onboarding.

**Consequences (testable):**
- Fresh instance boots with client-specific defaults without code change.

#### FR-33: In-app settings override

An ADMIN can override mandatory/optional rules in a Settings screen; changes apply to **new** operations according to documented rules (not retroactive to completed Formations). Realizes UJ-1.

**Consequences (testable):**
- OPERATEUR cannot access settings UI.
- Settings include at minimum: programme send on launch, Devis requirement, émargement mode default.

---

## 5. Non-Goals (Explicit)

- Stagiaire/entreprise login portals in v1 (external users use email + public forms only)
- QCM per module with AI generation (v2)
- SSO / OAuth in v1
- Multi-tenant SaaS — one deployed instance per client remains the model
- Fine-grained permissions beyond ADMIN and OPERATEUR roles in v1

## 6. MVP Scope

### 6.1 In Scope (v1)

- Admin dashboard with roles ADMIN and OPERATEUR
- Formation Type catalog (ADMIN) with propagation rules (FR-8–FR-10)
- Formation lifecycle and document library
- Lancement, émargements (PDF + digital signature), fin de formation, éval à froid
- Public forms with pre-fill (stagiaire + entreprise)
- E-signatures on launch documents (provider TBD)
- Client settings: deployment defaults + ADMIN in-app override
- Qualiopi proof PDFs per send
- One instance per client on VPS; Dokploy/GitHub deploy (architecture detail)

### 6.2 Out of Scope for MVP

- Stagiaire/entreprise authenticated portals
- QCM + AI module generation (v2)
- SSO / OAuth
- Multi-tenant SaaS
- Per-Formation ACL beyond ADMIN / OPERATEUR

## 7. Success Metrics

**Primary**

- **SM-1:** Anne-Hélène runs 100% of Formations in the system with no parallel Notion/Make process — target: within 3 months of v1 deploy. Validates FR-13–FR-27.
- **SM-2:** Three paying client instances deployed with client-specific configuration — target: within 6 months. Validates FR-32, commercial model §1.
- **SM-3:** Zero Qualiopi audit incidents due to missing documents, failed sends, or disorganized evidence — ongoing. Validates FR-26, FR-28, document library FR-16.

**Counter-metrics (do not optimize)**

- **SM-C1:** Feature parity with every market SaaS — optimize for reliability and client-fit instead.
- **SM-C2:** Number of Formation Types in catalog — quality over quantity.

## 8. Open Questions

_Deferred to downstream workflows — not blockers for UX or epic breakdown._

| # | Question | Owner | Revisit when |
|---|----------|-------|--------------|
| OQ-1 | Commercial product name | Root | Branding / launch |
| OQ-2 | E-signature provider (free dev tier required) | Architecture | `bmad-create-architecture` |
| OQ-3 | Qualiopi audit constraint checklist | Domain research | Before compliance epic |
| OQ-4 | PDF/template pipeline (DOCX, logos, in-app editor scope) | Architecture | `bmad-create-architecture` |
| OQ-5 | Production email provider (Resend vs SMTP per client) | Architecture | `bmad-create-architecture` |
| OQ-6 | Émargement digital signature — per-session UX detail | UX | `bmad-ux` |
| OQ-7 | Formation Type inline-create UX (select vs wizard) | UX | `bmad-ux` |

## 9. Assumptions Index

- `[ASSUMPTION: Signature provider is not Zoho Sign by default — evaluate free/self-hosted options first.]`
- `[ASSUMPTION: Optionally links an existing Formation Type — see §2.4 — or creates without one.]`
- `[ASSUMPTION: Per-client émargement variants — e.g. one shared PDF — configurable later; v1 = one PDF per stagiaire.]`
- `[ASSUMPTION: Émargements PDF-only mode does not auto-email; digital-signature mode sends a sign link per session per stagiaire.]`
