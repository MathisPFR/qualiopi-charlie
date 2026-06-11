---
workflowType: research
research_type: technical
research_topic: Bloc F — UX & frontend (refonte admin)
date: 2026-06-11
user_name: Root
---

# Research Report: technical — Bloc F (UX & frontend)

## Contexte

- **UX finalisée** : `EXPERIENCE.md` + `DESIGN.md` + 4 maquettes HTML validées
- **POC** : header horizontal `DashboardNav` ; fiche formation **monolithique** (`formations/[id]/page.tsx` ~250 lignes tout-en-un)
- **PRD** : admin desktop-first ; rôles ADMIN/OPERATEUR ; pas de refonte formulaires publics v1
- **Stack** : Next.js 15 App Router · shadcn partiel (button, card, dialog, tabs…) · **pas encore** composant Sidebar

---

## F0 — Écart POC → cible UX

| Aspect | POC actuel | Cible v1 (locked UX) |
|--------|------------|----------------------|
| Navigation | Header top 2 liens | **Sidebar contextuelle** (App ↔ Formation) |
| Formation | 1 page scroll | **6 routes** par phase Qualiopi |
| Drive | `FormationDrive` par formation | **Bibliothèque globale** + Documents formation |
| Lancement | Boutons empilés + test tools POC | Checklist + AlertDialog + table suivi |
| Branding | `text-primary` fixe | **CSS variables** depuis `InstanceSettings` |
| Nom app | « POC Charlie » hardcodé | `orgName` instance |

---

## F1 — Architecture routes (App Router)

### Mode App

```
app/(dashboard)/
  layout.tsx              ← SidebarProvider + AppSidebar
  page.tsx                ← Liste formations (/)
  bibliotheque/page.tsx   ← Drive global
  types/page.tsx          ← ADMIN — Formation Types
  parametres/
    page.tsx              ← ADMIN hub
    compte/page.tsx       ← Tous — MDP
    organisation/page.tsx
    integrations/brevo/page.tsx
    utilisateurs/page.tsx
    ...
  formations/
    new/page.tsx          ← redirect Préparation après create
    [id]/
      layout.tsx          ← contexte formation (titre, statut) optionnel
      page.tsx            ← Vue d'ensemble
      preparation/page.tsx
      lancement/page.tsx
      en-cours/page.tsx
      cloture/page.tsx
      documents/page.tsx
```

### Auth / public (inchangé)

- `/login`, `/f/[slug]/[formType]`, `/auth/activer`, `/auth/reinitialiser` (bloc B)

### Layout formation

`usePathname()` détecte `/formations/[id]/*` → sidebar **Mode Formation** avec 6 entrées + lien « ← Toutes les formations ».

---

## F2 — Sidebar shadcn ([doc officielle](https://ui.shadcn.com/docs/components/sidebar))

### Installation

```bash
npx shadcn@latest add sidebar sheet alert-dialog skeleton badge
```

Composants additionnels selon écrans : `table`, `checkbox`, `progress`, `scroll-area`.

### Structure

```tsx
// app/(dashboard)/layout.tsx
<SidebarProvider defaultOpen={cookie}>
  <AppSidebar />           {/* client — swap NavApp | NavFormation */}
  <SidebarInset>
    <header><SidebarTrigger /> … breadcrumb optionnel</header>
    {children}
  </SidebarInset>
</SidebarProvider>
```

**`AppSidebar`** (client component) :
- `pathname.startsWith("/formations/") && id` → `NavFormation`
- sinon → `NavApp` (filtré par `session.user.role`)

**Mobile** (`< lg`) : sidebar en `Sheet` — natif shadcn Sidebar.

**Pas de double sidebar** — règle UX verrouillée.

### Nav par rôle

| Entrée | ADMIN | OPERATEUR |
|--------|-------|-----------|
| Formations | ✅ | ✅ |
| Bibliothèque | ✅ | ✅ |
| Types de formation | ✅ | ❌ masqué |
| Paramètres | ✅ | ❌ (sauf lien Mon compte footer) |

---

## F3 — Theming instance (DESIGN.md + bloc B5)

### CSS variables dynamiques

```css
/* globals.css — défauts DESIGN.md */
:root {
  --primary: 217 91% 60%;   /* #2563EB */
  ...
}
```

Server layout lit `getInstanceConfig()` → injecte `<style>` ou `data-theme` :

```tsx
<style>{`:root { --primary: ${hslPrimary}; }`}</style>
```

**Logo** : `InstanceSettings.logoR2Key` → URL signée R2 dans sidebar header.

**Pas de thème dark v1** — light only (UX decision-log).

---

## F4 — Écrans : mapping POC → composants

