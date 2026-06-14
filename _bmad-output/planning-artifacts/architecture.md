---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - planning-artifacts/prds/prd-app-2026-06-10/prd.md
  - planning-artifacts/prds/prd-app-2026-06-10/review-finalize.md
  - planning-artifacts/prds/prd-app-2026-06-10/.decision-log.md
  - planning-artifacts/ux-designs/ux-app-2026-06-11/DESIGN.md
  - planning-artifacts/ux-designs/ux-app-2026-06-11/EXPERIENCE.md
  - planning-artifacts/ux-designs/ux-app-2026-06-11/reconcile-prd.md
  - planning-artifacts/ux-designs/ux-app-2026-06-11/.decision-log.md
  - planning-artifacts/research/technical-bloc-a-deployment-infrastructure-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-a4-onboarding-client-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-b-donnees-auth-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-c-pdf-templates-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-d-email-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-e-signatures-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-f-ux-frontend-research-2026-06-11.md
  - planning-artifacts/research/technical-bloc-g-qualiopi-conformite-research-2026-06-11.md
  - docs/ARCHITECTURE.md
  - docs/WORKFLOWS.md
  - docs/DATABASE.md
workflowType: architecture
project_name: app
user_name: Root
date: '2026-06-12'
langue: français
status: complete
lastStep: 8
completedAt: '2026-06-12'
brownfield_note: >-
  docs/ARCHITECTURE.md est une synthèse brownfield vivante (partiellement pré-décidée
  pendant la recherche PRD). Ce document BMAD la formalise et l'étend — pas une feuille blanche.
---

# Document de décisions d'architecture

_Ce document se construit étape par étape, en collaboration. Les sections s'ajoutent au fil des décisions._

## Analyse du contexte projet

### Vue d'ensemble des exigences

**Exigences fonctionnelles (FR) :**

Le PRD définit **33 exigences fonctionnelles** réparties en **8 domaines**. Tout vise un **tableau de bord admin** pour les organismes de formation — pas de portail de connexion stagiaire/entreprise en v1.

| Domaine | FR | Ce que l'architecture doit gérer |
|---------|-----|----------------------------------|
| Authentification & rôles | FR-1–5 | Connexion, protection des routes, 2 rôles ADMIN / OPERATEUR |
| Catalogue Types de formation | FR-6–12 | Modèles réutilisables + propagation selon le statut de la formation |
| Cycle de vie Formation | FR-13–16 | Création, statuts, slug public, bibliothèque de documents par phase |
| Émargements | FR-17–19 | **2 modes** : PDF par stagiaire OU signature digitale par séance |
| Workflow Lancement | FR-20–27 | Génération docs, emails distincts, signatures, preuves Qualiopi, relance, idempotence |
| Fin de formation & éval à froid | FR-28–29 | Emails de fin + cron sécurisé à M+2 |
| Formulaires publics | FR-30–31 | Routes `/f/{slug}/{formType}` sans login, pré-remplissage |
| Configuration instance | FR-32–33 | **Contrainte fondamentale** : config par client sans modifier le code source |

**Exigences non-fonctionnelles (qualité) :**

- **Fiabilité avant tout** : les échecs sont visibles, messages compréhensibles, relance possible — jamais de skip silencieux
- **Idempotence** : chaque workflow vérifie des flags + journal `AutomationRun`
- **Prêt pour audit Qualiopi** : arborescence R2 fixe, preuve PDF par envoi, export ZIP
- **Corps produit portable** : même code pour tous les clients, différences = configuration — Anne-Hélène sert de profil de référence, pas de limite produit
- **Une instance = un client** : un VPS par organisme de formation — pas de SaaS multi-tenant
- **Sécurité** : mots de passe hashés, secrets Brevo chiffrés, cron protégé par token
- **Signatures** : niveau SES (eIDAS) suffisant v1 via Documenso auto-hébergé
- **Accessibilité** : WCAG 2.1 AA
- **Langue** : interface et microcopy en français professionnel

**Échelle & complexité :**

- Domaine principal : **application web monolithique full-stack** (Next.js + PostgreSQL + stockage fichiers + services externes)
- Niveau de complexité : **élevé** pour un solo dev (nombreuses intégrations, conformité Qualiopi, migration POC)
- Sous-systèmes estimés : **~15** — auth, config instance, formations/types, moteur workflows, PDF, email, signatures, R2, navigateur documents, formulaires publics, cron, déploiement, APIs santé, preuves Qualiopi, shell admin (sidebar/thème)

