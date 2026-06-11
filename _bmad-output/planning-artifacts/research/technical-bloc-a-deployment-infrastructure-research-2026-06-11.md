---
stepsCompleted: [1]
inputDocuments:
  - docs/DEPLOYMENT.md
  - docs/ARCHITECTURE.md
  - docker-compose.yml
  - docker-compose.prod.yml
  - _bmad-output/planning-artifacts/prds/prd-app-2026-06-10/prd.md
workflowType: research
lastStep: 1
research_type: technical
research_topic: Bloc A — Infrastructure & déploiement instance client
research_goals: Valider orchestration VPS, HTTPS, sauvegardes et bootstrap config pour un modèle un repo Git par client, corps produit portable
user_name: Root
date: 2026-06-11
web_research_enabled: true
source_verification: true
---

# Research Report: technical — Bloc A

**Date:** 2026-06-11  
**Author:** Root  
**Research Type:** technical  

---

## Research Overview

Recherche technique du **Bloc A** (infrastructure & déploiement) pour le MVP Qualiopi Charlie, dans le cadre :

- **Un repo Git par client** — Root installe le corps produit + configuration dans ce repo
- **Un VPS par client** — Docker Compose (app, PostgreSQL, Gotenberg)
- **Dashboard intégrateur Root** — noté pour v2+, hors scope MVP mais à prévoir (health endpoint, version)

**Méthode :** état brownfield + sources web (Dokploy, Caddy, pg_dump, stratégies Git multi-clients).

---

## A0 — Modèle cible (confirmé stakeholder 2026-06-11)

```
qualiopi-core (repo upstream, privé Root)
        │
        │ clone / fork + config client
        ▼
qualiopi-client-anne-helene   qualiopi-client-xyz   …
  ├── src/ (identique)          ├── src/
  ├── config/client.json        ├── config/client.json  ← spécifique
  ├── templates/                ├── templates/          ← spécifique
  ├── storage/ (données)        ├── storage/
  ├── .env (secrets)            ├── .env
  └── docker compose            └── VPS client
```

**Principe :** la personnalisation vit dans `config/`, `templates/`, `.env`, `storage/` — pas dans des branches de code métier par client.

**Sync core → clients (OQ-10) :** remote `upstream` + branche `main` miroir du core ; déploiement depuis `main` ou tag de release. Merges périodiques `upstream/main` → repo client. Si un client n'a **aucune** modification `src/`, le merge est trivial.

**Préparation dashboard intégrateur (v2+) :** exposer dès le MVP :
- `GET /api/health` (app + DB + gotenberg)
- `GET /api/version` ou header `X-App-Version` (git SHA / semver du build)
- Optionnel : cron heartbeat vers URL Root (opt-in par client)

---

## A1 — Orchestration VPS

### État brownfield

Le projet fournit déjà :
- `docker-compose.yml` (dev) + `docker-compose.prod.yml` (build `runner`, pas de bind-mount code)
- `scripts/docker-up.sh`, `docker-seed.sh`, `docker-entrypoint.sh`
- Stack : **app** (Next.js standalone), **postgres**, **gotenberg**, **adminer**

### Options évaluées

