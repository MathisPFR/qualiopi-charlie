# Onboarding instance client (Root)

Checklist pour déployer **un nouveau client** — corps produit identique, configuration par instance.

> Affiner après le **premier deploy réel** (profil Anne-Hélène). Voir aussi [`DEPLOYMENT.md`](./DEPLOYMENT.md) (dev local) et [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Prérequis

- [ ] Repo `qualiopi-client-{slug}` créé depuis le core (remote `upstream`)
- [ ] VPS client accessible (SSH) — Docker installé
- [ ] Dokploy central Root + remote server configuré
- [ ] Compte **Cloudflare** client (R2)
- [ ] Compte **Brevo** client (gratuit OK)
- [ ] Domaine client : `qualiopi.{client}.fr` + `sign.{client}.fr`

---

## 1 — Repo & configuration Git

```bash
# Exemple
git clone git@github.com:root/qualiopi-client-anne-helene.git
cd qualiopi-client-anne-helene
git remote add upstream git@github.com:root/qualiopi-core.git
```

- [ ] `config/client.json` — orgName, orgEmail, formBaseUrl (URL prod HTTPS)
- [ ] `templates/catalog/` — templates HTML/PDF du client (ou copie profil référence)
- [ ] Aucun secret dans Git

---

## 2 — Cloudflare R2 (compte client)

- [ ] Créer bucket ex. `qualiopi-anne-helene`
- [ ] API token : lecture + écriture
- [ ] Activer **versioning** + lifecycle (rétention 30j recommandée)
- [ ] Noter : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`

Root configure ; le client garde l'accès dashboard Cloudflare.

---

## 3 — Dokploy — projet client

- [ ] Nouveau projet `anne-helene` → remote server VPS client
- [ ] Source : repo Git client, branche `main`
- [ ] Type : **Docker Compose** (`docker-compose.yml` + `docker-compose.prod.yml`)
- [ ] Domaine app : `qualiopi.client.fr` → service `app:3000` (HTTPS Traefik auto)
- [ ] Domaine signatures : `sign.client.fr` → service `documenso:3000`

### Variables d'environnement (Dokploy)

| Variable | Exemple / note |
|----------|----------------|
| `DATABASE_URL` | `postgresql://qualiopi:***@postgres:5432/qualiopi` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `APP_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://qualiopi.client.fr` |
| `NEXTAUTH_URL` | idem |
| `GOTENBERG_URL` | `http://gotenberg:3000` |
| `STORAGE_DRIVER` | `r2` |
| `R2_ACCOUNT_ID` | … |
| `R2_ACCESS_KEY_ID` | … |
| `R2_SECRET_ACCESS_KEY` | … |
| `R2_BUCKET` | … |
| `R2_ENDPOINT` | `https://<account>.r2.cloudflarestorage.com` |
| `CRON_SECRET` | secret long aléatoire |
| `DOCUMENSO_WEBHOOK_SECRET` | secret webhook |

**Ne pas mettre** les identifiants Brevo ici — configuration **in-app** (Paramètres → Brevo).

- [ ] Deploy initial réussi
- [ ] Backup PostgreSQL quotidien → même bucket R2 (Dokploy)

---

## 4 — Documenso (signatures)

- [ ] Générer certificat `.p12` ([doc Documenso self-hosting](https://docs.documenso.com/docs/self-hosting))
- [ ] Monter le certificat dans le container + `NEXT_PRIVATE_SIGNING_PASSPHRASE`
- [ ] `NEXT_PUBLIC_WEBAPP_URL=https://sign.client.fr`
- [ ] `NEXT_PRIVATE_INTERNAL_WEBAPP_URL=http://documenso:3000`
- [ ] Créer compte admin Documenso + **API key**
- [ ] Webhook → `https://qualiopi.client.fr/api/webhooks/documenso`

---

## 5 — Base de données & admin Root

```bash
# Terminal conteneur app (Dokploy ou docker exec)
npx prisma migrate deploy
npm run db:seed
```

- [ ] Seed OK — compte ADMIN Root temporaire (`ADMIN_EMAIL` / `ADMIN_PASSWORD` dans env seed uniquement si besoin)
- [ ] Se connecter à `https://qualiopi.client.fr/login`

---

## 6 — Configuration in-app (avec le client ou pour lui)

| Écran | Action |
|-------|--------|
| **Paramètres → Organisation** | Nom, email contact, URL publique |
| **Paramètres → Brevo** | Login SMTP + clé + From → **Tester** |
| **Paramètres → Branding** | Logo, couleur primaire |
| **Paramètres → Workflows** | Devis obligatoire, émargement PDF/signature |
| **Paramètres → Intégrations Documenso** | URL + API key (si écran dédié) |
| **Paramètres → Utilisateurs** | **Inviter** l'admin client par email |

Côté **Brevo** (client) : domaine vérifié, SPF/DKIM/DMARC.

- [ ] Client a activé son compte (lien invitation) et défini son MDP
- [ ] Désactiver ou restreindre le compte Root seed si plus nécessaire

---

## 7 — Cron éval à froid

Sur le VPS ou tâche externe :

```cron
0 8 * * * curl -s -H "Authorization: Bearer VOTRE_CRON_SECRET" https://qualiopi.client.fr/api/cron/eval-a-froid
```

- [ ] Cron actif

---

## 8 — Smoke test

- [ ] `GET /api/health` → OK (app + DB + gotenberg)
- [ ] `GET /api/version` → version déployée
- [ ] Créer formation test → lancement (ou mode test email)
- [ ] Vérifier fichiers sur R2
- [ ] Test signature Documenso (1 document)
- [ ] Export ZIP Bibliothèque
- [ ] *(Recommandé)* Parcours complet via **MCP browser** Cursor

---

## 9 — Remise au client

- [ ] URL app + identifiants (ou compte invité)
- [ ] Accès dashboard Cloudflare (R2) — optionnel
- [ ] Accès Dokploy Member sur son projet — optionnel
- [ ] Courte session de prise en main (30–60 min)

---

## Sync core → client (maintenance)

```bash
git fetch upstream
git merge upstream/main
# Résoudre conflits config/ si besoin
git push
```

Dokploy redeploy automatique si webhook configuré.