### Contraintes techniques & dépendances

**Point de départ brownfield :** POC Next.js + Prisma + PostgreSQL existant, workflows en parité Make, fichiers sur disque local `storage/`. Le MVP impose **Cloudflare R2 en prod** — refonte de `storage.ts` acceptée et planifiée.

**Stack déjà verrouillée** (PRD + recherches blocs A–G) :

| Couche | Choix |
|--------|-------|
| Application | Monolithe Next.js (App Router, Server Actions) |
| Base de données | PostgreSQL via Prisma |
| Fichiers (prod) | Cloudflare R2 (API compatible S3) |
| Fichiers (dev) | Dossier local `storage/` ou bucket R2 de dev |
| Déploiement | Dokploy central → VPS client ; Docker Compose ; HTTPS via Traefik |
| Modèle commercial | Un repo Git par client ; mises à jour depuis qualiopi-core |
| PDF | Hybride : templates HTML → Gotenberg ; DOCX custom optionnel |
| Email (dev) | Resend + redirection `.env` |
| Email (prod) | Brevo uniquement, connecteur in-app |
| Signatures | Documenso CE auto-hébergé par instance |
| Interface | shadcn/ui + Tailwind, thème par instance |
| Tests | MCP browser en priorité (smoke tests) |

**Points encore ouverts** (à trancher dans ce document) :

- OQ-10 : stratégie de sync core → repos clients
- OQ-12 : organisation des buckets R2 (un bucket par client vs préfixes)
- OQ-6 : détail UX émargement signature digitale (écran En cours)
- Extensions schéma Prisma (rôles, FormationType, InstanceSettings, etc.)
- Ordre de migration POC → v1

### Préoccupations transverses

1. **Couche configuration instance** — tout workflow lit les Settings, pas de code spécifique Anne-Hélène
2. **Abstraction stockage R2** — même service en dev et prod, clés objet par formation/phase
3. **Pipeline documents** — catalogue HTML ou DOCX custom, branding instance, archivage R2
4. **Orchestration email** — templates, PJ depuis R2, suivi `EmailDelivery`, relance unitaire
5. **Moteur workflows** — déclenchement synchrone, idempotence, erreurs détaillées, journal `AutomationRun`
6. **Signatures asynchrones** — webhooks Documenso, état visible pour l'opérateur
7. **Autorisations** — ADMIN vs OPERATEUR sur routes, Server Actions et sidebar
8. **Propagation Formation Type** — règles métier quand un Type est modifié
9. **Preuves Qualiopi** — PDF de preuve après chaque envoi, export ZIP
10. **Observabilité MVP** — `/api/health` + `/api/version` (dashboard intégrateur en v2)

## Évaluation du point de départ (starter)

### Domaine technique principal

**Application web monolithique full-stack** — dashboard admin + formulaires publics, déployée en Docker Compose sur un VPS par client (pas serverless, pas SaaS multi-tenant).

### Préférences techniques (PRD, decision-log, brownfield)

| Préférence | Choix | Source |
|------------|-------|--------|
| Langage | TypeScript 5.x | POC `package.json` |
| Framework | Next.js App Router + Server Actions | Stack verrouillée |
| Interface | shadcn/ui + Tailwind CSS | UX + bloc F |
| ORM / BDD | Prisma 6 + PostgreSQL | POC + bloc B |
| Déploiement | Docker Compose sur VPS via Dokploy | Bloc A — pas Vercel |
| Fichiers | Cloudflare R2 (prod), `storage/` local (dev) | PRD §1.4 |
| Auth | Auth.js v5 (Credentials + JWT) | Bloc B |
| PDF / Email / Signatures | Gotenberg, Brevo, Documenso CE | Blocs C, D, E |

### Options évaluées

| Option | Version (juin 2026) | Verdict |
|--------|---------------------|---------|
| `create-next-app@latest` | Next.js 16.2.9 | Bon pour un **nouveau** repo — pas pour le corps produit |
| `shadcn@latest init -t next` | CLI v4 | Utile pour le **template repo client** (A4), plus tard |
| T3 Stack | — | Rejeté — tRPC inutile, workflows = Server Actions |
| Supabase starter | — | Rejeté — conflit Prisma + VPS self-hosted |
| **POC brownfield (`qualiopi-charlie`)** | Next 15.1, React 19, Prisma 6.1 | **Retenu** |

