---
stepsCompleted: [1, 2, 3, 4]
langue: français
inputDocuments:
  - planning-artifacts/prds/prd-app-2026-06-10/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-designs/ux-app-2026-06-11/EXPERIENCE.md
  - planning-artifacts/ux-designs/ux-app-2026-06-11/DESIGN.md
  - _bmad-output/project-context.md
---

# qualiopi-charlie — Découpe en epics

## Vue d'ensemble

Décomposition des exigences PRD (FR-1–33), architecture v1 et spec UX en epics et stories implémentables. POC existant — évolution incrémentale, pas de projet vierge.

## Inventaire des exigences

### Exigences fonctionnelles

FR-1: Un opérateur peut se connecter par email/mot de passe et accéder au dashboard admin.
FR-2: Un opérateur peut changer son mot de passe ; le nouveau MDP est requis au prochain login ; stockage hashé uniquement.
FR-3: Toutes les routes admin exigent une session ; `/f/*`, auth API et cron API restent publics/protégés par token.
FR-4: Le rôle ADMIN accède à tout : Types, Paramètres, users, templates, et capacités OPERATEUR.
FR-5: Le rôle OPERATEUR gère les formations et automatisations mais pas Types, Paramètres, templates ni users.
FR-6: Un ADMIN crée un Formation Type (nom, programme optionnel, jeux de documents) ; visible en liste.
FR-7: Un ADMIN édite un Formation Type avec avertissement d'impact sur formations liées.
FR-8: Sauvegarde Type → formations BROUILLON liées héritent automatiquement des changements.
FR-9: Formations A_LANCER/EN_COURS : pas d'auto-sync ; ADMIN peut appliquer explicitement par formation ou bulk.
FR-10: Formations TERMINEE/ARCHIVEE liées à un Type ne sont jamais modifiées par un changement Type.
FR-11: À la création formation : blank, sélection Type existant, ou création inline Type (ADMIN).
FR-12: ADMIN liste et archive/désactive des Types ; archivés non sélectionnables pour nouvelles formations.
FR-13: Création formation avec entreprise, stagiaires, dates, séances, objectifs, devis uploadé, slug public unique.
FR-14: Édition formation pré-lancement selon règles métier (pas de rupture preuves post-lancement).
FR-15: Cycle statuts BROUILLON → A_LANCER → EN_COURS → TERMINEE → ARCHIVEE ; EN_COURS déclenche émargements ; TERMINEE déclenche fin.
FR-16: Bibliothèque documents par formation organisée par phase ; artefacts stagiaire vs entreprise distinguables.
FR-17: Mode PDF : un émargement PDF par stagiaire (toutes séances pertinentes), archivé, pas d'email auto.
FR-18: Mode signature : opérateur envoie lien sign par séance/stagiaire ; preuve stockée et visible.
FR-19: ADMIN configure mode émargement par défaut (PDF vs signature) au niveau instance.
FR-20: Lancement bloqué sans devis, stagiaire(s) avec email, entreprise email si docs entreprise requis.
FR-21: Lancement génère et archive documents selon matrice §2.5 ; échec document explicite par fichier.
FR-22: Lancement envoie emails distincts stagiaire/entreprise avec PJ et liens formulaires corrects.
FR-23: Lancement initie signatures électroniques (RI stagiaire, Convention+Devis entreprise) ; statut visible.
FR-24: Post-lancement : indicateurs par destinataire (email, doc, signature) sur la formation.
FR-25: Relance unitaire email en échec depuis la fiche formation avec raison lisible.
FR-26: Preuve PDF Qualiopi générée et archivée pour chaque email de lancement.
FR-27: Re-lancement idempotent : pas de doublons sans force explicite ; journal AutomationRun.
FR-28: TERMINEE : certificats, attestations, formulaires eval chaud/entreprise, preuves ; pattern retry comme lancement.
FR-29: Cron M+2 envoie eval-froid aux stagiaires uniquement ; pas de doublon ; preuve archivée.
FR-30: Formulaires publics accessibles via `/f/{slug}/{formType}` sans auth (5 types listés PRD).
FR-31: Formulaires pré-remplis quand données connues ; soumission stockée + PDF preuve si applicable.
FR-32: Bootstrap instance sans modifier `src/` : client.json, templates, règles, env — instance démarre configurée.
FR-33: ADMIN gère Paramètres in-app (règles workflow, branding, templates, email copy) ; OPERATEUR exclu.

### Exigences non fonctionnelles

