# Déploiement (1 instance = 1 client)

## Modèle

- Un **repo** déployé par client sur un VPS
- `config/client.json` : nom org, email, préfixe stockage
- `.env` : secrets (DB, auth, email, cron)

## Étapes VPS (Debian/Ubuntu)

```bash
# Dépendances système
sudo apt update
sudo apt install -y nodejs npm postgresql-client libreoffice docker.io

# App
git clone <repo> /opt/qualiopi-client-x
cd /opt/qualiopi-client-x
cp .env.example .env
# Éditer .env + config/client.json

docker compose up -d
npm install --legacy-peer-deps
node node_modules/prisma/build/index.js db push
node prisma/seed.mjs
npm run build
```

## Process manager

```bash
# systemd ou pm2
npm run start
# PORT=3000
```

## Cron éval à froid (quotidien 8h)

```cron
0 8 * * * curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://client.example.com/api/cron/eval-a-froid
```

## Sauvegardes

- Volume PostgreSQL (`docker compose` volume)
- Dossier `storage/` (rsync ou snapshot)

## Variables obligatoires

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL |
| `NEXTAUTH_SECRET` | Secret session |
| `RESEND_API_KEY` ou SMTP | Emails réels |
| `MAIL_FROM` | Expéditeur |
| `NEXT_PUBLIC_APP_URL` | URL publique (liens forms) |
| `CRON_SECRET` | Protection route cron |