### Choix retenu : évolution incrémentale du POC

**Pourquoi :** le PRD part explicitement du POC existant (workflows Make-parité, schéma Prisma, PDF, Docker). Recréer from scratch = perte de logique métier sans gain architectural.

**Stratégie v1 :** refonte incrémentale — routes UX (sidebar contextuelle), extension Prisma, abstraction R2 — dans le monolithe actuel.

**Commandes brownfield (ce repo) :**

```bash
npx shadcn@latest init
npx shadcn@latest add sidebar sheet alert-dialog skeleton badge toast table checkbox select
# Upgrade Next.js optionnel plus tard
npx @next/codemod@canary upgrade latest
```

**Commandes template client (futur A4-8, après 1er deploy prod) :**

```bash
npx create-next-app@latest qualiopi-client-template --typescript --tailwind --eslint --app --src-dir
npx shadcn@latest init -t next
```

**Décisions déjà posées par le POC :**

- TypeScript + React 19 + Next.js 15.1 App Router
- Server Actions pour déclencher les workflows
- Tailwind 3.4 + composants Radix partiels (shadcn à formaliser)
- Structure `src/workflows/`, `src/services/`, `prisma/`, `templates/`, `config/client.json`
- Dev via `scripts/dev.sh` + Docker Postgres

**Note :** la priorité implémentation = faire évoluer ce repo, pas un `create-next-app`. Le template repo client est un livrable A4 séparé.

## Décisions d'architecture principales

### Analyse des priorités

