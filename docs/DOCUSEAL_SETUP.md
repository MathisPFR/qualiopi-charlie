# DocuSeal — signatures électroniques

[DocuSeal](https://www.docuseal.com/) remplace Zoho Sign dans ce POC : convention (entreprise) et règlement intérieur (chaque stagiaire).

## Démarrage

```bash
docker compose up -d docuseal
```

Interface : http://localhost:3002

DocuSeal utilise **PostgreSQL** (base `docuseal` sur le conteneur `postgres` du projet).

Si Postgres tournait déjà avant cette config, créez la base une fois :

```bash
docker exec qualiopi-charlie-postgres-1 psql -U qualiopi -d qualiopi -c "CREATE DATABASE docuseal;"
```

1. Créer un compte admin au premier lancement
2. **Settings → API** : générer une clé API
3. **Settings → Webhooks** : ajouter
   - URL : `{NEXT_PUBLIC_APP_URL}/api/webhooks/docuseal`
   - Événement : `submission.completed`
   - Secret (optionnel) : même valeur que `DOCUSEAL_WEBHOOK_SECRET` dans `.env`

## Variables `.env`

```env
DOCUSEAL_ENABLED=true
DOCUSEAL_URL=http://localhost:3002
DOCUSEAL_API_KEY=votre_cle_api
DOCUSEAL_SEND_EMAIL=true
DOCUSEAL_WEBHOOK_SECRET=un-secret-partage
```

- `DOCUSEAL_SEND_EMAIL=false` : pas d’email DocuSeal (utiliser les liens affichés dans le dashboard)
- Sans `DOCUSEAL_ENABLED=true` + clé API, le lancement génère les PDF sans demande de signature

## Flux

1. **Lancement formation** → PDF convention + RI générés
2. Si DocuSeal actif → création de submissions via API (`/submissions/pdf`)
3. DocuSeal envoie l’email de signature (ou lien dans l’UI)
4. **Webhook `submission.completed`** → téléchargement PDF signé → `storage/.../Avant la formation/`
5. Mise à jour BDD : `conventionSigned`, `riSigned`, table `SignatureRequest`

## Qualiopi

Les PDF signés et la table `SignatureRequest` constituent la piste d’audit (qui, quand, quel document). Conservez aussi les emails DocuSeal si activés.

## Production

- Exposer DocuSeal derrière HTTPS (reverse proxy)
- Changer `DOCUSEAL_SECRET_KEY` (`openssl rand -hex 32`)
- Préférer PostgreSQL pour DocuSeal en prod (voir doc officielle DocuSeal)