NFR-1: Fiabilité prioritaire — échecs visibles, retry unitaire, jamais de skip silencieux (workflows, email, PDF).
NFR-2: Idempotence sur tous les workflows via flags Formation + journal AutomationRun (RUNNING/SUCCESS/FAILED).
NFR-3: Dossier formation audit-ready Qualiopi : arborescence phases fixe, preuves par envoi, export ZIP.
NFR-4: Corps produit portable — même build pour N clients ; config par instance, pas de code dédié client.
NFR-5: Single-tenant — une instance VPS = un organisme de formation ; pas de multi-tenant SaaS.
NFR-6: Sécurité — MDP hashés, secrets Brevo chiffrés DB, cron Bearer token, AuthZ ADMIN/OPERATEUR.
NFR-7: Signatures SES (eIDAS) suffisant v1 via Documenso CE self-hosted.
NFR-8: Accessibilité WCAG 2.1 AA ; contraste primary color instance vérifié.
NFR-9: Interface et microcopy en français professionnel (pas de jargon technique côté opérateur).
NFR-10: Lancement synchrone depuis action opérateur ; complétion signatures asynchrone acceptable.
NFR-11: Pas de cache agressif v1 — données fraîches pour fiabilité opérateur.
NFR-12: Smoke tests MCP browser pour validation déploiement (A4-7).

### Exigences additionnelles (architecture)

- POC existant : évolution incrémentale POC `qualiopi-charlie` — **pas** `create-next-app` projet vierge (Epic 1 ≠ squelette vide).
- Epic 1 fondation : `npx shadcn@latest init` + composants sidebar requis.
- Service `object-storage.ts` avec `STORAGE_DRIVER=local|r2` ; migration workflows hors `storage.ts` disque.
- Extension Prisma : rôles User, FormationType, InstanceSettings, EmailDelivery, SignatureRequest.
- `getInstanceConfig()` merge client.json + InstanceSettings — workflows ne lisent pas client.json directement.
- Server Actions pour métier ; API routes limitées (auth, cron, webhooks, health, version).
- Pipeline PDF hybride : catalogue HTML/Gotenberg + DOCX custom optionnel ; 0 licence payante docxtemplater.
- Email prod Brevo connecteur in-app chiffré ; dev Resend + MAIL_DEV_REDIRECT.
- Documenso CE + webhook → R2 pour PDF signés ; liens dans emails Brevo.
- Routes admin cibles : `/`, `/bibliotheque`, `/types`, `/parametres`, `/formations/[id]/{overview,preparation,lancement,en-cours,cloture,documents}`.
- Clés R2 : `formations/{formationId}/{phase}/{fichier}` ; 1 bucket par client Cloudflare.
- `/api/health` + `/api/version` MVP.
- Docker Compose prod : app + Gotenberg + Documenso ; Dokploy déploiement VPS.
- Sync core→clients : remote upstream + merge périodique (OQ-10).
- 4 couches obligatoires : Page → Action → Workflow → Service (`project-context.md`).

### Exigences UX

UX-DR1: Sidebar contextuelle unique — swap Mode App ↔ Mode Formation via `usePathname()` ; jamais double sidebar.
UX-DR2: Routes Mode App : `/`, `/bibliotheque`, `/types` (ADMIN), `/parametres` (ADMIN), `/login`.
UX-DR3: Routes Mode Formation : vue d'ensemble, preparation, lancement, en-cours, cloture, documents + lien retour liste.
UX-DR4: Theming instance via CSS variables (`primaryColor`, logo) depuis InstanceSettings ; defaults DESIGN.md.
UX-DR5: Composant AppSidebar shadcn avec NavApp et NavFormation ; footer compte + déconnexion.
UX-DR6: Vue d'ensemble — stepper 4 phases cliquable, bandeau alertes (max 3), carte « prochaine action » (1 CTA primaire).
UX-DR7: Vue d'ensemble — tuiles métriques cliquables : Emails, Signatures, Formulaires, Émargements (états success/warning/danger).
UX-DR8: Préparation — cartes radio 3 options modèle (zéro / existant / créer ADMIN) ; bandeau complétude avec ancres.
UX-DR9: Préparation — éditeur séances (+ ajouter, suggest par jour, case Émargement) ; zone devis obligatoire visuelle.
UX-DR10: Préparation — enregistrement explicite (pas auto-save v1) ; champs sensibles disabled post-lancement + bandeau info.
UX-DR11: Lancement — checklist auto calculée non cochable ; récap langage humain ; AlertDialog confirmation irréversible.
UX-DR12: Lancement post — table destinataires avec relance unitaire par email en échec ; messages erreur humains français.
UX-DR13: Bibliothèque + Documents formation — split pane arbre + aperçu PDF iframe ; barre sélection export ZIP/télécharger.
UX-DR14: Deep-link `/bibliotheque?formation={id}` depuis Documents formation.
UX-DR15: AlertDialog obligatoire avant lancer, passer EN_COURS, passer TERMINEE.
UX-DR16: Responsive — sidebar Sheet < lg ; grilles tuiles 4→2→1 ; préparation colonne unique max 720px.
UX-DR17: Accessibilité — focus visible, role alert sur échecs email, labels tables Lancement, formulaires publics cibles ≥44px mobile.
UX-DR18: États chargement Skeleton calés sur layout final ; lancement en cours dialog progress indeterminate.
UX-DR19: OPERATEUR — entrées Types/Paramètres masquées ou disabled avec message permission.
UX-DR20: Formulaires publics — shadcn forms une colonne, mobile-first, spec légère héritage PRD (pas mock dédié v1).