**Décisions critiques (bloquent l'implémentation) :**

- Abstraction stockage R2 avec driver `local|r2`
- Extension schéma Prisma (rôles, FormationType, InstanceSettings, SignatureRequest, EmailDelivery)
- Server Actions comme couche workflow (pas de REST métier)
- Auth.js + garde ADMIN/OPERATEUR sur routes et actions
- Sync core → clients via remote `upstream` (OQ-10)

**Décisions importantes (façonnent l'architecture) :**

- 1 bucket R2 par client, préfixes `formations/` + `backups/` (OQ-12)
- Pipeline PDF hybride catalogue HTML + DOCX custom
- Documenso CE + webhooks asynchrones
- Connecteur Brevo chiffré en DB
- Shell UX shadcn avec sidebar contextuelle

**Reportées post-MVP :**

- Dashboard intégrateur Root (toutes instances)
- SSO / OAuth
- Rate limiting formulaires publics
- Upgrade Next.js 15 → 16 (optionnel pendant refonte)

### Architecture des données

| Décision | Choix | Justification |
|----------|-------|---------------|
| Base de données | PostgreSQL 16 via Prisma 6 | POC existant, relations métier complexes |
| Modélisation | Agrégat `Formation` + `FormationType` + `InstanceSettings` singleton | PRD FR-6–16, FR-32–33 |
| Validation | Zod dans Server Actions + contraintes Prisma | Cohérent avec POC (`formation-form.ts`) |
| Migrations | `prisma migrate dev` (dev), `prisma migrate deploy` (prod) | Traçabilité schéma |
| Stockage fichiers | Service `object-storage.ts`, `STORAGE_DRIVER=local\|r2` | Bloc A — dev sans R2 obligatoire |
| Clés objet R2 | `formations/{formationId}/{phase}/{fichier}` | Remplace `storagePath` absolu disque |
| Bucket R2 (OQ-12) | **1 bucket par client** (compte Cloudflare du client) ; versioning activé ; lifecycle 30j sur `backups/` | Isolation client, simplicité onboarding A4 |
| Snapshot Formation Type | Champ `typeSnapshot Json?` sur `Formation` | Évite qu'un changement Type casse une formation en cours |

### Authentification & sécurité

| Décision | Choix | Justification |
|----------|-------|---------------|
| Authentification | Auth.js v5 Credentials + JWT | Bloc B locked |
| Autorisation | ADMIN (tout) / OPERATEUR (formations) — middleware + garde Server Actions + sidebar | FR-4, FR-5 |
| Invitation users | Email Brevo → `/auth/activer` | Bloc B |
| Secrets Brevo | Chiffrés AES en DB, clé `APP_ENCRYPTION_KEY` en `.env` infra | Bloc D |
| Cron | `Authorization: Bearer {CRON_SECRET}` sur `/api/cron/*` | POC existant |
| Formulaires publics | Slug unique, pas d'auth — pas de rate-limit v1 | FR-30, simplicité MVP |

### API & communication

| Décision | Choix | Justification |
|----------|-------|---------------|
| Workflows métier | **Server Actions** (`src/server/actions/`) | Synchrone depuis UI, pattern POC |
| Routes API | Auth.js, cron, webhooks Documenso, `/api/health`, `/api/version` uniquement | Pas de REST/GraphQL métier |
| Erreurs UI | Messages humains en français | UX spec Voice & Tone |
| Erreurs techniques | Détail dans `AutomationRun.message` + logs serveur | Debug sans exposer SMTP au client |
| Webhooks signatures | `POST /api/webhooks/documenso` — idempotent par `externalId` | Bloc E |

### Architecture frontend

| Décision | Choix | Justification |
|----------|-------|---------------|
| Rendu | Server Components par défaut ; `"use client"` minimal | Bloc F |
| État client | Sidebar swap, dialogs, sélection fichiers Bibliothèque uniquement | EXPERIENCE.md |
| Routing | `/`, `/bibliotheque`, `/types`, `/parametres`, `/formations/[id]/{overview,preparation,lancement,en-cours,cloture,documents}` | UX locked |
| UI | shadcn/ui formalisé (`npx shadcn@latest init` + composants requis) | DESIGN.md |
| Thème | CSS variables depuis `InstanceSettings.primaryColor` | FR-33 branding |
| Cache | Pas de cache agressif v1 — données fraîches pour opérateur | Fiabilité > perf |

### Infrastructure & déploiement

| Décision | Choix | Justification |
|----------|-------|---------------|
| Hébergement | VPS client, Docker Compose, **pas Vercel** | Bloc A locked |
| Orchestration | Dokploy central Root → remote server VPS client | Bloc A |
| HTTPS | Traefik via Dokploy | Bloc A2 |
| CI/CD | Dokploy déploie sur push `main` du repo client | A4 |
| Sync core (OQ-10) | Repo `qualiopi-core` upstream ; fork/clone client + remote `upstream` ; merge périodique ; tags pour releases | Bloc A locked |
| Sauvegardes | `pg_dump` quotidien → R2 `backups/` ; fichiers = versioning R2 natif | Bloc A3 |
| Monitoring MVP | `/api/health` + `/api/version` | Decision-log |
| Scaling | Vertical VPS client — pas d'horizontal v1 | Single-tenant |

### Impact & séquence d'implémentation

**Ordre recommandé :**

1. `object-storage.ts` + migration Prisma (rôles, InstanceSettings)
2. Auth rôles + invitation + Paramètres shell
3. Routes UX + sidebar shadcn contextuelle
4. FormationType + propagation + snapshot
5. Refonte workflows sur R2 (launch → emargements → fin → eval-froid)
6. Connecteur Brevo + `EmailDelivery` + retry UI
7. Documenso CE + `SignatureRequest` + webhooks
8. Bibliothèque/ZIP + health APIs
9. Procédure bootstrap A4 + template repo client

**Dépendances croisées :**

- Workflows dépendent de R2 + InstanceSettings + PDF pipeline
- Emails dépendent de R2 (PJ) + Brevo connector
- Signatures dépendent de Brevo (liens) + Documenso + R2 (PDF signés)
- UX Lancement dépend de `EmailDelivery` + `SignatureRequest` pour tuiles statut

## Patterns d'implémentation & règles de cohérence

_Objectif : que tous les agents IA (et humains) codent de la même façon._

### Points de conflit identifiés

8 zones où des agents pourraient diverger sans règles explicites : nommage BDD, structure dossiers, accès fichiers, erreurs workflow, config instance, auth actions, clés R2, routes UX.

### Nommage

**Base de données (Prisma) :**

- Modèles : PascalCase singulier — `Formation`, `FormationType`, `EmailDelivery`
- Champs : camelCase — `formationTypeId`, `conventionGenerated`
- Enums métier : SCREAMING_SNAKE français — `A_LANCER`, `EN_COURS`, `LANCEMENT`
- Relations : nom du modèle au singulier — `formationType FormationType?`

**Code TypeScript :**

- Fichiers composants : kebab-case — `formation-drive.tsx`, `app-sidebar.tsx`
- Fichiers services/workflows : kebab-case — `object-storage.ts`, `launch.ts`
- Composants React : PascalCase — `FormationDrive`, `AppSidebar`
- Fonctions : camelCase verbe+nom — `getInstanceConfig()`, `launchFormation()`
- Server Actions : exportées depuis `src/server/actions/{domaine}.ts` avec `"use server"` en tête de fichier

**Routes & stockage :**

- Routes App Router : segments kebab-case français — `/formations/[id]/en-cours`
- Clés R2 : `formations/{formationId}/{phase}/{nom-fichier}.pdf`
- Phases fixes : `avant-la-formation`, `pendant-la-formation`, `apres-la-formation`, `preuves-qualiopi`, `originaux`

### Structure

**Organisation source (cible v1) :**

```
src/
  app/
    (dashboard)/          # layout admin + sidebar
      page.tsx            # liste formations
      bibliotheque/
      types/              # ADMIN
      parametres/         # ADMIN
      formations/
        new/
        [id]/
          page.tsx        # vue d'ensemble
          preparation/
          lancement/
          en-cours/
          cloture/
          documents/
    f/[slug]/[formType]/  # formulaires publics
    login/
    auth/activer/         # à créer
    auth/reinitialiser/   # à créer
    api/
      auth/[...nextauth]/
      cron/eval-a-froid/
      webhooks/documenso/ # à créer
      health/             # à créer
      version/            # à créer
  server/
    actions/              # Server Actions par domaine
    workflows/            # orchestration (launch, emargements…)
    services/             # adapters (mail, pdf, object-storage, audit)
    db/                   # requêtes Prisma réutilisables
  components/
    ui/                   # shadcn uniquement — pas de logique métier
    app-sidebar.tsx       # sidebar contextuelle
    formation-*.tsx       # composants métier formation
    bibliotheque-*.tsx    # à créer
  lib/
    auth.ts, prisma.ts, config.ts, utils.ts
    instance-config.ts    # getInstanceConfig() — à créer
    permissions.ts        # requireAdmin() — à créer
```

**Tests (à introduire) :**

- Unitaires : `*.test.ts` colocalisés dans `src/server/services/` et `src/server/workflows/`
- E2E smoke : MCP browser + checklist A4-7 (pas de Playwright v1 sauf décision ultérieure)

### Formats

- **Réponses Server Actions** : `{ ok: true, data? }` ou `{ ok: false, error: string }` — messages `error` en français
- **AutomationRun.payload** : JSON camelCase, pas de données sensibles (pas de MDP, pas de clés API)
- **Dates DB** : `DateTime` ISO ; affichage via `date-fns` locale `fr`
- **InstanceSettings** : champs nullable = override ; `getInstanceConfig()` merge `client.json` puis DB

### Processus

**Workflows (obligatoire) :**

```typescript
// 1. Vérifier idempotence (flags Formation)
// 2. startRun(workflow, formationId)
// 3. Travail (PDF, email, R2…)
// 4. finishRun(runId, SUCCESS|FAILED, message)
// 5. revalidatePath() si impact UI
```

**Config instance :** jamais lire `client.json` directement dans un workflow — toujours `getInstanceConfig()`.

**Stockage :** jamais `fs.readFile`/`writeFile` en prod — toujours `object-storage` service (`STORAGE_DRIVER`).

**Auth Server Actions :** `requireAuth()` minimum ; `requireAdmin()` pour Types, Paramètres, users.

### Règles obligatoires pour les agents IA

- Respecter la structure `server/workflows` vs `server/services` vs `server/actions`
- Ne pas créer de routes API REST pour la logique métier — Server Actions
- Ne pas hardcoder de chemins client (Anne-Hélène, Charlie, etc.)
- Ne pas skipper une étape workflow sans flag idempotence explicite
- Logger chaque automation via `AutomationRun`
- Microcopy UI en français professionnel (pas de jargon technique SMTP)
- Utiliser shadcn/ui pour l'UI — pas de composants custom qui dupliquent Button/Card/Dialog

### Exemples

**✅ Bon :**

```typescript
const config = await getInstanceConfig();
const key = `formations/${formation.id}/avant-la-formation/convention.pdf`;
await objectStorage.put(key, pdfBuffer);
```

**❌ Anti-pattern :**

```typescript
const path = `/home/freem/storage/${formation.storagePath}/convention.pdf`;
fs.writeFileSync(path, pdfBuffer); // interdit en prod
```

## Structure projet & frontières

### Arborescence cible v1

Légende : `(existant)` POC actuel · `(à créer)` MVP v1

```
qualiopi-charlie/                          # = qualiopi-core (repo upstream)
├── package.json
├── docker-compose.yml                     # dev
├── docker-compose.prod.yml                # prod + gotenberg + documenso
├── .env.example
├── config/
│   ├── client.json.example
│   └── client.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.mjs
├── templates/catalog/                     # (à créer) HTML core
├── storage/                               # DEV ONLY
├── docs/
├── scripts/
└── src/
    ├── middleware.ts
    ├── app/
    │   ├── login/
    │   ├── auth/activer/                  # (à créer)
    │   ├── auth/reinitialiser/            # (à créer)
    │   ├── (dashboard)/
    │   │   ├── page.tsx                   # liste formations
    │   │   ├── bibliotheque/              # (à créer)
    │   │   ├── types/                     # (à créer) ADMIN
    │   │   ├── parametres/                # (à créer) ADMIN
    │   │   └── formations/[id]/
    │   │       ├── page.tsx               # vue d'ensemble
    │   │       ├── preparation/           # (à créer)
    │   │       ├── lancement/             # (à créer)
    │   │       ├── en-cours/              # (à créer)
    │   │       ├── cloture/               # (à créer)
    │   │       └── documents/             # (à créer)
    │   ├── f/[slug]/[formType]/
    │   └── api/
    │       ├── auth/[...nextauth]/
    │       ├── cron/eval-a-froid/
    │       ├── webhooks/documenso/        # (à créer)
    │       ├── health/                    # (à créer)
    │       └── version/                   # (à créer)
    ├── server/
    │   ├── actions/                       # Server Actions (= Controllers)
    │   ├── workflows/                     # logique métier (= Services/Jobs)
    │   ├── services/                      # adapters techniques
    │   └── db/                            # requêtes Prisma réutilisables
    ├── components/
    │   ├── ui/                            # shadcn
    │   └── *.tsx                          # composants métier
    └── lib/                               # auth, prisma, config, permissions
```

### Correspondances stack (React + Laravel → Next.js)

Guide pour l'équipe (Root : stack de référence React + API Laravel).

| Laravel + React | Next.js (ce projet) | Rôle |
|-----------------|---------------------|------|
| `routes/web.php` + pages React | `src/app/**/page.tsx` | URLs + pages |
| `routes/api.php` | `src/app/api/**/route.ts` | API externe uniquement (cron, webhooks, auth) |
| Controllers | `src/server/actions/*.ts` | Point d'entrée utilisateur (`"use server"`) |
| Services / Jobs | `src/server/workflows/*.ts` | Orchestration métier lourde |
| Mail, Storage, PDF classes | `src/server/services/*.ts` | Briques techniques |
| Eloquent Models | `prisma/schema.prisma` | Modèle de données |
| Migrations | `prisma/migrations/` | Évolution schéma |
| `config/*.php` | `config/client.json` + `InstanceSettings` | Config instance |
| Middleware `auth` | `src/middleware.ts` | Protection routes |
| `Storage::disk('s3')` | `object-storage.ts` → R2 | Fichiers prod |
| `fetch('/api/...')` depuis React | Appel direct Server Action | Pas d'API REST métier |
| Blade layout | `layout.tsx` | Cadre commun (sidebar) |
| Vite build React | `next build` | Build intégré |

**4 couches à retenir :** Page (`app/`) → Action (`actions/`) → Workflow (`workflows/`) → Service (`services/`).

### Frontières architecturales

**API (externe uniquement) :** Auth.js, cron, webhooks Documenso, health/version.

**Composants :** Pages = Server Components par défaut ; `"use client"` seulement pour interactivité (sidebar, dialogs, sélection fichiers).

**Services :** Aucune dépendance vers `app/` — réutilisables par workflows et actions.

**Données :** Prisma exclusivement via `lib/prisma.ts` ou `server/db/` — jamais dans les composants UI.

### Mapping FR → structure

| Domaine | Emplacement |
|---------|-------------|
| FR-1–5 Auth | `lib/auth.ts`, `middleware.ts`, `app/login`, `app/auth/*`, `actions/users.ts` |
| FR-6–12 Types | `app/types/`, `actions/formation-types.ts`, Prisma |
| FR-13–16 Formations | `app/formations/`, `actions/formations.ts` |
| FR-17–19 Émargements | `app/.../en-cours/`, `workflows/emargements.ts` |
| FR-20–27 Lancement | `app/.../lancement/`, `workflows/launch.ts` |
| FR-28–29 Fin & froid | `app/.../cloture/`, `workflows/fin-formation.ts`, `api/cron/` |
| FR-30–31 Formulaires | `app/f/`, `workflows/form-response.ts` |
| FR-32–33 Settings | `config/client.json`, `app/parametres/`, Prisma `InstanceSettings` |

### Flux de données

```
Page React → Server Action → Workflow → Service → Prisma / R2 / Brevo / Documenso / Gotenberg
```

Seuls les **webhooks** et le **cron** entrent par `app/api/` sans passer par une Action utilisateur.

### Intégrations externes

| Service | Point d'intégration |
|---------|---------------------|
| PostgreSQL | Prisma via `DATABASE_URL` |
| Cloudflare R2 | `services/object-storage.ts` |
| Brevo | `services/mail.ts` + `services/brevo-connector.ts` |
| Gotenberg | `services/pdf.ts` (conteneur Docker prod) |
| Documenso CE | `services/documenso.ts` + `api/webhooks/documenso` |
| Resend | `services/mail.ts` (dev uniquement) |

## Résultats de validation

### Cohérence — validé

- Stack monolithique cohérente (Next.js + Prisma + R2 + Brevo + Documenso + Dokploy)
- Pas de double pattern API REST + Server Actions pour le métier
- Patterns d'implémentation alignés avec la structure cible et le guide Laravel→Next.js

### Couverture des exigences — validé

- 33 FR couverts par des emplacements fichiers/dossiers explicites
- NFR fiabilité, idempotence, Qualiopi, single-tenant, sécurité documentés
- 8 blocs de recherche technique intégrés comme décisions verrouillées

### Prêt pour l'implémentation — validé avec écarts mineurs

**Écarts mineurs (non bloquants) :**

- Framework de tests unitaires non défini (smoke MCP browser en v1)
- OQ-6 : détail UX émargement digital (écran En cours) à préciser en dev
- `components.json` shadcn à initialiser (première story)
- `project-context.md` non encore généré

**Statut global :** PRÊT AVEC ÉCARTS MINEURS

**Niveau de confiance :** élevé sur la direction architecturale

### Checklist de complétude

**Analyse des exigences**

- [x] Contexte projet analysé
- [x] Échelle et complexité évaluées
- [x] Contraintes techniques identifiées
- [x] Préoccupations transverses cartographiées

**Décisions architecturales**

- [x] Décisions critiques documentées
- [x] Stack technique spécifiée
- [x] Patterns d'intégration définis
- [x] Considérations performance (pas de cache agressif v1)

**Patterns d'implémentation**

- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication (Server Actions) spécifiés
- [x] Patterns de processus (workflows, idempotence) documentés

**Structure projet**

- [x] Arborescence complète définie
- [x] Frontières composants établies
- [x] Points d'intégration mappés
- [x] Mapping FR → structure complet

### Handoff implémentation

**Guidelines pour les agents IA :**

- Suivre ce document comme source de vérité architecturale
- Respecter les 4 couches : Page → Action → Workflow → Service
- Ne jamais contourner `object-storage` ni `getInstanceConfig()`
- Document en français ; code et identifiants techniques en anglais/camelCase

**Première priorité d'implémentation :**

1. `npx shadcn@latest init` + composants sidebar requis
2. Créer `object-storage.ts` + extension schéma Prisma (InstanceSettings, rôles)
3. Migrer `launch.ts` vers R2 comme preuve de concept
4. Puis enchaîner selon la séquence documentée en § Décisions d'architecture
