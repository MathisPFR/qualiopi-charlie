---
workflowType: research
research_type: technical
research_topic: Bloc A4 — Onboarding instance client
date: 2026-06-11
user_name: Root
---

# Research Report: technical — Bloc A4 (Onboarding client)

## Contexte

- **A4 locked (concept)** : procédure reproductible pour chaque nouveau client
- **Synthèse blocs A→G** : Dokploy, R2, Brevo in-app, Documenso, UX, Qualiopi
- **Livrable** : [`docs/ONBOARDING-CLIENT.md`](../../../docs/ONBOARDING-CLIENT.md)
- **Premier client réel** : Anne-Hélène (profil référence) — guide affiné après ce deploy

---

## A4-0 — Vue d'ensemble (30 min lecture / ~4h travail Root)

```
1. Repo client          ← core + config
2. Comptes cloud client ← R2 + Brevo (+ domaine DNS)
3. VPS + Dokploy        ← deploy HTTPS
4. Services             ← app + postgres + gotenberg + documenso
5. Secrets infra        ← .env Dokploy (pas Brevo client)
6. Premier login        ← seed Root → invite client
7. Config in-app        ← Brevo, branding, règles
8. Smoke test           ← formation test + MCP browser
```

---

## A4-1 — Repo Git client

| Étape | Action |
|-------|--------|
| 1 | Fork / clone `qualiopi-core` → `qualiopi-client-{slug}` |
| 2 | Remote `upstream` → core |
| 3 | `config/client.json` : orgName, orgEmail, formBaseUrl |
| 4 | `templates/catalog/` + custom client si besoin |
| 5 | Push → connecter repo dans Dokploy |

**Pas de secrets dans Git** — uniquement `.env` Dokploy.

---

## A4-2 — Comptes client (hors Root)

| Compte | Owner | Root fait | Client garde |
|--------|-------|-----------|--------------|
| **Cloudflare R2** | Client | Crée bucket, clés API, lifecycle | Dashboard CF |
| **Brevo** | Client | Guide création + DNS | Compte Brevo |
| **Domaine** | Client | `qualiopi.client.fr` + `sign.client.fr` | Registrar |

---

## A4-3 — Dokploy (central Root)

1. Projet `client-{slug}` + remote server VPS
2. Service **Docker Compose** : `docker-compose.yml` + `docker-compose.prod.yml`
3. Domaines Traefik :
   - `qualiopi.client.fr` → app:3000
   - `sign.client.fr` → documenso:3000
4. **Variables d'env** (voir ONBOARDING-CLIENT.md)
5. Webhook deploy Git
6. Backup DB → R2 (Dokploy cron)

---

## A4-4 — Stack Docker (prod)

| Service | Rôle |
|---------|------|
| `app` | Next.js standalone |
| `postgres` | DB Qualiopi (+ schema documenso ou 2e DB) |
| `gotenberg` | PDF |
| `documenso` | Signatures (`sign.client.fr`) |
| ~~adminer~~ | Dev seulement — pas prod client |

**Documenso** : certificat `.p12` monté en volume ; `NEXT_PRIVATE_INTERNAL_WEBAPP_URL`.

---

## A4-5 — Secrets `.env` Dokploy (infra Root)

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | postgres interne |
| `NEXTAUTH_SECRET` | random 32+ |
| `APP_ENCRYPTION_KEY` | chiffrement Brevo/settings DB |
| `NEXT_PUBLIC_APP_URL` / `NEXTAUTH_URL` | https://qualiopi.client.fr |
| `GOTENBERG_URL` | http://gotenberg:3000 |
| `R2_*` | endpoint, bucket, access key, secret |
| `STORAGE_DRIVER` | `r2` |
| `CRON_SECRET` | cron éval à froid |
| `DOCUMENSO_WEBHOOK_SECRET` | webhook signatures |

**Pas en prod** : `MAIL_*` Brevo → **connecteur in-app** (bloc D).

**Dev seulement** : `RESEND_*`, `MAIL_DEV_REDIRECT`.

---

## A4-6 — Post-deploy

```bash
# Migration + seed (via Dokploy terminal ou one-shot job)
npx prisma migrate deploy
npm run db:seed   # ADMIN Root temporaire
```

Puis **in-app** (Root ADMIN) :
1. Paramètres → Organisation
2. Paramètres → Brevo → connecter + tester
3. Paramètres → Branding (logo R2)
4. Paramètres → Utilisateurs → **inviter** client ADMIN
5. Changer MDP Root ou désactiver compte seed

---

## A4-7 — Smoke test (MCP-first)

| # | Test | Outil |
|---|------|-------|
| 1 | `GET /api/health` | curl |
| 2 | Login + sidebar | **MCP browser** |
| 3 | Connecteur Brevo test email | UI |
| 4 | Formation brouillon → lancement test | UI + MCP |
| 5 | Signature test Documenso | lien sign |
| 6 | Bibliothèque + ZIP | UI |

---

## A4-8 — Template repo (v2)

- GitHub template `qualiopi-client-template` avec `client.json` pré-rempli vide
- Script `scripts/bootstrap-client-repo.sh` (optionnel)

**v1** : checklist manuelle suffit pour 1–3 clients.

---

## Décisions proposées

| ID | Proposition | Statut |
|----|-------------|--------|
| A4-1 | Guide **`docs/ONBOARDING-CLIENT.md`** = source ops Root | ✅ Locked |
| A4-2 | Onboarding = Root infra + **client configure Brevo in-app** | ✅ Locked |
| A4-3 | Smoke test post-deploy avec **MCP browser** | ✅ Locked |
| A4-4 | Template repo GitHub → après 1er deploy réel Anne-Hélène | ✅ Locked |
| A4-5 | `DEPLOYMENT.md` pointe vers ONBOARDING pour prod | ✅ Locked |

---

## Sources

- Bloc A recherche · Blocs B–G
- [`docs/DEPLOYMENT.md`](../../../docs/DEPLOYMENT.md)