### Cartographie FR → epics

FR-1: Epic 1 — Connexion opérateur
FR-2: Epic 1 — Changement mot de passe
FR-3: Epic 1 — Protection session middleware
FR-4: Epic 1 — Rôle ADMIN
FR-5: Epic 1 — Rôle OPERATEUR
FR-6: Epic 3 — Création Formation Type
FR-7: Epic 3 — Édition Formation Type
FR-8: Epic 3 — Propagation BROUILLON
FR-9: Epic 3 — Application aux formations actives
FR-10: Epic 3 — Gel TERMINEE/ARCHIVEE
FR-11: Epic 3 — Lien Type à la création formation
FR-12: Epic 3 — Liste et archive Types
FR-13: Epic 4 — Création formation
FR-14: Epic 4 — Édition pré-lancement
FR-15: Epic 4 — Cycle de vie statuts
FR-16: Epic 4 + Epic 9 — Bibliothèque documents
FR-17: Epic 6 — Émargement PDF
FR-18: Epic 6 — Émargement signature digitale
FR-19: Epic 2 — Config mode émargement défaut
FR-20: Epic 5 — Prérequis lancement
FR-21: Epic 5 — Génération documents lancement
FR-22: Epic 5 — Emails lancement
FR-23: Epic 5 — Signatures lancement
FR-24: Epic 5 — Indicateurs succès lancement
FR-25: Epic 5 — Relance email
FR-26: Epic 5 — Preuves Qualiopi lancement
FR-27: Epic 5 — Idempotence lancement
FR-28: Epic 7 — Fin de formation
FR-29: Epic 7 — Éval à froid M+2
FR-30: Epic 8 — Accès formulaires publics
FR-31: Epic 8 — Pré-remplissage et soumission
FR-32: Epic 1 + Epic 2 — Amorçage et valeurs par défaut instance
FR-33: Epic 2 — Paramètres in-app ADMIN

## Liste des epics

### Epic 1: Fondation instance & accès sécurisé
L'instance démarre avec stockage abstrait, fusion de config, UI shadcn, authentification à rôles et APIs de santé.
**FR couverts :** FR-1, FR-2, FR-3, FR-4, FR-5, FR-32 (partiel)

### Epic 2: Paramètres & personnalisation de l'organisme
L'ADMIN configure Brevo, branding, règles workflow et templates sans modifier le code source.
**FR couverts :** FR-19, FR-32, FR-33

### Epic 3: Catalogue des types de formation
L'ADMIN gère des modèles réutilisables ; l'OPERATEUR les sélectionne ; propagation par statut.
**FR couverts :** FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-12

### Epic 4: Espace formation — préparation & suivi
L'OPERATEUR crée et prépare une formation, navigue l'espace UX 6 phases, suit l'état global.
**FR couverts :** FR-13, FR-14, FR-15, FR-16 (partiel)

### Epic 5: Lancement automatisé
L'OPERATEUR lance une formation : docs, emails, signatures, preuves, relances, idempotence.
**FR couverts :** FR-20, FR-21, FR-22, FR-23, FR-24, FR-25, FR-26, FR-27

### Epic 6: Formation en cours — émargements
L'OPERATEUR gère les présences en mode PDF ou signature digitale par séance.
**FR couverts :** FR-17, FR-18

### Epic 7: Clôture & évaluation à froid
Fin de formation automatisée et cron M+2 pour l'évaluation à froid.
**FR couverts :** FR-28, FR-29

