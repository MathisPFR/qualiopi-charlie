# PDF lisibles — configuration

Tous les documents générés sont **toujours en `.pdf` valide**.

## Méthode recommandée : Docker (sans sudo)

LibreOffice tourne dans le conteneur **Gotenberg** — pas d’installation sur ton PC.

```bash
cd ~/Projets/qualiopi-charlie
docker compose up -d
```

Cela démarre **PostgreSQL** et **Gotenberg** (port `3001`).

Vérifiez :

```bash
curl -s http://localhost:3001/health
node scripts/test-pdf.mjs
```

Dans `.env` :

```env
GOTENBERG_URL=http://localhost:3001
```

L’app appelle Gotenberg en priorité pour convertir chaque DOCX rempli en PDF.

## Méthode locale (optionnelle)

Si Docker n’est pas disponible :

```bash
sudo apt install -y libreoffice
```

Puppeteer reste un dernier secours (dépendances Chrome plus lourdes).

## Déploiement client (VPS)

Sur le même `docker compose` :

- `postgres` — base de données
- `gotenberg` — conversion PDF

L’app Next.js (hôte ou conteneur) utilise `GOTENBERG_URL=http://gotenberg:3000` si elle tourne dans le même réseau Docker.

## Dépannage

| Erreur | Action |
|--------|--------|
| `Gotenberg : fetch failed` | `docker compose up -d gotenberg` |
| `Gotenberg HTTP 503` | Attendre 10 s après le premier démarrage (image lourde) |
| `Impossible de produire un PDF` | `curl http://localhost:3001/health` puis `node scripts/test-pdf.mjs` |