| Option | Description | Pour | Contre |
|--------|-------------|------|--------|
| **A — Docker Compose manuel** | SSH + `git pull` + `docker compose -f … up -d --build` | Contrôle total, zéro dépendance PaaS, correspond au code actuel | Pas d'UI, HTTPS à configurer à part, pas de backups intégrés |
| **B — Dokploy** | PaaS self-hosted, support natif Docker Compose, Traefik SSL, backups DB ([dokploy.com](https://dokploy.com/), [docs compose](https://dokploy-dokploy.mintlify.app/deployment/docker-compose)) | UI déploiement, webhooks Git, notifications, backups S3 | Couche supplémentaire, Traefik en conflit potentiel si Caddy aussi, courbe d'apprentissage |
| **C — Coolify** | Alternative PaaS (comparé à Dokploy en 2026) | Similaire à Dokploy, communauté active | Même trade-offs |

### Décision validée (Root, 2026-06-11) — **LOCKED**

| Contexte | Outil |
|----------|-------|
| **Dev local** (pas de serveur pour l'instant) | Docker Compose manuel — `scripts/docker-up.sh` |
| **MVP production (VPS client)** | **Dokploy** — 1 projet Dokploy par client |

### Modèle gestion : central + main passable au client — **LOCKED**

Root veut **tout gérer** mais pouvoir **donner la main** au client facilement.

**Recommandation : Dokploy central + remote servers**

```
┌─────────────────────────────────────┐
│  Dokploy central (VPS Root)         │
│  ├── Projet « client-anne-helene »  │
│  ├── Projet « client-xyz »          │
│  └── Remote servers ──────────────┼──► VPS client A
│      (SSH vers chaque VPS)        ├──► VPS client B
└─────────────────────────────────────┘
```

| Qui | Rôle Dokploy | Peut faire |
|-----|--------------|------------|
| **Root** | Owner / Admin org | Tout : deploy, env, domaines, backups, tous les projets |
| **Client (optionnel)** | Member invité **sur son projet uniquement** | Voir logs, redeploy, consulter — permissions configurables ([permissions](https://docs.dokploy.com/docs/core/permissions)) |
| **Passation complète** | Promouvoir client Admin **ou** installer Dokploy sur son VPS | Client autonome si souhaité |

Avantages :
- Une seule UI pour toi (aligné dashboard intégrateur v2)
- Le client n'est pas obligé d'utiliser Dokploy — il utilise l'app Qualiopi
- Si le client veut la main : invitation Member ou Admin sur son projet

**Workflow type :**
1. Repo Git client connecté au projet Dokploy
2. Remote server = VPS du client
3. Variables d'env + domaine + Traefik SSL dans Dokploy
4. Webhook Git → redeploy

**Dev local inchangé.**

**Confidence :** Haute.

---

## A2 — Reverse proxy & HTTPS

### Besoin

Chaque instance client a un domaine dédié (ex. `qualiopi.agence-charlie.fr`). L'app écoute sur **3000** ; il faut TLS + redirection HTTP→HTTPS.

### Options

| Option | Intégration | SSL | Complexité |
|--------|-------------|-----|------------|
| **Caddy** (recommandé) | Conteneur ou binaire hôte ; `reverse_proxy app:3000` | Let's Encrypt automatique ([Caddy docs](https://caddyserver.com/docs/automatic-https)) | Très faible — 3–5 lignes Caddyfile |
| **Traefik** | Inclus si Dokploy | Automatique via labels | Faible dans Dokploy, plus verbeux seul |
| **Nginx + Certbot** | Classique | Manuel + cron renewal | Moyenne |

### Décision validée (Root délègue, 2026-06-11) — **LOCKED**

**Traefik via Dokploy** — pas de Caddy séparé.

Dokploy installe et configure Traefik sur chaque *deploy server*. Tu ajoutes le domaine dans l'UI du service Compose → certificat Let's Encrypt automatique, HTTP→HTTPS.

En dev local : pas de reverse proxy nécessaire (`localhost:3000`).

**Confidence :** Haute.

---

## A3 — Sauvegardes

### Données à protéger

| Donnée | Emplacement | Méthode |
|--------|-------------|---------|
| PostgreSQL | Volume Docker `postgres_data` | `pg_dump -Fc` via `docker exec` ([PostgreSQL backup best practice](https://oneuptime.com/blog/post/2026-01-25-postgresql-automated-backups-pg-dump/view)) |
| Fichiers générés | `storage/` bind-mount | `rsync` ou `tar` |
| Config | `config/`, `templates/`, `.env` | Git (templates/config versionnés) + `.env` hors Git (backup chiffré séparé) |

### Règle 3-2-1 (adaptée petit VPS)

1. **Copie locale** sur le VPS (`/var/backups/qualiopi/`)
2. **Copie distante** — rsync vers serveur Root, S3 compatible, ou autre VPS
3. **Test de restore** trimestriel (obligatoire — un backup non testé n'existe pas)

### Script type (à ajouter au repo core)

```bash
# Quotidien via cron — exemple
docker exec qualiopi-postgres pg_dump -U qualiopi -Fc qualiopi \
  > /var/backups/qualiopi/db-$(date +%F).dump
tar czf /var/backups/qualiopi/storage-$(date +%F).tar.gz /opt/qualiopi-client/storage/
# Rotation : garder 7 jours local, 30 jours distant
```

**Ne pas** sauvegarder le volume PostgreSQL brut à chaud (risque corruption) — toujours `pg_dump`.

### Décisions validées (Root, 2026-06-11)

| Point | Décision |
|-------|----------|
| Fréquence | **Quotidien** |
| DB | **pg_dump** via Dokploy |
| Fichiers `storage/` | **Archive quotidienne** (tâche planifiée Dokploy) |
| Où | **Compte cloud du client** — pas hébergé chez Root |
| Accès | Client a accès au service (dashboard + restore) ; Root configure |
| Stockage prod MVP | ~~`storage/` local~~ → **Cloudflare R2 primaire** (locked Root 2026-06-11) |

#### Ce qu'il faut sauvegarder (en clair)

| Quoi | Contenu | Criticité |
|------|---------|-----------|
| **Base PostgreSQL** | Formations, stagiaires, statuts, journaux `AutomationRun` | **Critique** — sans ça, tout est perdu |
| **Dossier `storage/`** | PDF générés, preuves Qualiopi, devis uploadés | **Critique** — preuves audit |
| **`templates/`** | DOCX du client | Moyenne — souvent dans Git |
| **`config/client.json`** | Identité org | Faible — dans Git |
| **`.env`** | Secrets (email, auth, cron) | Moyenne — **pas dans Git** ; à noter dans un coffre (1Password, etc.) |
| **Le code (`src/`)** | Application | Faible — dans Git core |

#### Ce que Dokploy peut faire nativement

Dokploy propose des backups automatisés vers **S3** (ou compatible : R2, B2, MinIO…) :
- **PostgreSQL** : `pg_dump` compressé, planifiable en cron ([database backups](https://dokploy-dokploy.mintlify.app/databases/backups))
- **Volumes Compose** : archive tar.gz — **uniquement volumes nommés Docker**, pas les bind-mounts

**Point d'attention projet actuel :** `storage/`, `templates/`, `config/` sont des **bind-mounts** (fichiers dans le repo). C'est bien pour la config par client, mais les backups Dokploy « volume » ne les couvrent pas automatiquement. Il faudra **en plus** :
- soit une **tâche planifiée Dokploy** qui archive `storage/` (script dans le conteneur ou sur l'hôte),
- soit s'appuyer sur le **Git du repo client** pour templates/config + backup séparé de `storage/`.

#### Modèle retenu : backups sur compte client

```
VPS client (app + storage/ local)
        │
        │ chaque nuit (Dokploy)
        ▼
Bucket « qualiopi-backups » sur compte CLOUD DU CLIENT
  ├── db/2026-06-11.dump.gz
  └── storage/2026-06-11.tar.gz
        │
        ▼
Client : accès dashboard Cloudflare / Scaleway
Root   : configure Dokploy, peut restaurer si support
```

**Setup onboarding :**
1. Client crée un compte **Cloudflare** (gratuit) ou **Scaleway** (EU/FR)
2. Root crée le bucket + clés API dans ce compte (avec le client)
3. Root configure la destination S3 dans Dokploy
4. Root transmet au client : login cloud + doc « comment télécharger une backup »

#### Analyse : `storage/` local vs object storage primaire

| Approche | Fiabilité | Prix | Complexité code | Verdict MVP |
|----------|-----------|------|-----------------|-------------|
| **`storage/` local** (POC actuel) | Bonne si backups OK | Inclus VPS | Zéro | ❌ **Dev local seulement** |
| **R2 primaire** (décision MVP) | Très haute (11×9) | ~0 € petit volume | Refonte `storage` service + workflows | ✅ **Retenu** |
| Hybride local + sync | Excellente | Quasi gratuit | Moyenne | ❌ Non retenu |

**Décision Root (2026-06-11) :** le POC est jetable ; toute l'architecture sera reprise → **R2 comme stockage primaire** dès le produit v1, pas seulement pour les backups.

**Impacts code (à traiter en archi / epics) :**
- Nouveau module `src/server/services/object-storage.ts` (SDK S3 → R2)
- Remplacer `storagePath` / chemins absolus par **clés d'objets** (Prisma : `storagePrefix` ou clés par fichier)
- Workflows `launch`, `emargements`, `fin-formation`, `form-response` : écriture/lecture via abstraction
- Drive / bibliothèque : `ListObjectsV2` au lieu de `fs.readdir`
- ZIP export : stream depuis R2
- Dev : driver `local` ou bucket R2 de dev (env `STORAGE_DRIVER=local|r2`)
- Gotenberg : toujours besoin de fichiers temporaires locaux (/tmp) pour conversion DOCX→PDF — upload résultat vers R2

**Backups fichiers simplifiés :** plus d'archive `tar storage/` — R2 versioning + lifecycle suffisent ; backup critique = surtout **PostgreSQL**.

#### Estimation de coût (par client, par mois)

Hypothèse réaliste Qualiopi : **5 Go backups** (DB + PDFs), rétention 30 jours ≈ 30–50 Go stockés cumulés.

| Provider | Prix stockage | Free tier | Coût estimé |
|----------|---------------|-----------|-------------|
| **[Cloudflare R2](https://developers.cloudflare.com/r2/pricing/)** | 0,015 $/Go | **10 Go gratuits** | **0 €** (petit client) → ~0,60 €/mois à 50 Go |
| **[Backblaze B2](https://www.backblaze.com/cloud-storage/pricing)** | 0,006 $/Go (~6 $/To) | 10 Go gratuits | **~0,30 €/mois** à 50 Go |
| **[Scaleway Object Storage](https://www.scaleway.com/fr/tarifs/storage/)** (EU/FR) | 0,0075 €/Go (One Zone) | 750 Go×90j trial | **~0,40 €/mois** à 50 Go |

Egress (télécharger une backup) : R2 = gratuit ; Scaleway = 75 Go/mois gratuits.

**Provider backup :** **Cloudflare R2** — locked (Root, 2026-06-11). **Scaleway** en alternative si exigence FR/UE client.

#### Rétention proposée

| Backup | Rétention locale VPS | Rétention cloud |
|--------|---------------------|-----------------|
| DB dump | 3 jours (optionnel) | **30 jours** (lifecycle rule) |
| storage/ archive | — | **30 jours** |

**Test restore :** 1×/trimestre sur instance de test (procédure à documenter).

**Confidence :** Haute.

---

## A4 — Bootstrap instance (= « installer un nouveau client »)

### En clair

Le **bootstrap**, ce n'est pas une feature de l'app. C'est **ta procédure** pour mettre en ligne un nouveau client la première fois — comme installer WordPress sur un hébergement, mais pour Qualiopi Charlie.

**Aujourd'hui en local**, une partie existe déjà : `docker-up.sh` copie `.env.example` → `.env` et `config/client.json.example` → `config/client.json`.

**En prod Dokploy**, l'équivalent sera :
1. Créer le **repo Git client** (fork du core + ses templates)
2. Créer le **projet Dokploy** « client-anne-helene »
3. Connecter le repo, pointer vers `docker-compose.yml` + override prod
4. Renseigner les **variables d'environnement** dans Dokploy (secrets)
5. Attacher le **domaine** → Traefik gère le HTTPS
6. Premier deploy → lancer le **seed** (compte admin)
7. Se connecter à l'app → finir la config dans **Paramètres** (FR-33)

### Checklist onboarding (brouillon)

| # | Toi (Root) | Résultat |
|---|------------|----------|
| 1 | Créer repo Git client depuis le core | `qualiopi-client-xxx` |
| 2 | Remplir `config/client.json` + `templates/` du client | Identité + docs DOCX |
| 3 | Louer / accéder au VPS client | Serveur prêt |
| 4 | Dokploy : projet + Compose + env vars + domaine | App en ligne HTTPS |
| 5 | Seed admin + réunion client | Anne-Hélène peut se connecter |
| 6 | Paramètres in-app (règles métier, branding) | Instance configurée |

### À formaliser plus tard

- Guide `docs/ONBOARDING-CLIENT.md` (pas urgent — premier vrai deploy Dokploy)
- Optionnel : `scripts/bootstrap-instance.sh` pour le dev local

**Objectif Root :** le plus simple possible, qui marche à tous les coups.

**Livrables prévus (core repo) :**
1. `docs/ONBOARDING-CLIENT.md` — checklist 1 page (au 1er deploy réel)
2. Template repo GitHub « qualiopi-client-template » (fork en 1 clic)
3. Variables d'env documentées pour copier-coller dans Dokploy
4. Script seed post-deploy

**Décision :** ACTIVE — guide au 1er deploy ; le concept est validé.

**Confidence :** Haute sur le concept ; détail Dokploy à tester sur serveur.

---

## Synthèse — Décisions

| ID | Décision | Statut |
|----|----------|--------|
| A0 | Un repo Git par client ; sync upstream depuis core | ✅ Locked |
| A1 | Dev local = Compose manuel ; **MVP prod = Dokploy** (1 projet/client) | ✅ Locked |
| A2 | **Traefik via Dokploy** (pas Caddy) | ✅ Locked |
| A1b | Dokploy **central** + remote servers ; client = Member optionnel | ✅ Locked |
| A3 | R2 compte client ; **stockage primaire** + pg_dump quotidien ; versioning R2 pour fichiers | ✅ Locked |
| A4 | Bootstrap simple ; `docs/ONBOARDING-CLIENT.md` + template repo post 1er deploy | ✅ Locked |
| A+ | `/api/health` + `/api/version` dans scope MVP | ✅ Locked |

---

## Sources

- [Dokploy — Self-hosted PaaS](https://dokploy.com/self-hosted-paas)
- [Dokploy — Docker Compose deployments](https://dokploy-dokploy.mintlify.app/deployment/docker-compose)
- [Dokploy GitHub](https://github.com/Dokploy/dokploy/)
- [Caddy — Automatic HTTPS](https://caddyserver.com/docs/automatic-https)
- [PostgreSQL automated backups pg_dump (2026)](https://oneuptime.com/blog/post/2026-01-25-postgresql-automated-backups-pg-dump/view)
- [Docker volume backup guide (2025)](https://eastondev.com/blog/en/posts/dev/20251217-docker-volume-backup/)
- [GitHub — Fork and sync upstream](https://docs.github.com/articles/fork-a-repo)
- [Upstream fork strategy (Eric Minassian)](https://www.ericminassian.com/notes/upstream-fork-strategy/)

---

<!-- Prochaine étape : validation point par point avec Root, puis verrouillage dans decision-log + docs/DEPLOYMENT.md -->
