---
name: Qualiopi
description: Identité visuelle du système d'automatisation administrative Qualiopi — couche marque sur shadcn/ui, personnalisable par instance client.
status: final
created: 2026-06-11
updated: 2026-06-11
ui_system: shadcn/ui
sources:
  - ../../prds/prd-app-2026-06-10/prd.md
colors:
  # Valeurs par défaut instance. ADMIN peut surcharger via Paramètres (logo + primary).
  primary: '#2563EB'
  primary-foreground: '#F8FAFC'
  success: '#15803D'
  success-foreground: '#FFFFFF'
  success-muted: '#F0FDF4'
  warning: '#B45309'
  warning-foreground: '#FFFFFF'
  warning-muted: '#FFFBEB'
  danger: '#B91C1C'
  danger-foreground: '#FFFFFF'
  danger-muted: '#FEF2F2'
typography:
  # Corps, labels, captions : héritage shadcn (Geist Sans ou stack système Next.js).
  page-title:
    fontSize: 22px
    fontWeight: '700'
    lineHeight: '1.25'
  section-title:
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.35'
  body:
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  caption:
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 4px
  md: 6px
  lg: 8px
  full: 9999px
spacing:
  sidebar-width: 240px
  content-max-preparation: 720px
  content-max-default: 1280px
components:
  sidebar-active-item:
    background: '#EFF6FF'
    foreground: '{colors.primary}'
    border-accent: '{colors.primary}'
  status-badge-brouillon:
    background: '#F1F5F9'
    foreground: '#64748B'
  status-badge-a-lancer:
    background: '#DBEAFE'
    foreground: '#1D4ED8'
  status-badge-en-cours:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
  status-badge-terminee:
    background: '{colors.success-muted}'
    foreground: '{colors.success}'
  alert-critical:
    background: '{colors.danger-muted}'
    foreground: '{colors.danger}'
    border: '#FECACA'
  alert-warning:
    background: '{colors.warning-muted}'
    foreground: '#92400E'
    border: '#FDE68A'
  tile-metric:
    radius: '{rounded.lg}'
    border: '#E2E8F0'
  next-action-card:
    border: '{colors.primary}'
    background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)'
  selection-bar:
    background: '#0F172A'
    foreground: '#FFFFFF'
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
---

## Brand & Style

Qualiopi est un **outil métier fiable** pour les organismes de formation — pas un SaaS consumer, pas un tableau de bord « startup ». L'expression visuelle : **sobre, pro, rassurant**. L'opérateur (Anne-Hélène) doit voir immédiatement où elle en est, ce qui a réussi et ce qui bloque, sans formation préalable à l'interface.

Le produit hérite **shadcn/ui** sur Next.js + Tailwind. Ce `DESIGN.md` ne redéfinit pas Button, Card, Dialog, Table, Select, Badge — il spécifie la **couche marque** et les **composants métier** (tuiles statut, bandeaux alerte, barre de sélection Bibliothèque). Chaque **instance client** (VPS dédié) peut ajuster `{colors.primary}` et le logo via **Paramètres** à l'installation ; le reste reste sur les defaults shadcn pour limiter la dette de maintenance.

Les maquettes HTML dans `mockups/` illustrent la composition ; **ce document l'emporte** en cas de conflit.

## Colors

- **`{colors.primary}`** — Actions principales, item sidebar actif, liens, stepper phase courante. Surchargeable par instance.
- **`{colors.success}`** / **`{colors.success-muted}`** — État OK (email envoyé, checklist validée, tuile verte). Jamais pour le chrome général.
- **`{colors.warning}`** / **`{colors.warning-muted}`** — En cours, en attente (signature, formulaire). Bandeau complétude Préparation.
- **`{colors.danger}`** / **`{colors.danger-muted}`** — Échec email, erreur bloquante. Alertes critiques Vue d'ensemble et Lancement.
- **Tokens shadcn non listés** (`background`, `foreground`, `muted`, `border`, `card`, `destructive`…) — hérités tels quels.

