---
title: "Experience — Système d'automatisation Qualiopi"
status: final
created: 2026-06-11
updated: 2026-06-11
form_factor: "Admin desktop-first + formulaires publics responsive (héritage shadcn, spec légère)"
ui_system: shadcn/ui
sources:
  - ../../prds/prd-app-2026-06-10/prd.md
  - ../../prds/prd-app-2026-06-10/.decision-log.md
design_ref: ./DESIGN.md
---

# Experience — Système d'automatisation Qualiopi

> Contrat comportemental pour l'admin dashboard v1. Identité visuelle : [`DESIGN.md`](./DESIGN.md). Les maquettes dans `mockups/` illustrent ; **ce document l'emporte** en cas de conflit.

## Foundation

**Surfaces v1 :**

| Surface | Form-factor | UI |
|---------|-------------|-----|
| **Admin dashboard** | Desktop-first (≥1024px cible) ; responsive tablette/téléphone via `Sheet` sidebar | shadcn/ui · Next.js App Router |
| **Formulaires publics** `/f/{slug}/{formType}` | Mobile-first, tous écrans | shadcn form primitives · pas de maquette UX dédiée (comportement PRD UJ-3/UJ-4) |

**Déploiement :** une instance par client (VPS). Pas de multi-tenant.

**Rôles :** ADMIN (catalogue, paramètres, utilisateurs) · OPERATEUR (formations, automatisations, pas d'édition Types/Paramètres).

**North star (Anne-Hélène) :** *« C'est sobre et pro. Dès que j'arrive, je comprends où j'en suis, ce qui a marché, ce qui n'a pas marché. Je ne peux pas lancer un truc par accident. »*

## Information Architecture

### Mode App (routes globales)

| Surface | Route | Accès | Purpose |
|---------|-------|-------|---------|
| **Formations** | `/` | Tous | Liste des formations · **Nouvelle formation** |
| **Bibliothèque** | `/bibliotheque` | Tous | Drive global toutes formations |
| **Types de formation** | `/types` | ADMIN | Catalogue modèles (Formation Type) |
| **Paramètres** | `/parametres` | ADMIN | Règles instance, thème client (`{colors.primary}`), émargement |
| **Connexion** | `/login` | Public | Auth opérateur |

Sidebar **Mode App** — une colonne. Voir [`mockups/bibliotheque.html`](mockups/bibliotheque.html).

### Mode Formation (sidebar contextuelle — swap complet)

Entrée : clic formation depuis liste. Sortie : **← Toutes les formations**.

Route par défaut : `/formations/{id}` → **Vue d'ensemble**.

| Section | Route | Purpose |
|---------|-------|---------|
| **Vue d'ensemble** | `/formations/{id}` | Statut, alertes, prochaine action, tuiles, participants |
| **Préparation** | `…/preparation` | Fiche, modèle catalogue, devis, séances, objectifs |
| **Lancement** | `…/lancement` | Checklist, confirmation, suivi envois/signatures |
| **En cours** | `…/en-cours` | Émargements PDF ou signature digitale par séance |
| **Clôture** | `…/cloture` | Passage TERMINEE, évaluations, certificats |
| **Documents** | `…/documents` | Drive local (même arborescence que Bibliothèque, scope une formation) |

**Règle nav :** jamais deux sidebars. `AppSidebar` swap `NavApp` ↔ `NavFormation` via `usePathname()`.

→ Maquettes : [`formation-overview.html`](mockups/formation-overview.html), [`formation-preparation.html`](mockups/formation-preparation.html), [`formation-lancement.html`](mockups/formation-lancement.html)

### Arborescence documents (Bibliothèque + Documents formation)

Racine par formation : `{intitulé formation} — {nom client}`

Sous-dossiers fixes : `avant-la-formation/` · `pendant-la-formation/` · `apres-la-formation/` · `preuves-qualiopi/` · `originaux/`

### Formulaires publics (spec légère)

Routes PRD : `besoins-stagiaire`, `besoins-entreprise`, `eval-chaud`, `eval-entreprise`, `eval-froid`. Champs pré-remplis quand données connues. Composants shadcn standard · une colonne · bouton envoi unique. Hors scope maquettes UX v1.

## Voice and Tone

Microcopy en **français professionnel**, vouvoiement implicite (infinitif / impératif neutre : « Vérifiez », « Enregistrer »).

| Do | Don't |
|----|-------|
| « 2 emails n'ont pas pu être envoyés » | « Erreur SMTP 550 » |
| « Confirmer le lancement ? » | « 🚀 C'est parti ! » |
| « Il reste 1 élément avant de pouvoir lancer » | « Validation failed: devis missing » |
| « Relancer l'email » | « Retry workflow » |
| « Modèle du catalogue » vs « Cette formation » | « Formation Type » sans explication |

## Component Patterns

Comportement uniquement — visuel dans `DESIGN.md`.

| Pattern | Surface | Règles |
|---------|---------|--------|
| **Sidebar contextuelle** | Global | Mode App OU Mode Formation ; footer compte + déconnexion |
| **Stepper Qualiopi** | Vue d'ensemble | 4 phases cliquables → section correspondante |
| **Bandeau alertes** | Vue d'ensemble | Conditionnel ; max 3 ; lien vers section correcte |
| **Prochaine action** | Vue d'ensemble | **Une** CTA primaire selon statut ; secondaire « Modifier la fiche » |
| **Tuiles métriques** | Vue d'ensemble | Emails · Signatures · Formulaires · Émargements — cliquables |
| **Cartes radio modèle** | Préparation | 3 options : zéro / modèle existant / créer modèle (ADMIN) |
| **Bandeau complétude** | Préparation | Liens ancre vers sections incomplètes |
| **Éditeur séances** | Préparation | + Ajouter · suggest par jour · case Émargement |
| **Checklist auto** | Lancement | Calculée, non cochable manuellement |
| **Récap lancement** | Lancement | Langage humain avant dialog |
| **AlertDialog lancement** | Lancement | Second clic · liste destinataires · avertissement irréversibilité |
| **Table destinataires** | Lancement post | Relance **unitaire** par email en échec |
| **Arbre + aperçu** | Bibliothèque, Documents | Split pane · PDF iframe · non-PDF → télécharger |
| **Barre sélection** | Bibliothèque | ≥1 fichier → Télécharger · Exporter ZIP |

## State Patterns

| État | Surface | Traitement |
|------|---------|------------|
| Chargement | Toutes | `Skeleton` calé sur layout final |
| Formation brouillon vide | Préparation | Bandeau complétude ambre |
| Prêt à lancer | Vue d'ensemble | Prochaine action → Lancement ; tuiles grises si N/A |
| Lancement partiel échec | Vue d'ensemble + Lancement | Alertes rouges · table avec Relancer |
| Lancement OK | Vue d'ensemble | Tuiles vertes/ambre · pas de bandeau rouge |
| Post-lancement | Préparation | Champs sensibles disabled + bandeau info |
| Bibliothèque vide formation | Bibliothèque | Entrée grisée « aucun document » |
| Sélection fichiers | Bibliothèque | Barre `{components.selection-bar}` |
| Permission OPERATEUR | Types, Paramètres | Entrées sidebar masquées ou disabled + message |
| Lancement en cours | Lancement dialog | Progress indeterminate · « Ne fermez pas cette page » |

## Interaction Primitives

**Souris-first** (public peu technophile) — clavier suit shadcn defaults.

- **Clic unique** pour navigation sidebar et tuiles
- **AlertDialog** obligatoire avant : lancer · passer EN_COURS · TERMINEE
- **Pas d'annulation post-lancement** — correction via relance unitaire ou édition brouillon pré-lancement
- **Enregistrer** explicite en Préparation (pas d'auto-save v1)
- **Esc** ferme dialogs · ne quitte pas lancement en cours sans avertissement
- **Deep-link Bibliothèque** : `/bibliotheque?formation={id}` depuis Documents formation

**Interdit v1 :** double sidebar · bouton « Lancer » sans récap · relance globale silencieuse · wizard multi-étapes création formation

## Accessibility Floor

- WCAG 2.1 AA — contrastes hérités shadcn + vérification `{colors.primary}` instance
- Focus visible sur tous contrôles interactifs (`ring` shadcn)
- Alertes : `role="alert"` ou `aria-live="polite"` pour échecs email post-lancement
- Tables Lancement : en-têtes explicites · boutons Relancer avec label complet
- Dialog confirmation : focus trap · bouton Annuler atteignable au clavier en premier tab order recommandé
- Formulaires publics : labels visibles · champs requis annoncés · cibles tactiles ≥44px mobile

## Responsive & Platform

| Breakpoint | Admin |
|------------|-------|
| ≥ `lg` (1024px) | Sidebar fixe · grilles 4 tuiles · split Bibliothèque |
| `md` | Tuiles 2 colonnes · table Lancement scroll horizontal si besoin |
| `< md` | Sidebar `Sheet` · stepper 2×2 · Préparation une colonne |

Formulaires publics : une colonne · champs pleine largeur · pas de sidebar.

## Inspiration & Anti-patterns

**Retenu :**
- shadcn dashboard sidebar contextuelle (swap contenu, pas double colonne)
- Split pane drive (POC brownfield) généralisé Bibliothèque
- Pattern « prochaine action » (Linear-like clarity, sans keyboard-first)

**Rejeté :**
- Page formation monolithique POC (tout sur un scroll)
- Double sidebar app + formation
- Wizard création formation
- Boutons d'automation empilés sans hiérarchie
- Relance globale sans confirmation comme action primaire

## Key Flows

### UJ-1 — Anne-Hélène lance une nouvelle Formation

**Persona :** Anne-Hélène, opératrice, engagement client déjà devisé offline.  
**Entrée :** Authentifiée, dashboard.

1. **Formations** → **Nouvelle formation** → redirect **Préparation** (brouillon).
2. Choisit **Utiliser un modèle du catalogue** → pré-remplissage · complète entreprise, stagiaires, séances, objectifs, **importe devis**.
3. Bandeau vert « Fiche prête » → **Vue d'ensemble** · prochaine action **Vérifier et lancer**.
4. **Lancement** : checklist OK · lit récap · **Vérifier et lancer** → **Confirmer le lancement ?** → **Confirmer et lancer**.
5. **Climax :** retour **Vue d'ensemble** — tuiles emails/signatures · bandeau vert ou alerte si échec partiel.
6. **Résolution :** stagiaires/entreprise reçoivent mails · documents en Bibliothèque.

**Échec email :** tuile rouge · **Lancement** → **Relancer l'email** · message humain.

→ [`mockups/formation-preparation.html`](mockups/formation-preparation.html), [`mockups/formation-lancement.html`](mockups/formation-lancement.html), [`mockups/formation-overview.html`](mockups/formation-overview.html)

### UJ-2 — Anne-Hélène mène une Formation EN_COURS → TERMINEE

1. **Vue d'ensemble** → prochaine action **Passer en cours** (dialog confirmation).
2. **En cours** : émargements générés ou liens signature par séance `[OQ-6 : détail UX séance — voir architecture]`.
3. Fin → **Clôture** · dialog confirmation · emails fin + évaluations.
4. **Climax :** tuiles formulaires/émargements complets · Bibliothèque audit-ready.

*Maquette spine-only — comportement aligné PRD §4.4–4.6.*

### UJ-3 / UJ-4 — Marc / Sophie (formulaires publics)

1. Email avec lien `/f/{slug}/…` · champs pré-remplis · soumission.
2. Opérateur voit réponse sur tuile **Formulaires** Vue d'ensemble.

*Spec légère — shadcn forms · pas de mock UX v1.*

### Audit documentaire — Anne-Hélène prépare un dossier Qualiopi

1. **Bibliothèque** → expand formation → phase ou **originaux**.
2. Sélection fichiers · **Exporter en ZIP** ou menu dossier.
3. **Climax :** archive téléchargée sans ouvrir chaque fiche formation.

→ [`mockups/bibliotheque.html`](mockups/bibliotheque.html)

---

## Mock coverage

| Surface | Maquette | Notes |
|---------|----------|-------|
| Vue d'ensemble | ✅ | |
| Préparation | ✅ | |
| Lancement | ✅ | |
| Bibliothèque | ✅ | |
| En cours · Clôture · Documents | Spine only | Même patterns drive / tuiles |
| Liste Formations · Types · Paramètres | Spine only | Sidebar Mode App |
| Formulaires publics | Héritage shadcn + PRD | Exclu volontairement discovery |

## Open items

| ID | Sujet | Owner |
|----|-------|-------|
| OQ-6 | UX émargement signature digitale par séance (section En cours) | Architecture + UX update |
| OQ-1 | Nom commercial produit | Branding |
| — | Nom nav « Bibliothèque » vs « Documents » | Cosmétique · défaut **Bibliothèque** |