| Écran | Réutilise POC | Nouveau |
|-------|---------------|---------|
| **Vue d'ensemble** | `FormationStatutBadge`, flags formation | Stepper, tuiles métriques, prochaine action, alertes |
| **Préparation** | `FormationForm`, `DevisUpload`, séances partiel | Cartes radio Type, bandeau complétude |
| **Lancement** | `FormationActions` (logique) | Checklist, AlertDialog, table `EmailDelivery` + `SignatureRequest` |
| **En cours** | workflow émargements | UI séance + envoi signature (OQ-6) |
| **Clôture** | `fin-formation` workflow | Dialog confirmation + tuiles |
| **Documents** | `FormationDrive` | Split pane — même composant `DocumentBrowser` |
| **Bibliothèque** | — | `DocumentBrowser` global + ZIP export |

**POC à retirer de l'UI prod** :
- Bandeau « Zoho Sign hors périmètre »
- `FormationTestTools` → garder test email (bloc D) mais **hors** écran Lancement principal (section discrète ou Paramètres)

---

## F5 — Bibliothèque & ZIP (R2)

Arborescence UX (EXPERIENCE.md) = clés R2 :

```
{formationId}/avant-la-formation/
{formationId}/pendant-la-formation/
{formationId}/apres-la-formation/
{formationId}/preuves-qualiopi/
{formationId}/originaux/
```

**`DocumentBrowser`** (composant partagé) :
- Arbre formations (liste Prisma + prefix R2)
- Aperçu PDF : iframe URL signée R2 courte durée
- Sélection → **ZIP** : Server Action `archiver` ou `jszip` stream → download

Deep-link : `/bibliotheque?formation={id}`.

---

## F6 — Formulaires publics (F3 scope)

**Décision UX locked** : pas de mock dédié v1.

- Garder `/f/[slug]/[formType]` existant
- Polish minimal : labels, espacement mobile, logo instance en header
- Pas de refonte visuelle lourde — **hors scope bloc F implémentation majeure**

---

## F7 — Données UI (server components)

Pattern recommandé :

```tsx
// formations/[id]/page.tsx — Vue d'ensemble
const formation = await getFormation(id);
const emailStats = await getEmailDeliverySummary(formation.id);
const signatureStats = await getSignatureSummary(formation.id);
```

Éviter client state pour données métier — Server Components + Server Actions (pattern POC conservé).

**Loading** : `loading.tsx` par segment avec `Skeleton` calé sur maquettes.

---

## F8 — Accessibilité & responsive

Reprendre **Accessibility Floor** EXPERIENCE.md :
- `AlertDialog` focus trap lancement
- `aria-live` sur alertes email
- Sidebar Sheet mobile
- Contraste `{colors.primary}` instance — validation ADMIN à la config

---

## F9 — Phases implémentation (ordre recommandé)

| Phase | Livrable |
|-------|----------|
| **F-a** | Sidebar + routes squelette (pages vides) + nav rôles |
| **F-b** | Theming `InstanceSettings` + logo |
| **F-c** | **Vue d'ensemble** + découpage formation monolithique |
| **F-d** | **Préparation** + **Lancement** (UX critique) |
| **F-e** | `DocumentBrowser` + Bibliothèque + Documents |
| **F-f** | En cours · Clôture · Types · Paramètres shells |
| **F-g** | Polish formulaires publics + a11y pass |

**Stratégie** : refonte **incrémentale** — chaque phase remplace une portion du monolithe sans big-bang.

---

## F10 — Hors scope v1 (rappel UX)

- Wizard création formation
- Annulation post-lancement
- Double sidebar
- Dark mode
- Auto-save Préparation

---

## Décisions proposées

| ID | Proposition | Statut |
|----|-------------|--------|
| F1 | Implémenter **EXPERIENCE.md** tel quel — maquettes = référence | ✅ Locked |
| F2 | **shadcn Sidebar** swap App/Formation ; cookie état | ✅ Locked |
| F3 | Formulaires publics : **héritage POC** + polish léger | ✅ Locked |
| F4 | Theming **CSS variables** depuis `InstanceSettings` | ✅ Locked |
| F5 | `DocumentBrowser` partagé Bibliothèque + Documents ; ZIP server | ✅ Locked |
| F6 | Refonte **incrémentale** par phase (pas freeze features) | ✅ Locked |
| F7 | Nav **Bibliothèque** (nom locked UX) | ✅ Locked |
| F8 | Retirer hardcodes « POC Charlie » / Zoho | ✅ Locked |
| F9 | **MCP-first** : tests E2E navigateur, vérifs UI → MCP browser Cursor quand dispo | ✅ Locked |

---

## Sources

- [`EXPERIENCE.md`](../ux-designs/ux-app-2026-06-11/EXPERIENCE.md)
- [`DESIGN.md`](../ux-designs/ux-app-2026-06-11/DESIGN.md)
- [shadcn Sidebar](https://ui.shadcn.com/docs/components/sidebar)
- POC : `src/app/(dashboard)/`, `src/components/dashboard-nav.tsx`