### Epic 8: Formulaires publics
Stagiaires et entreprises complètent les formulaires sans compte, adaptés au mobile.
**FR couverts :** FR-30, FR-31

### Epic 9: Bibliothèque documentaire & export audit
Vue globale des documents, export ZIP, prêt audit Qualiopi.
**FR couverts :** FR-16 (complet), NFR-3

---

## Epic 1: Fondation instance & accès sécurisé

POC existant — initialiser shadcn, stockage abstrait, schéma Prisma minimal, auth à rôles.

### Story 1.1: Initialiser shadcn/ui et composants de base

En tant que **développeur**,
je veux **formaliser shadcn/ui avec les composants requis**,
afin de **fournir une base UI commune à toutes les epics**.

**Critères d'acceptation :**

**Étant donné** le POC sans `components.json`
**Quand** `npx shadcn@latest init` et `npx shadcn@latest add` sidebar, sheet, alert-dialog, skeleton, badge, toast, table, checkbox, select
**Alors** `components.json` existe et les composants sont dans `src/components/ui/`
**Et** `globals.css` contient les variables CSS shadcn

### Story 1.2: Schéma Prisma rôles et InstanceSettings

En tant qu'**ADMIN**,
je veux **des rôles User et un singleton InstanceSettings en base**,
afin de **rendre l'instance configurable sans recompilation**.

**Critères d'acceptation :**

**Étant donné** le schéma POC User sans rôle
**Quand** migration ajoute `role` (ADMIN|OPERATEUR), modèle `InstanceSettings` singleton
**Alors** seed crée un ADMIN et une ligne InstanceSettings depuis `client.json`
**Et** les enums suivent les conventions projet (SCREAMING_SNAKE)

### Story 1.3: Service object-storage et getInstanceConfig

En tant que **développeur**,
je veux **une abstraction stockage local/R2 et une fusion de configuration unifiée**,
afin de **centraliser l'accès aux fichiers via object-storage**.

**Critères d'acceptation :**

**Étant donné** `STORAGE_DRIVER=local` en dev
**Quand** `object-storage.ts` expose put/get/list/delete avec clés `formations/{id}/{phase}/{file}`
**Alors** les opérations fonctionnent sur `storage/` local
**Et** `getInstanceConfig()` fusionne `client.json` + InstanceSettings (InstanceSettings gagne si non-null)

### Story 1.4: Middleware et gardes ADMIN/OPERATEUR

En tant qu'**opérateur**,
je veux **que seuls les utilisateurs autorisés accèdent aux bonnes routes**,
afin de **respecter les permissions ADMIN/OPERATEUR du PRD**.

**Critères d'acceptation :**

**Étant donné** un user OPERATEUR connecté
**Quand** il accède à `/types` ou `/parametres`
**Alors** accès refusé ou entrée sidebar masquée (UX-DR19)
**Et** `requireAuth()` / `requireAdmin()` disponibles dans `lib/permissions.ts` pour Server Actions

### Story 1.5: Connexion et changement de mot de passe

En tant qu'**opérateur**,
je veux **me connecter et changer mon mot de passe**,
afin d'**accéder au dashboard en sécurité** (FR-1, FR-2).

**Critères d'acceptation :**

**Étant donné** des identifiants valides
**Quand** login sur `/login`
**Alors** redirection dashboard ; identifiants invalides → erreur sans révéler si email existe
**Et** changement MDP en Paramètres ou profil : nouveau MDP requis au prochain login ; stockage bcrypt

### Story 1.6: Invitation utilisateur par email

En tant qu'**ADMIN**,
je veux **inviter un opérateur par email avec lien d'activation**,
afin de **permettre à l'équipe d'accéder sans auto-inscription** (FR-4).

**Critères d'acceptation :**

**Étant donné** un ADMIN sur gestion users
**Quand** il invite un email avec rôle OPERATEUR ou ADMIN
**Alors** user créé statut PENDING ; email Brevo/Resend avec lien `/auth/activer`
**Et** le invité définit son MDP et passe ACTIVE

### Story 1.7: Réinitialisation mot de passe oublié

En tant qu'**opérateur**,
je veux **réinitialiser mon mot de passe via email**,
afin de **récupérer l'accès sans support** (FR-2).

**Critères d'acceptation :**

**Étant donné** un email existant
**Quand** demande sur `/auth/reinitialiser` (lien depuis login)
**Alors** email envoyé avec token limité dans le temps
**Et** nouveau MDP enregistré hashé après clic lien

