---
workflowType: research
research_type: technical
research_topic: Bloc B — Données, auth & paramètres instance
date: 2026-06-11
user_name: Root
---

# Research Report: technical — Bloc B (Données & auth)

## Contexte

- **POC** : Auth.js Credentials, JWT, 1 user seed, pas de `role`, pas de Formation Type
- **PRD** : FR-1 à FR-5 (auth/rôles), FR-6 à FR-12 (Formation Types), FR-32/33 (settings instance)
- **Lien bloc D** : `InstanceSettings` (Brevo, branding) — modèle données commun
- **Contrainte** : pas de SSO/OAuth v1 ; 2 rôles seulement (ADMIN / OPERATEUR)

---

## B0 — État POC

| Élément | État | Dette v1 |
|---------|------|----------|
| `User` | email, passwordHash, name | Pas de `role` |
| Seed | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Pas de role ADMIN explicite |
| Session | JWT, `session.user.id` | Pas de role en session |
| Middleware | Auth binaire (connecté ou non) | Pas de garde par rôle |
| Formation Type | Absent | Tout le catalogue FR-6–12 |
| Settings | `config/client.json` fichier | Pas d'UI Paramètres ; pas de DB |
| Changement MDP | Absent | FR-2 |

---

## B1 — Rôles ADMIN / OPERATEUR

### Modèle proposé

```prisma
enum UserRole {
  ADMIN
  OPERATEUR
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String?    // null tant que invitation non acceptée
  name         String?
  role         UserRole   @default(OPERATEUR)
  status       UserStatus @default(PENDING) // PENDING | ACTIVE | DISABLED
  invitedAt    DateTime?
  activatedAt  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  accountTokens AccountToken[]
}

enum UserStatus {
  PENDING   // invité, MDP pas encore défini
  ACTIVE
  DISABLED
}
```

### Auth.js v5 — role dans JWT + session

