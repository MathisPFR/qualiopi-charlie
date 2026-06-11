---
workflowType: research
research_type: technical
research_topic: Bloc D — Email transactionnel & templates
date: 2026-06-11
user_name: Root
---

# Research Report: technical — Bloc D (Email)

## Contexte

- **POC** : `sendMail()` avec Resend (défaut) ou SMTP/Nodemailer (Brevo)
- **Modèle instance** : 1 client = 1 compte email **à lui** (comme R2)
- **PRD** : FR-22 (copies distinctes stagiaire/entreprise), FR-24/25 (statuts + retry), FR-33 (override settings)
- **Contrainte Root** : **zéro coût logiciel** — free tiers providers OK

---

## D0 — État POC

| Élément | Fichier | Dette v1 |
|---------|---------|----------|
| Abstraction provider | `mail.ts` | Pièces jointes via `path` disque → **Buffer R2** |
| Corps des emails | `email-templates.ts` | Texte hardcodé + **« Anne-Hélène JOULAUD »** |
| Dev redirect | `MAIL_DEV_REDIRECT` | Garder en dev uniquement |
| Suivi envois / retry | — | **Absent** — requis PRD |
| Templates configurables | — | Tout en TypeScript |

---

## D1 — Provider par environnement

| Environnement | Provider | Configuration |
|---------------|----------|---------------|
| **Dev local** | **Resend** | `.env` — `onboarding@resend.dev` + `MAIL_DEV_REDIRECT` (inchangé POC) |
| **Prod instance client** | **Brevo uniquement** | **Connecteur in-app** (pas de secrets mail dans Dokploy) |

**Pas de compte email central Root** — le client possède son compte Brevo (souvent 0 €, 300 emails/jour).

Volume Qualiopi : formation 15 stagiaires ≈ 32 emails ; largement sous le quota Brevo gratuit.

---

## D1bis — Connecteur Brevo in-app (décision Root)

> *« Comme WordPress WP Mail SMTP : le client connecte son compte Brevo dans l'app, teste, terminé. »*

### UX cible — Paramètres → Intégrations → **Brevo**

```
┌─────────────────────────────────────────────────────────┐
│  Brevo — Envoi des emails transactionnels               │
├─────────────────────────────────────────────────────────┤
│  Statut : ● Non configuré | ● Connecté | ● Erreur       │
│                                                         │
│  Email compte Brevo (login SMTP)    [____________]      │
│  Clé SMTP Brevo                     [••••••••••••]  👁   │
│  Expéditeur (From)                  [formation@...]     │
│  Nom expéditeur                     [Agence Charlie]    │
│                                                         │
│  ℹ️ Host/port pré-remplis (smtp-relay.brevo.com:587)   │
│  📖 Lien aide : créer clé SMTP + vérifier domaine       │
│                                                         │
│  Destinataire test  [email admin connecté, modifiable]    │
│  [ Enregistrer ]  [ Envoyer un email de test ]          │
└─────────────────────────────────────────────────────────┘
```

