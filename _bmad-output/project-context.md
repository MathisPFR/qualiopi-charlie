---
project_name: qualiopi-charlie
user_name: Root
date: '2026-06-12'
sections_completed:
  - technology_stack
  - language_rules
  - framework_rules
  - testing_rules
  - quality_rules
  - workflow_rules
  - anti_patterns
status: complete
rule_count: 42
optimized_for_llm: true
references:
  - planning-artifacts/architecture.md
  - planning-artifacts/prds/prd-app-2026-06-10/prd.md
  - docs/ARCHITECTURE.md
  - docs/WORKFLOWS.md
---

# Project Context for AI Agents

_Règles critiques pour implémenter du code dans **qualiopi-charlie** (corps produit Qualiopi). Détails complets → `planning-artifacts/architecture.md`._

---

## Technology Stack & Versions

| Couche | Techno | Version POC |
|--------|--------|-------------|
| Runtime | Next.js App Router | 15.1 |
| UI | React + Tailwind + shadcn/ui (à init) | React 19, Tailwind 3.4 |
| Auth | Auth.js (next-auth v5 beta) | 5.0.0-beta.25 |
| ORM | Prisma + PostgreSQL | Prisma 6.1 |
| Validation | Zod + react-hook-form | Zod 3.24 |
| PDF | docxtemplater + puppeteer → **Gotenberg** (cible v1) | — |
| Email dev | Resend | 4.x |
| Email prod | **Brevo** (connecteur in-app) | — |
| Fichiers prod | **Cloudflare R2** (S3 API) | — |
| Fichiers dev | `storage/` local (`STORAGE_DRIVER=local`) | — |
| Signatures | **Documenso CE** self-hosted | — |
| Deploy | Docker Compose + Dokploy VPS | — |

**Produit :** monolithe single-tenant — 1 VPS = 1 client OF. Pas de multi-tenant, pas de Vercel prod.

---

## Critical Implementation Rules

### Architecture — 4 couches (obligatoire)

```
Page (src/app/) → Server Action (src/server/actions/) → Workflow (src/server/workflows/) → Service (src/server/services/)
```

- **Pages** : pas de Prisma direct ; pas de logique métier lourde
- **Actions** : `"use server"` en tête ; `requireAuth()` / `requireAdmin()` ; retour `{ ok, data? }` ou `{ ok: false, error: string }` — `error` en **français**
- **Workflows** : idempotence + `startRun` / `finishRun` ; pas d'import depuis `app/`
- **Services** : adapters techniques réutilisables ; pas de dépendance vers `app/`

**API routes** (`src/app/api/`) **uniquement** pour : Auth.js, cron, webhooks Documenso, health/version. **Pas de REST métier.**

### Language-Specific Rules (TypeScript)

- `strict: true` — pas de `any` sans justification
- Alias `@/*` → `./src/*` — pas d'imports relatifs profonds (`../../../`)
- Enums Prisma en SCREAMING_SNAKE français : `A_LANCER`, `EN_COURS`, `LANCEMENT`
- Champs Prisma camelCase : `formationTypeId`, `conventionGenerated`
- Async/await partout ; pas de `.then()` chains dans le code métier
- Erreurs UI = messages humains français ; détails techniques dans `AutomationRun.message`

### Framework-Specific Rules (Next.js + React)

- **Server Components par défaut** ; `"use client"` seulement si `useState`, événements, ou libs client-only
- Routing = structure dossiers `src/app/` — pas de React Router
- Routes admin cible : `/`, `/bibliotheque`, `/types`, `/parametres`, `/formations/[id]/{preparation,lancement,en-cours,cloture,documents}`
- Formulaires publics : `/f/[slug]/[formType]` — exemptés du middleware auth
- Middleware (`src/middleware.ts`) : laisser passer `/f/*`, `/api/auth/*`, `/api/cron/*`
- Après mutation : `revalidatePath()` sur les routes impactées
- UI : shadcn/ui pour Button, Card, Dialog, Sidebar, etc. — pas de réimplémentation custom
- Microcopy admin : **français professionnel** (pas de jargon SMTP/API côté opérateur)

### Data & Storage Rules