### Story 1.8: APIs santé et version

En tant qu'**intégrateur (Root)**,
je veux **`/api/health` et `/api/version`**,
afin de **superviser les instances clients** (NFR).

**Critères d'acceptation :**

**Étant donné** l'app démarrée
**Quand** GET `/api/health`
**Alors** JSON `{ status: "ok", db: "ok" }` si Postgres joignable
**Et** GET `/api/version` retourne version app/git tag depuis env ou package.json

---

## Epic 2: Paramètres & personnalisation de l'organisme

### Story 2.1: Page Paramètres — shell et sections

En tant qu'**ADMIN**,
je veux **une page Paramètres structurée par sections**,
afin de **centraliser la configuration de l'instance** (FR-33, UX-DR2).

**Critères d'acceptation :**

**Étant donné** un ADMIN connecté
**Quand** il ouvre `/parametres`
**Alors** sections visibles : Organisation, Brevo, Workflows, Branding, Templates
**Et** OPERATEUR ne voit pas l'entrée sidebar ni n'accède à la route

### Story 2.2: Connecteur Brevo chiffré avec test

En tant qu'**ADMIN**,
je veux **configurer Brevo in-app avec test d'envoi**,
afin d'**envoyer les emails de production depuis mon compte** (FR-33, NFR-6).

**Critères d'acceptation :**

**Étant donné** `APP_ENCRYPTION_KEY` en env infra
**Quand** ADMIN saisit login SMTP, clé API, From et clique Tester
**Alors** secrets chiffrés en InstanceSettings ; test envoie email ; statut succès/échec visible
**Et** message d'erreur en français si échec

### Story 2.3: Règles workflow instance

En tant qu'**ADMIN**,
je veux **régler devis obligatoire, envoi programme, mode émargement défaut**,
afin que **les nouvelles formations suivent mes règles** (FR-19, FR-33).

**Critères d'acceptation :**

**Étant donné** Paramètres section Workflows
**Quand** ADMIN modifie `devisRequired`, `sendProgrammeOnLaunch`, `emargementModeDefault`
**Alors** valeurs persistées InstanceSettings
**Et** nouvelles formations héritent des defaults ; formations terminées non impactées

### Story 2.4: Branding logo et couleur primaire

En tant qu'**ADMIN**,
je veux **uploader un logo et choisir la couleur primaire**,
afin que **l'interface reflète mon organisme** (FR-33, UX-DR4).

**Critères d'acceptation :**

**Étant donné** un logo PNG/SVG et couleur hex
**Quand** ADMIN enregistre Branding
**Alors** logo stocké R2/local ; CSS variables `--primary` injectées dans layout admin
**Et** contraste primary acceptable WCAG (NFR-8)

### Story 2.5: Gestion templates documents

En tant qu'**ADMIN**,
je veux **remplacer ou choisir templates catalogue vs DOCX custom**,
afin que **mes documents générés correspondent à mon OF** (FR-33).

**Critères d'acceptation :**

**Étant donné** section Templates Paramètres
**Quand** ADMIN upload DOCX ou sélectionne template catalogue par type document
**Alors** fichier sur R2/local registry ; association persistée InstanceSettings ou table dédiée
**Et** pas d'éditeur in-app v1

---

## Epic 3: Catalogue des types de formation

### Story 3.1: CRUD Formation Type — création et liste

En tant qu'**ADMIN**,
je veux **créer et lister des types de formation**,
afin de **réutiliser mes offres catalogue** (FR-6, FR-12).

**Critères d'acceptation :**

**Étant donné** un ADMIN sur `/types`
**Quand** il crée un Type avec nom, programme optionnel, associations templates
**Alors** Type visible en liste ; nom distinct des formations instances
**Et** OPERATEUR ne peut pas créer ni éditer

### Story 3.2: Édition Type avec avertissement d'impact

En tant qu'**ADMIN**,
je veux **modifier un Type avec résumé des formations impactées**,
afin de **comprendre les effets avant d'enregistrer** (FR-7).

**Critères d'acceptation :**

**Étant donné** un Type avec formations liées
**Quand** ADMIN sauvegarde des changements
**Alors** dialog avertissement avec comptes par statut (BROUILLON, actif, TERMINEE)
**Et** changements persistés après confirmation

### Story 3.3: Propagation automatique BROUILLON

En tant qu'**ADMIN**,
je veux **que les formations BROUILLON héritent auto des changements Type**,
afin d'**éviter une resynchronisation manuelle** (FR-8).

**Critères d'acceptation :**