**Parcours client** :
1. Créer compte gratuit [brevo.com](https://www.brevo.com)
2. Vérifier son domaine dans Brevo (SPF/DKIM) — **côté Brevo**, le client choisit son domaine
3. Générer une **clé SMTP** (Settings → SMTP & API → SMTP keys)
4. Coller login + clé dans le connecteur Qualiopi → **Tester** → **Enregistrer**
5. Tous les workflows (lancement, fin, éval à froid) partent via ce compte

**Pas d'OAuth v1** — collage identifiants SMTP (modèle WordPress, zéro app OAuth à maintenir). OAuth Brevo existe mais ajoute de la complexité sans gain UX pour ce cas.

### Technique

**Stockage** — table singleton `InstanceSettings` (ou champ JSON chiffré) :

| Champ | Notes |
|-------|-------|
| `brevoSmtpLogin` | Email login Brevo |
| `brevoSmtpKeyEncrypted` | Clé SMTP chiffrée au repos |
| `mailFrom` | Adresse expéditeur (domaine vérifié Brevo) |
| `mailFromName` | Nom affiché |
| `brevoConnectedAt` | Horodatage dernière config OK |
| `brevoLastTestAt` / `brevoLastTestOk` | Résultat dernier test |

Chiffrement : `APP_ENCRYPTION_KEY` **unique par instance** dans `.env` Dokploy (secret infra Root, pas le secret Brevo).

**`sendMail()` refactoré** :
```typescript
// Prod
const config = await getBrevoConfigFromDb(); // déchiffré à la volée
if (!config) throw new MailNotConfiguredError(); // UI bloque workflows + bannière Settings

// Dev
if (process.env.NODE_ENV === "development") → .env Resend (comportement actuel)
```

Host/port **verrouillés** côté code (`smtp-relay.brevo.com`, `587`) — pas exposés à l'utilisateur (preset Brevo).

**Test connexion** :
1. `transporter.verify()` (Nodemailer) — validation credentials
2. Envoi email test HTML « Qualiopi Charlie — test Brevo OK » au destinataire choisi
3. Message succès/erreur lisible (ex. « Clé SMTP invalide », « Domaine expéditeur non vérifié »)

**Garde-fous prod** :
- Workflows email **refusés** si connecteur non configuré (message : « Configurez Brevo dans Paramètres »)
- Bannière dashboard tant que non connecté
- Root n'a plus à toucher `SMTP_*` dans Dokploy pour le client

**POC** : bouton « Tester email » sur fiche formation → **déplacé** vers le connecteur Brevo (source unique de vérité). Option : garder raccourci formation qui redirige vers Settings.

### Credentials Brevo (référence)

| Paramètre | Valeur |
|-----------|--------|
| Serveur | `smtp-relay.brevo.com` |
| Port | `587` (ou `465` SSL) |
| User | Email login SMTP Brevo |
| Password | **Clé SMTP** (pas la clé API REST) |

Sources : [Brevo SMTP relay](https://developers.brevo.com/docs/smtp-integration), [clés SMTP](https://help.brevo.com/hc/en-us/articles/7959631848850).

---

## D2 — Domaine & délivrabilité

**Responsabilité client** dans son compte Brevo :
1. Ajouter et vérifier le domaine d'envoi
2. Configurer SPF + DKIM (+ DMARC recommandé)
3. Saisir l'adresse `From` correspondante dans le connecteur

**Dans l'app** : lien d'aide vers doc Brevo + rappel que le test email valide la config complète.

Sans domaine vérifié → échec au test avec message explicite (pas d'envoi silencieux en spam).

---

## D3 — Templates email (hybride, comme PDF)

### Architecture proposée

```
Niveau 1 — Catalogue HTML (défaut)
  templates/email/launch-stagiaire.html
  Variables : {{intitule}}, {{lien_besoins}}, {{signature}}, {{logo_url}}
  Branding : couleurs + logo depuis Settings (même couche que PDF)

Niveau 2 — Override Settings (v1.1 optionnel)
  ADMIN édite sujet + corps dans Paramètres (textarea ou HTML simple)

Niveau 3 — Code POC (supprimé)
  email-templates.ts hardcodé → migré vers catalogue
```

### Emails catalogue v1 (parité workflows)

| ID | Déclencheur |
|----|-------------|
| `launch-stagiaire` | Lancement |
| `launch-stagiaire-programme` | Variante avec mention programme |
| `launch-entreprise` | Lancement entreprise |
| `fin-stagiaire` | TERMINEE |
| `fin-entreprise` | TERMINEE |
| `eval-froid-stagiaire` | Cron M+2 |

**Signature** : `{{formateur_nom}}`, `{{org_name}}`, `{{org_email}}` — **plus de nom hardcodé**.

---

## D4 — Suivi envois & retry (FR-24, FR-25)

### Modèle proposé

Table Prisma `EmailDelivery` (ou extension `AutomationRun`) :

| Champ | Exemple |
|-------|---------|
| `formationId` | … |
| `workflow` | LANCEMENT |
| `recipientType` | STAGIAIRE / ENTREPRISE |
| `stagiaireId` | optionnel |
| `to` | email |
| `subject` | … |
| `status` | PENDING / SENT / FAILED |
| `providerMessageId` | id Brevo/Resend |
| `errorMessage` | texte lisible |
| `sentAt` | … |

**Retry** : bouton UI → rappelle `sendMail()` pour cet enregistrement FAILED uniquement (idempotent).

**Lien preuve Qualiopi** : PDF preuve généré même si échec (comportement POC conservé).

---

## D5 — Pièces jointes post-R2

```typescript
// Avant (POC)
attachments: [{ filename: "x.pdf", path: "/storage/..." }]

// Après (v1)
attachments: [{ filename: "x.pdf", content: bufferFromR2 }]
```

`resolveAttachments()` lit déjà `content: Buffer` — adapter workflows pour charger depuis R2.

---

## D6 — Implémentation phases

| Phase | Contenu |
|-------|---------|
| **0** | `InstanceSettings` + **connecteur Brevo UI** + `sendMail()` lit DB en prod |
| 1 | `EmailTemplateEngine` HTML + branding |
| 2 | Migrer 6 templates catalogue |
| 3 | `EmailDelivery` + UI retry (écran Lancement) |
| 4 | Attachments R2 + supprimer paths disque |

---

## Décisions proposées

| ID | Proposition | Statut |
|----|-------------|--------|
| D1 | **Dev** = Resend `.env` ; **Prod** = **Brevo seul** | ✅ Locked |
| D1bis | **Connecteur Brevo in-app** (login SMTP + clé + From) ; test dans connecteur **+ bouton test conservé sur fiche formation** | ✅ Locked |
| D2 | Domaine/DNS géré par le **client dans Brevo** ; aide in-app | ✅ Locked |
| D3 | Templates email **catalogue HTML** + branding (hybride PDF) | ✅ Locked |
| D4 | Table **EmailDelivery** + retry UI | ✅ Locked |
| D5 | Pièces jointes depuis **R2 buffers** | ✅ Locked |
| D6 | Zéro service email payant obligatoire | ✅ Locked |

---

## Sources

- [Resend pricing](https://resend.com/pricing)
- [Brevo pricing](https://www.brevo.com/pricing/)
- [Brevo SMTP docs](https://help.brevo.com/hc/en-us/articles/7924908994450)
- POC : `src/server/services/mail.ts`, `email-templates.ts`