Éviter : dégradés décoratifs, plus de trois couleurs sémantiques en plus du primary client, rouge/vert pour autre chose que le statut métier.

## Typography

Corps et formulaires : stack shadcn. Hiérarchie retenue :

- **`page-title`** — Titres de section (Vue d'ensemble, Lancement, Bibliothèque).
- **`section-title`** — Titres de `Card` et sous-blocs.
- **`body`** — Texte courant, tableaux, récap lancement.
- **`caption`** — Métadonnées (dates, chemins fichiers, hints sous titres).

Pas de typo display/marketing. Le ton visuel est utilitaire.

## Layout & Spacing

- **Admin desktop-first** : sidebar fixe `{spacing.sidebar-width}` ; contenu dans `SidebarInset`.
- **Préparation** : colonne unique `{spacing.content-max-preparation}` — formulaire long, lisible.
- **Vue d'ensemble, Lancement, Bibliothèque** : `{spacing.content-max-default}` avec grilles tuiles / split pane.
- **Sidebar contextuelle** : une seule colonne — Mode App *ou* Mode Formation, jamais les deux (voir `EXPERIENCE.md`).
- **Responsive** : `< lg` → sidebar en `Sheet` + `SidebarTrigger` ; grilles tuiles passent en 2 puis 1 colonne.

Espacement : échelle Tailwind 4-based héritée (gap-4, p-6 sur cards).

## Elevation & Depth

Héritage shadcn — ombre légère sur `Dialog`, `Sheet`, barre de sélection Bibliothèque. Pas d'élévation comme hiérarchie décorative. Cards : bordure `{border}` plutôt qu'ombre.

## Shapes

`{rounded.md}` pour boutons et inputs ; `{rounded.lg}` pour cards et dialogs ; `{rounded.full}` pour badges statut formation uniquement.

## Components

Composants shadcn **sans customization** (sauf variante `primary` mappée sur `{colors.primary}`) : `Button`, `Card`, `Input`, `Label`, `Select`, `Checkbox`, `Table`, `AlertDialog`, `Sheet`, `Sidebar`, `Badge`, `Toast`, `Skeleton`.

Composants métier (spec visuelle) :

| Composant | Spec |
|-----------|------|
| **Sidebar item actif** | `{components.sidebar-active-item}` — fond bleu pâle, texte `{colors.primary}` |
| **Badge statut formation** | Variantes par statut PRD — voir `{components.status-badge-*}` |
| **Stepper Qualiopi** | 4 étapes ; done = fond `{colors.success-muted}` ; current = bordure `{colors.primary}` |
| **Tuile métrique** | Card compacte ; valeur grande ; détail coloré success/warning/danger |
| **Carte prochaine action** | `{components.next-action-card}` — une seule CTA primaire |
| **Bandeau alerte** | `{components.alert-critical}` ou `{components.alert-warning}` ; max 3 visibles |
| **Barre sélection Bibliothèque** | `{components.selection-bar}` — fixe bas de pane quand ≥1 fichier coché |
| **Zone devis obligatoire** | Bordure dashed ambre si manquant ; vert si importé |

→ Références : [`mockups/formation-overview.html`](mockups/formation-overview.html), [`mockups/formation-lancement.html`](mockups/formation-lancement.html), [`mockups/bibliotheque.html`](mockups/bibliotheque.html), [`mockups/formation-preparation.html`](mockups/formation-preparation.html)

## Do's and Don'ts

| Do | Don't |
|----|-------|
| Hériter shadcn pour 80 % de l'UI | Recréer des composants custom équivalents |
| Personnaliser `{colors.primary}` par instance client | Imposer une palette unique globale en v1 |
| Couleurs sémantiques uniquement pour statut métier | Utiliser le rouge pour « attirer l'œil » sans échec réel |
| Une action primaire par écran (prochaine action) | Empiler 4 boutons « Lancer / Passer en cours / … » au même niveau |
| Sidebar unique (contextuelle) | Double sidebar app + formation |
| Confirmation `AlertDialog` avant lancement | Bouton « Lancer » sans récap |