**Étant donné** formations BROUILLON liées au Type modifié
**Quand** Type sauvegardé
**Alors** champs programme/templates mis à jour sur ces formations
**Et** opérateur voit indication champs mis à jour depuis Type

### Story 3.4: Application optionnelle aux formations actives

En tant qu'**ADMIN**,
je veux **appliquer explicitement les changements Type aux formations EN_COURS/A_LANCER**,
afin de **ne pas interrompre des livraisons en cours** (FR-9, FR-10).

**Critères d'acceptation :**

**Étant donné** Type modifié avec formations A_LANCER/EN_COURS liées
**Quand** ADMIN ouvre « Appliquer les changements »
**Alors** liste formations éligibles ; TERMINEE/ARCHIVEE absentes
**Et** apply par formation ou bulk ; snapshot `typeSnapshot` mis à jour

### Story 3.5: Sélection Type à la création formation

En tant qu'**opérateur**,
je veux **choisir un modèle, partir de zéro, ou en créer un (ADMIN)**,
afin de **préparer plus vite une nouvelle formation** (FR-11, UX-DR8).

**Critères d'acceptation :**

**Étant donné** page Préparation nouvelle formation
**Quand** opérateur choisit cartes radio zéro / modèle existant / créer modèle
**Alors** sélection Type pré-remplit programme et templates configurés
**Et** seul ADMIN voit option « créer modèle »

---

## Epic 4: Espace formation — préparation & suivi

### Story 4.1: Sidebar contextuelle App ↔ Formation

En tant qu'**opérateur**,
je veux **une sidebar qui change selon le contexte**,
afin de **naviguer clairement sans double colonne** (UX-DR1, DR3, DR5, DR16, DR19).

**Critères d'acceptation :**

**Étant donné** dashboard admin
**Quand** opérateur ouvre une formation
**Alors** sidebar swap NavFormation (6 sections + retour liste) ; jamais deux sidebars
**Et** < lg : sidebar en Sheet + SidebarTrigger

### Story 4.2: Vue d'ensemble formation

En tant qu'**opérateur**,
je veux **voir statut, alertes, prochaine action et tuiles métriques**,
afin de **savoir immédiatement où j'en suis** (UX-DR6, DR7).

**Critères d'acceptation :**

**Étant donné** `/formations/[id]`
**Quand** page chargée
**Alors** stepper 4 phases cliquable, max 3 alertes, une CTA « prochaine action » selon statut
**Et** tuiles Emails/Signatures/Formulaires/Émargements avec couleurs sémantiques

### Story 4.3: Page Préparation — fiche complète

En tant qu'**opérateur**,
je veux **éditer entreprise, stagiaires, séances, objectifs, devis**,
afin que **ma fiche soit prête avant le lancement** (FR-13, FR-14, UX-DR8, DR9, DR10).

**Critères d'acceptation :**

**Étant donné** formation BROUILLON
**Quand** opérateur remplit sections et clique Enregistrer
**Alors** données persistées ; bandeau complétude avec liens ancres si incomplet
**Et** zone devis : bordure ambre si manquant, vert si importé ; post-lancement champs sensibles disabled

### Story 4.4: Cycle de vie des statuts formation

En tant qu'**opérateur**,
je veux **faire évoluer le statut avec confirmations**,
afin que **les bons workflows se déclenchent** (FR-15, UX-DR15).

**Critères d'acceptation :**

**Étant donné** formation prête
**Quand** opérateur passe A_LANCER → EN_COURS → TERMINEE via AlertDialog
**Alors** EN_COURS déclenche workflow émargements (Epic 6) ; TERMINEE déclenche fin (Epic 7)
**Et** transitions invalides bloquées avec message français

### Story 4.5: Page Documents formation (scope local)

En tant qu'**opérateur**,
je veux **parcourir les documents de ma formation par phase**,
afin de **vérifier les fichiers générés** (FR-16 partiel, UX-DR13 partiel).

**Critères d'acceptation :**

**Étant donné** `/formations/[id]/documents`
**Quand** opérateur ouvre l'onglet
**Alors** arbre phases identique Bibliothèque ; aperçu PDF iframe
**Et** lien vers Bibliothèque globale avec `?formation={id}` (UX-DR14)

---

## Epic 5: Lancement automatisé

### Story 5.1: Modèle SignatureRequest et Documenso CE

En tant que **développeur**,
je veux **Documenso CE en Docker et table SignatureRequest**,
afin de **rendre les signatures de lancement traçables** (FR-23, NFR-7).

