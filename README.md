# Qualiopi Charlie — POC Next.js

Automatisation administrative des formations Qualiopi (remplacement Notion + Make) en **Next.js 15**, **PostgreSQL** et **Prisma**.

## Prérequis

- **Docker** et **Docker Compose** uniquement (pas de Node.js local requis)
- Compte **Resend** (gratuit) ou **Brevo SMTP** pour les emails réels

## Démarrage rapide (Docker)

```bash
# 1. Variables d'environnement + config client
cp .env.example .env
cp config/client.json.example config/client.json
# Renseigner RESEND_API_KEY (ou SMTP) — voir docs/EMAIL_SETUP.md

# 2. Toute la stack (app + Postgres + Gotenberg + Adminer)
chmod +x scripts/docker-up.sh scripts/docker-seed.sh scripts/docker-shell.sh
./scripts/docker-up.sh -d

# 3. Seed initial (première fois)
./scripts/docker-seed.sh
```

Ouvrir http://localhost:3000 — connexion : `admin@charlie.local` / `admin123` (voir `.env`).

**Base de données (Adminer)** : http://localhost:8080 — système **PostgreSQL**, serveur **postgres**, utilisateur **qualiopi**, mot de passe **qualiopi**, base **qualiopi**.

### Commandes utiles

| Commande | Action |
|----------|--------|
| `./scripts/docker-up.sh -d` | Démarrer en arrière-plan |
| `docker compose logs -f app` | Logs de l'application |
| `docker compose down` | Arrêter la stack |
| `./scripts/docker-seed.sh` | Réinitialiser les données de démo |
| `./scripts/docker-shell.sh` | Shell dans le conteneur (Node 22) |

### Production (1 VPS = 1 client)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
./scripts/docker-seed.sh
```

Voir [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### Internal Server Error sur toutes les pages

```bash
docker compose down
docker volume rm qualiopi-charlie_app_node_modules 2>/dev/null || true
./scripts/docker-up.sh -d --build
```

Puis rafraîchir http://localhost:3000 (Ctrl+Shift+R).

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
- [docs/PDF_SETUP.md](docs/PDF_SETUP.md)

## Hors scope POC

Signatures Zoho Sign (PDF non signés uniquement).

## Contexte métier

Export Notion / Make / templates : dossier [`context/`](context/).