- BDD : toujours via `import { prisma } from "@/lib/prisma"`
- Requêtes réutilisables : `src/server/db/`
- **Config instance** : en migration vers `getInstanceConfig()` (merge `config/client.json` + `InstanceSettings` DB) — ne pas lire `client.json` directement dans les workflows
- **Stockage v1** : migrer vers `src/server/services/object-storage.ts` — **ne pas étendre** `storage.ts` (disque) pour du nouveau code prod
- Clés R2 : `formations/{formationId}/{phase}/{fichier}.pdf`
- Phases fixes : `avant-la-formation`, `pendant-la-formation`, `apres-la-formation`, `preuves-qualiopi`, `originaux`
- `STORAGE_DRIVER=local|r2` via env — abstraction unique, jamais `fs` direct en code nouveau (sauf `/tmp` Gotenberg)

### Workflow Rules

Chaque workflow (`launch`, `emargements`, `fin-formation`, `eval-froid`, `form-response`) :

1. Vérifier flags idempotence sur `Formation` avant d'agir
2. `startRun(workflow, formationId)` → `AutomationRun` RUNNING
3. Exécuter (échec par étape = message explicite, pas de skip silencieux)
4. `finishRun(id, SUCCESS|FAILED, message)`
5. Mettre à jour flags (`conventionGenerated`, `emargementsGenerated`, etc.)

Matrice destinataires (ne pas mélanger stagiaire/entreprise) → PRD §2.5 / `docs/WORKFLOWS.md`.

### Auth & Security

- Auth.js Credentials + JWT session
- Rôles v1 : `ADMIN` (tout) / `OPERATEUR` (formations, pas Types/Paramètres/users)
- MDP : bcryptjs, jamais en clair
- Secrets Brevo : chiffrés en DB (`APP_ENCRYPTION_KEY` en `.env` infra uniquement)
- Cron : header `Authorization: Bearer {CRON_SECRET}`
- Pas de secrets dans `AutomationRun.payload`

### Testing Rules

- Pas de framework de tests configuré en POC
- Smoke tests v1 : **MCP cursor-ide-browser** (checklist A4-7) — pas de Playwright sauf décision explicite
- Tests unitaires futurs : `*.test.ts` colocalisés dans `src/server/services/` et `src/server/workflows/`

### Code Quality & Style

| Élément | Convention |
|---------|------------|
| Fichiers composants | kebab-case : `formation-drive.tsx` |
| Fichiers services/workflows | kebab-case : `object-storage.ts` |
| Composants React | PascalCase |
| Fonctions | camelCase verbe+nom |
| `components/ui/` | shadcn uniquement — pas de logique métier |
| ESLint | `next lint` — respecter les warnings |

### Development Workflow

- Dev : `npm run dev` (Docker Postgres via `scripts/dev.sh`)
- DB : `npm run db:push` / `npm run db:migrate` ; seed `npm run db:seed`
- Prisma Studio : `npm run db:studio`
- **Ne pas committer** `.env` ni secrets
- Commits : uniquement sur demande explicite de Root
- Doc technique brownfield : `docs/` — ne pas dupliquer dans le code

### Critical Don't-Miss Rules

**Interdit :**

- Hardcoder noms/paths spécifiques à un client (Anne-Hélène, Charlie Agence, etc.)
- Chemins disque absolus ou `storage/` en prod
- Skip silencieux d'une étape workflow (email, PDF, signature)
- Dupliquer un envoi réussi sans flag idempotence explicite
- Créer des routes API REST pour remplacer des Server Actions
- Double sidebar (app + formation) — sidebar **contextuelle** unique (swap)
- Mélanger PJ stagiaire et entreprise dans le même email

**Portable core :** toute personnalisation client = `config/`, `templates/`, `InstanceSettings`, données — **jamais** de branche `if (client === 'charlie')` dans `src/`.

**Références obligatoires avant gros changements :**

- `planning-artifacts/architecture.md` — décisions archi
- `planning-artifacts/prds/prd-app-2026-06-10/prd.md` — FR-1 à FR-33
- `planning-artifacts/ux-designs/ux-app-2026-06-11/EXPERIENCE.md` — comportement UI

---

## Usage Guidelines

**Pour les agents IA :**

1. Lire ce fichier + `architecture.md` avant d'implémenter
2. En cas de doute, choisir l'option la plus restrictive (fiabilité > rapidité)
3. Respecter les 4 couches — ne pas raccourcir Page → Prisma
4. Mettre à jour ce fichier si un nouveau pattern non-évident émerge

**Pour Root :**

- Garder ce fichier **court** (< 200 lignes idéal)
- Réviser quand la stack change (R2 migration, shadcn init, rôles ADMIN)
- Supprimer les règles devenues évidentes après quelques sprints

**Prochaine étape BMad :** `/bmad-create-epics-and-stories`

_Last Updated: 2026-06-12_