**Critères d'acceptation :**

**Étant donné** docker-compose.prod avec service Documenso
**Quand** migration crée `SignatureRequest` (formationId, documentType, recipient, externalId, status)
**Alors** client API `documenso.ts` crée demande signature
**Et** credentials Documenso en env instance

### Story 5.2: Webhook Documenso → PDF signé R2

En tant que **développeur**,
je veux **recevoir les signatures complétées via webhook**,
afin d'**archiver automatiquement les PDF signés** (FR-23).

**Critères d'acceptation :**

**Étant donné** signature complétée côté Documenso
**Quand** POST `/api/webhooks/documenso` reçu
**Alors** `SignatureRequest` → COMPLETED ; PDF récupéré et stocké via object-storage
**Et** handler idempotent sur `externalId`

### Story 5.3: Migrer workflow lancement vers object-storage

En tant que **développeur**,
je veux **launch.ts utilisant object-storage au lieu de storage.ts disque**,
afin que **le lancement fonctionne en production avec R2** (FR-21, architecture).

**Critères d'acceptation :**

**Étant donné** formation à lancer
**Quand** `launchFormation` exécute
**Alors** tous fichiers écrits via clés R2 ; plus de `storagePath` absolu disque en prod
**Et** pattern startRun/finishRun + flags idempotence conservés

### Story 5.4: UI Lancement — prérequis et checklist

En tant qu'**opérateur**,
je veux **voir une checklist auto et les blocages avant de lancer**,
afin de **ne pas lancer une formation incomplète** (FR-20, UX-DR11).

**Critères d'acceptation :**

**Étant donné** page `/formations/[id]/lancement`
**Quand** prérequis manquants (devis, emails)
**Alors** bouton lancer disabled ou message explicite français
**Et** checklist calculée non cochable manuellement ; récap humain avant AlertDialog

### Story 5.5: Exécution lancement — docs, emails, signatures

En tant qu'**opérateur**,
je veux **lancer génère docs, envoie emails distincts et initie signatures**,
afin que **stagiaires et entreprise reçoivent le bon contenu** (FR-21, FR-22, FR-23).

**Critères d'acceptation :**

**Étant donné** formation A_LANCER complète
**Quand** opérateur confirme lancement
**Alors** matrice §2.5 respectée ; emails séparés stagiaire/entreprise ; liens signature dans emails Brevo
**Et** échec document ou email = erreur nommée, pas de skip silencieux (NFR-1)

### Story 5.6: Suivi post-lancement, relance et preuves

En tant qu'**opérateur**,
je veux **voir le statut par destinataire et relancer les échecs**,
afin de **corriger sans relancer toute la formation** (FR-24–27, UX-DR12, DR18).

**Critères d'acceptation :**

**Étant donné** lancement terminé ou partiel
**Quand** opérateur consulte table destinataires
**Alors** statut email/doc/signature par ligne ; bouton Relancer unitaire si échec email
**Et** preuves PDF Qualiopi archivées ; re-lancement idempotent sans doublon ; AutomationRun journalisé

---

## Epic 6: Formation en cours — émargements

### Story 6.1: Workflow émargements PDF au passage EN_COURS

En tant qu'**opérateur**,
je veux **des PDF d'émargement générés par stagiaire**,
afin d'**archiver les feuilles de présence** (FR-17).

**Critères d'acceptation :**

**Étant donné** mode PDF actif (instance ou formation)
**Quand** statut → EN_COURS
**Alors** un PDF par stagiaire (séances `includeInEmargement`) archivé `pendant-la-formation/`
**Et** pas d'email auto ; visible page En cours et Documents

### Story 6.2: Page En cours — consultation émargements PDF

En tant qu'**opérateur**,
je veux **voir et télécharger les émargements**,
afin de **les imprimer ou les envoyer si besoin** (FR-17, UX).

**Critères d'acceptation :**

**Étant donné** émargements générés
**Quand** opérateur ouvre `/formations/[id]/en-cours`
**Alors** liste PDF par stagiaire avec téléchargement
**Et** séances non signées N/A en mode PDF

### Story 6.3: Émargement signature digitale par séance

En tant qu'**opérateur**,
je veux **envoyer un lien de signature par séance et stagiaire**,
afin d'**obtenir une preuve digitale de présence** (FR-18, OQ-6).

**Critères d'acceptation :**

**Étant donné** mode signature actif
**Quand** opérateur sélectionne une séance et envoie liens
**Alors** email par stagiaire avec lien Documenso ; SignatureRequest liée séance+stagiaire
**Et** statut signé/non signé visible ; preuve archivée R2 à complétion

