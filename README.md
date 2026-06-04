# Qualiopi Charlie — POC Next.js

Automatisation administrative des formations Qualiopi (remplacement Notion + Make) en **Next.js 15**, **PostgreSQL** et **Prisma**.

## Prérequis

- Node.js 20+
- Docker (PostgreSQL)
- **PDF lisibles** : `docker compose up -d` démarre **Gotenberg** (LibreOffice dans Docker, port 3001) — **pas besoin de `sudo apt install libreoffice`**
  - Voir [docs/PDF_SETUP.md](docs/PDF_SETUP.md)
  - Test : `node scripts/test-pdf.mjs`
- Compte **Resend** (gratuit) ou **Brevo SMTP** pour les emails réels

## Démarrage rapide

```bash
# 1. PostgreSQL + conversion PDF (Gotenberg / LibreOffice dockerisé)
docker compose up -d

# 2. Variables d'environnement
cp .env.example .env
# Renseigner RESEND_API_KEY (ou SMTP) — voir docs/EMAIL_SETUP.md

cp config/client.json.example config/client.json

# 3. Dépendances (depuis WSL/Linux, pas Windows npm sur node_modules)
npm install --legacy-peer-deps

# 4. Base de données
node node_modules/prisma/build/index.js db push
node prisma/seed.mjs

# 5. Lancer l'app (WSL — ne pas utiliser npm Windows)
chmod +x scripts/dev.sh
bash scripts/dev.sh
# ou : npm run dev   (seulement si `which npm` pointe vers Linux, pas /mnt/c/...)
```

Ouvrir http://localhost:3000 — connexion : `admin@charlie.local` / `admin123` (voir `.env`).

### Internal Server Error sur toutes les pages

Le cache `.next` est probablement corrompu (build interrompu). Redémarrage propre :

```bash
bash scripts/restart-dev.sh
```

Puis rafraîchir http://localhost:3000 (Ctrl+Shift+R).

### Problème `npm run dev` / `'next' n'est pas reconnu`

Sous WSL, si `which npm` affiche `/mnt/c/Program Files/...`, c'est **npm Windows** : il ne fonctionne pas dans le dossier Linux.

**Solution immédiate :**
```bash
bash scripts/dev.sh
```

**Solution durable :** installer Node dans WSL :
```bash
sudo apt update && sudo apt install -y nodejs npm
# puis dans le projet :
npm install --legacy-peer-deps
npm run dev
```

## Parcours démo

1. Créer ou ouvrir une formation
2. **Valider et lancer l'automatisation** → dossiers `storage/`, convention PDF, emails
3. **Passer en cours** → émargements PDF
4. Partager les liens formulaires (`/f/{slug}/...`)
5. **Terminer** → certificats, attestations, emails éval à chaud
6. **Cron éval à froid** (bouton ou `GET /api/cron/eval-a-froid` avec `Authorization: Bearer $CRON_SECRET`)

## Structure

| Dossier | Rôle |
|---------|------|
| `src/server/workflows/` | Logique des 9 scénarios Make |
| `src/server/services/` | PDF, email, stockage, audit |
| `templates/` | Modèles DOCX (depuis Google Drive) |
| `storage/` | Fichiers générés par formation (gitignored) |
| `config/client.json` | Config instance client |
| `docs/` | Architecture, BDD, workflows, déploiement, email |

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/WORKFLOWS.md](docs/WORKFLOWS.md)
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/EMAIL_SETUP.md](docs/EMAIL_SETUP.md)

## Hors scope POC

Signatures Zoho Sign (PDF non signés uniquement).

## Contexte métier

Export Notion / Make / templates : dossier [`context/`](context/).