Pattern officiel [Auth.js RBAC](https://authjs.dev/guides/role-based-access-control) :

1. `authorize()` retourne `{ id, email, name, role }`
2. Callback `jwt` : `token.role = user.role`
3. Callback `session` : `session.user.role = token.role`
4. **Re-login requis** si role changé (JWT) — acceptable v1

### Enforcement (3 couches)

| Couche | Usage |
|--------|-------|
| **Middleware** | Bloquer routes `/parametres/*`, `/formation-types/*`, `/utilisateurs/*` pour non-ADMIN |
| **Server Actions** | `requireRole("ADMIN")` en tête de chaque action sensible |
| **UI** | Masquer nav Paramètres, Types, Users pour OPERATEUR |

**Principe** : ne jamais se fier à l'UI seule — Server Actions = source de vérité.

### Seed bootstrap

```javascript
create: { email, passwordHash, name: "Admin", role: "ADMIN" }
```

Premier compte = toujours ADMIN (integrator onboarding).

---

## B2 — Gestion utilisateurs + invitation email (FR-4)

### Modèle opérationnel (Root)

- **ADMIN intégrateur** (Root) : compte personnel pour configurer l'instance, connecter Brevo/R2, créer les accès client
- **ADMIN / OPERATEUR client** : créés par invitation — le client définit **son** mot de passe via le lien reçu par mail
- Pas d'auto-inscription publique

### Scope v1

| Action | ADMIN | OPERATEUR |
|--------|-------|-----------|
| Lister utilisateurs | ✅ | ❌ |
| Inviter utilisateur (email, nom, rôle) | ✅ | ❌ |
| Renvoyer invitation (si non acceptée) | ✅ | ❌ |
| Désactiver (`isActive=false`) | ✅ | ❌ |
| Auto-inscription | ❌ | ❌ |

### Flux invitation

```
ADMIN crée invitation (email, nom, role)
  → User créé : status PENDING, pas de MDP utilisable
  → Token signé (hash en DB, TTL 7 jours)
  → Email Brevo : « Activez votre compte Qualiopi Charlie »
  → Lien : /auth/activer?token=...
  → Client choisit son MDP → status ACTIVE → login
```

**Prérequis** : connecteur Brevo configuré (bloc D). Sinon : message admin « Configurez Brevo avant d'inviter ».

### Tokens (table dédiée)

```prisma
enum AccountTokenType {
  INVITE
  PASSWORD_RESET
}

model AccountToken {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(...)
  type      AccountTokenType
  tokenHash String           // SHA-256 du token URL (jamais le token en clair)
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime         @default(now())
}
```

Un seul token actif par type/user — invalidation à l'usage.

### Email catalogue

| Template | Déclencheur |
|----------|-------------|
| `user-invite` | ADMIN invite un utilisateur |
| `password-reset` | Forgot password |

---

## B3 — Mots de passe (FR-2)

### 3a — Changement MDP (connecté)

**Paramètres → Mon compte** (ADMIN **et** OPERATEUR) :
- MDP actuel + nouveau + confirmation

### 3b — Mot de passe oublié (v1 ✅)

```
/login → « Mot de passe oublié ? »
  → Saisie email
  → Email Brevo (même si email inconnu — message générique anti-enumération)
  → Lien /auth/reinitialiser?token=... (TTL 1 h)
  → Nouveau MDP → login
```

**Dépendance** : Brevo connecté (comme invitations).

### 3c — Première connexion

Utilisateur invité **ne passe pas** par forgot-password — flux `/auth/activer` dédié (même UI formulaire MDP, token type INVITE).

---

## B4 — Formation Types (FR-6 à FR-12)

### Schéma proposé (minimal v1)

```prisma
model FormationType {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  isActive    Boolean  @default(true)
  programmeR2Key String?  // clé R2 programme PDF/HTML
  // Associations templates — JSON ou tables join selon complexité
  templateBindings Json?  // ex. { "convention": "catalog/convention-v1", ... }
  emailRules       Json?  // ex. { "sendProgrammeOnLaunch": true }
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  formations  Formation[]
}

model Formation {
  // ...
  formationTypeId String?
  formationType   FormationType? @relation(...)
  typeSnapshotAt  DateTime?  // horodatage dernière sync depuis Type
}
```

### Propagation (PRD locked)

| Statut Formation | Comportement |
|------------------|--------------|
| **BROUILLON** | Auto-sync à chaque save Type |
| **A_LANCER / EN_COURS** | Pas d'auto — ADMIN « Appliquer » par formation ou bulk |
| **TERMINEE / ARCHIVEE** | Gelé — jamais modifié par Type |

### Snapshot vs live reference

**Recommandation** : Formation en cours garde une **copie** des règles/templates au moment du lien (snapshot JSON sur `Formation` ou table `FormationTypeSnapshot`). Évite qu'un changement Type casse une formation déjà lancée.

Champ `typeSnapshot Json?` sur `Formation` — rempli à la création / apply.

### OPERATEUR

- Peut **sélectionner** un Type à la création formation
- Ne peut pas éditer le catalogue Types

---

## B5 — InstanceSettings (FR-32 / FR-33 + bloc D)

### Singleton DB — une ligne par instance

Remplace progressivement la lecture seule de `config/client.json` pour les champs éditables in-app.

```prisma
model InstanceSettings {
  id        String   @id @default("singleton")
  // Identité org (override client.json)
  orgName       String?
  orgEmail      String?
  formBaseUrl   String?
  // Branding (bloc C)
  logoR2Key         String?
  primaryColor      String?
  secondaryColor    String?
  // Workflow rules
  devisRequired           Boolean @default(true)
  sendProgrammeOnLaunch   Boolean @default(false)
  emargementModeDefault   String  @default("PDF") // PDF | SIGNATURE
  // Brevo (bloc D — chiffré)
  brevoSmtpLoginEncrypted     String?
  brevoSmtpKeyEncrypted       String?
  mailFrom                    String?
  mailFromName                String?
  brevoConnectedAt            DateTime?
  brevoLastTestAt             DateTime?
  brevoLastTestOk             Boolean?
  updatedAt DateTime @updatedAt
}
```

### Résolution config (merge)

```
getInstanceConfig():
  defaults ← client.json (bootstrap deploy)
  overrides ← InstanceSettings DB
  return { ...defaults, ...overrides non-null }
```

**Bootstrap (FR-32)** : integrator pose `config/client.json` + seed ; client affine en Paramètres.

**`config/client.json` reste** pour valeurs figées au deploy (storagePrefix legacy dev, etc.) — pas supprimé v1.

---

## B6 — Sections Paramètres UI (v1)

| Section | Accès | Contenu |
|---------|-------|---------|
| **Mon compte** | Tous | Nom, changement MDP |
| **Organisation** | ADMIN | Nom, email contact, URL publique |
| **Intégrations → Brevo** | ADMIN | Connecteur bloc D |
| **Workflows** | ADMIN | Devis obligatoire, programme au lancement, mode émargement défaut |
| **Branding** | ADMIN | Logo, couleurs (bloc C) |
| **Utilisateurs** | ADMIN | CRUD users |
| **Templates** | ADMIN | Lien vers gestion templates (bloc C) |

OPERATEUR : accès **Mon compte** uniquement.

---

## B7 — Implémentation phases

| Phase | Contenu |
|-------|---------|
| **B-a** | Migration Prisma : `role`, `UserStatus`, `AccountToken`, `InstanceSettings` |
| **B-b** | Auth role JWT + middleware + `requireRole()` |
| **B-c** | Flux invite + forgot-password + pages `/auth/activer`, `/auth/reinitialiser` |
| **B-d** | Templates email `user-invite`, `password-reset` |
| **B-e** | UI Paramètres + Mon compte + gestion utilisateurs ADMIN |
| **B-f** | `FormationType` + propagation |

---

## Décisions proposées

| ID | Proposition | Statut |
|----|-------------|--------|
| B1 | Enum `UserRole` + role en JWT/session + triple enforcement | ✅ Locked |
| B2 | Invitation **par email** (Brevo) ; client définit son MDP ; renvoi invitation | ✅ Locked |
| B3 | Mon compte (MDP) + **forgot password** par email (Brevo) | ✅ Locked |
| B4 | `FormationType` + snapshot + propagation PRD | ✅ Locked |
| B5 | `InstanceSettings` singleton ; merge `client.json` | ✅ Locked |
| B6 | Paramètres UI par section ; OPERATEUR = Mon compte seul | ✅ Locked |
| B7 | Pas SSO / OAuth v1 ; Root = ADMIN intégrateur personnel + invites clients | ✅ Locked |

---

## Sources

- [Auth.js RBAC guide](https://authjs.dev/guides/role-based-access-control)
- PRD FR-1–FR-12, FR-32–33
- POC : `src/lib/auth.ts`, `prisma/schema.prisma`, `config/client.json`