---

## Epic 7: Clôture & évaluation à froid

### Story 7.1: Workflow fin de formation

En tant qu'**opérateur**,
je veux **qu'au passage TERMINEE les emails et docs de fin partent**,
afin que **stagiaires et entreprise reçoivent certificats et évaluations** (FR-28).

**Critères d'acceptation :**

**Étant donné** formation EN_COURS
**Quand** statut → TERMINEE (AlertDialog)
**Alors** certificats, attestations, liens eval chaud/entreprise envoyés ; preuves générées
**Et** pattern retry/idempotence identique lancement (NFR-1, NFR-2)

### Story 7.2: Page Clôture

En tant qu'**opérateur**,
je veux **une page Clôture avec suivi des envois de fin**,
afin de **valider la fin comme pour le lancement** (UX-DR15).

**Critères d'acceptation :**

**Étant donné** `/formations/[id]/cloture`
**Quand** formation TERMINEE ou en cours de clôture
**Alors** tuiles et table destinataires cohérentes avec Vue d'ensemble
**Et** relance unitaire email en échec disponible

### Story 7.3: Cron évaluation à froid M+2

En tant que **système**,
je veux **envoyer l'éval à froid 2 mois après dateFin**,
afin que **la conformité Qualiopi soit respectée sans action manuelle** (FR-29).

**Critères d'acceptation :**

**Étant donné** formation TERMINEE avec `dateFin` passée de 2 mois
**Quand** cron `GET /api/cron/eval-a-froid` avec Bearer valide
**Alors** lien eval-froid envoyé à chaque stagiaire une seule fois ; preuve archivée
**Et** entreprise non incluse ; `evalFroidSent` par stagiaire mis à jour

---

## Epic 8: Formulaires publics

### Story 8.1: Finition UX des formulaires publics mobile

En tant que **stagiaire**,
je veux **des formulaires lisibles sur mobile**,
afin de **compléter sans créer de compte** (FR-30, UX-DR17, DR20).

**Critères d'acceptation :**

**Étant donné** lien `/f/{slug}/{formType}`
**Quand** ouverture sur mobile
**Alors** une colonne, champs pleine largeur, cibles tactiles ≥44px
**Et** 5 types formulaires PRD accessibles sans auth

### Story 8.2: Pré-remplissage et preuve de soumission

En tant que **stagiaire**,
je veux **mes données connues pré-remplies**,
afin de **compléter rapidement et fournir une preuve à l'OF** (FR-31).

**Critères d'acceptation :**

**Étant donné** données stagiaire/entreprise en base
**Quand** formulaire ouvert avec `?stagiaire={id}` si applicable
**Alors** champs connus pré-remplis ; soumission stockée FormSubmission
**Et** PDF preuve généré et archivé ; visible tuile Formulaires opérateur

---

## Epic 9: Bibliothèque documentaire & export audit

### Story 9.1: Page Bibliothèque globale

En tant qu'**opérateur**,
je veux **parcourir tous les documents de toutes les formations**,
afin de **préparer un audit sans ouvrir chaque fiche** (FR-16, UX-DR13).

**Critères d'acceptation :**

**Étant donné** `/bibliotheque`
**Quand** opérateur expand une formation
**Alors** split pane arbre phases + aperçu PDF ; non-PDF → télécharger
**Et** entrée grisée si formation sans documents

### Story 9.2: Export ZIP multi-sélection

En tant qu'**opérateur**,
je veux **exporter en ZIP une sélection de fichiers**,
afin de **transmettre un dossier d'audit à l'auditeur** (NFR-3).

**Critères d'acceptation :**

**Étant donné** ≥1 fichier coché dans Bibliothèque
**Quand** opérateur clique Exporter ZIP
**Alors** barre sélection fixe bas (UX-DR13) ; archive téléchargée avec arborescence phases
**Et** fichiers streamés depuis object-storage

### Story 9.3: Listing R2 unifié drive API

En tant que **développeur**,
je veux **l'API drive basée sur object-storage list**,
afin que **Bibliothèque et Documents fonctionnent en production avec R2** (FR-16, architecture).

**Critères d'acceptation :**

**Étant donné** `STORAGE_DRIVER=r2`
**Quand** API drive liste fichiers formation
**Alors** `ListObjectsV2` (ou équivalent) ; plus de `fs.readdir` en prod
**Et** routes existantes `/api/formations/.../drive` migrées

