# Déploiement (1 instance = 1 client)

## Modèle

- Un **repo** déployé par client sur un **VPS unique**
- Tout tourne dans **Docker Compose** : app, PostgreSQL, Gotenberg, Adminer
- `config/client.json` : nom org, email, préfixe stockage
- `.env` : secrets (DB, auth, email, cron)
- Fichiers générés dans `storage/` sur le même VPS (volume bind-mount)

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
