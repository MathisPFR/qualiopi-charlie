# Déploiement (1 instance = 1 client)

## Modèle

- Un **repo Git par client** (GitHub/GitLab) sur un **VPS unique**
- **Production MVP :** [Dokploy](https://dokploy.com/) — 1 projet par client, Docker Compose, domaine + HTTPS via Traefik intégré
- **Onboarding nouveau client :** voir **[ONBOARDING-CLIENT.md](./ONBOARDING-CLIENT.md)** (checklist complète R2, Brevo, Documenso)
- **Développement local :** Docker Compose manuel (`./scripts/docker-up.sh`) — pas de Dokploy requis
- Stack : app, PostgreSQL, Gotenberg, **Documenso** (prod) ; Adminer en dev seulement
- `config/client.json` : identité org bootstrap
- `.env` Dokploy : secrets **infra** (DB, auth, R2, cron) — **Brevo configuré in-app**
- Fichiers en **Cloudflare R2** (compte client) ; `storage/` local en dev uniquement

## Prérequis VPS

- Debian/Ubuntu avec Docker et Docker Compose v2
- Aucune installation Node.js sur l'hôte

## Étapes VPS

```bash
git clone <repo> /opt/qualiopi-client-x
cd /opt/qualiopi-client-x

cp .env.example .env
cp config/client.json.example config/client.json
# Éditer .env + config/client.json (URL publique, secrets email, etc.)

chmod +x scripts/docker-up.sh scripts/docker-seed.sh

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
./scripts/docker-seed.sh
```

L'app écoute sur le port **3000** (reverse proxy nginx/caddy recommandé en prod).

## Cron éval à froid (quotidien 8h)

```cron
0 8 * * * curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://client.example.com/api/cron/eval-a-froid
```

## Sauvegardes

- Volume PostgreSQL : `docker volume inspect qualiopi-charlie_postgres_data`
- Dossier `storage/` sur le VPS (rsync ou snapshot)

## Variables obligatoires

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL (service `postgres` en Docker) |
| `NEXTAUTH_SECRET` | Secret session |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens forms) |
| `NEXTAUTH_URL` | Même URL publique |
| `RESEND_API_KEY` ou SMTP | Emails réels |
| `MAIL_FROM` | Expéditeur |
| `CRON_SECRET` | Protection route cron |
| `GOTENBERG_URL` | `http://gotenberg:3000` (réseau Docker) |

## Développement local

```bash
./scripts/docker-up.sh -d
./scripts/docker-seed.sh
```

Shell dans le conteneur (Node 22, outils npm) :

```bash
./scripts/docker-shell.sh
```

### Tests automatisés (Vitest)

```bash
docker compose exec app npm test
# ou en watch : docker compose exec app npm run test:watch
```

Couvre la logique serveur des stories 1.2–1.5 (permissions, config, object-storage, changement MDP).

### Tester le stockage S3 (MinIO)

MinIO simule Cloudflare R2 en local (même driver `STORAGE_DRIVER=r2`, même SDK S3).

```bash
# MinIO démarre avec docker compose (ports 9000 API, 9001 console)
docker compose up -d minio minio-init

# Smoke test sans modifier .env (one-shot via variables injectées)
./scripts/smoke-storage-minio.sh
# ou : npm run storage:smoke:minio
```

Console web : [http://localhost:9001](http://localhost:9001) — login `minioadmin` / `minioadmin`, bucket `qualiopi-dev`.

Pour que **toute l'app** utilise MinIO (pas seulement le smoke test), ajouter dans `.env` :

```env
STORAGE_DRIVER=r2
R2_ENDPOINT=http://minio:9000
R2_BUCKET=qualiopi-dev
R2_ACCESS_KEY_ID=minioadmin
R2_SECRET_ACCESS_KEY=minioadmin
R2_S3_FORCE_PATH_STYLE=true
```

Puis `docker compose restart app`. Les workflows POC (`storage.ts`) ignorent encore ce driver — seul le code via `getObjectStorage()` en profite (migration workflows : story 5.3).
