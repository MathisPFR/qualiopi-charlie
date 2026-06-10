# Bibliothèque globale (Discovery)

> Drive transversal · sidebar **Mode App** · aligné PRD §2.5 + décisions `.decision-log.md`

## Surface

| Propriété | Valeur |
|-----------|--------|
| Route | `/bibliotheque` (+ `/bibliotheque?formation={id}` pour deep-link) |
| Nav | Mode application — **Bibliothèque** active |
| Rôle | Tous (ADMIN + OPERATEUR) — lecture + téléchargement ; pas d'édition fichiers ici |

## Objectif utilisateur

Anne-Hélène retrouve **tous les documents de toutes les formations** en un endroit, rangés comme sur le disque Qualiopi, sans ouvrir chaque fiche formation. Export audit (ZIP) en quelques clics.

---

## Layout (desktop)

```
┌─ Sidebar app ──┬─ Contenu Bibliothèque ─────────────────────────────┐
│ Formations     │  Bibliothèque                                        │
│ Bibliothèque ● │  [Rechercher formation ou fichier…        ] [Actualiser]│
│ Types…         │  ┌─ Arbre ──────────┬─ Aperçu / détail ──────────────┐│
│ Paramètres     │  │ ▼ Formation A    │  [iframe PDF ou meta fichier]  ││
│                │  │   ▼ avant-la-f.  │                                ││
│                │  │     □ conv.pdf   │  Nom · taille · date             ││
│                │  │   ▶ pendant…     │  [Télécharger] [Ouvrir onglet] ││
│                │  │ ▶ Formation B    │                                ││
│                │  └──────────────────┴────────────────────────────────┘│
│                │  [Barre sélection : N fichiers · Télécharger · ZIP]     │
└────────────────┴──────────────────────────────────────────────────────────┘
```

**Pattern shadcn :** `Card` + split pane (comme POC `FormationDrive`, généralisé). Pas de double sidebar.

---

## Arborescence

Racine = **une entrée par formation** (dossier virtuel).

**Nom affiché :** `{intitulé formation} — {nom client}`  
Troncature avec tooltip si > ~40 caractères.

**Sous-dossiers fixes (ordre Qualiopi) :**

| Dossier | Contenu |
|---------|---------|
| `avant-la-formation/` | Convention, devis signé, règlements, livrets… |
| `pendant-la-formation/` | Émargements |
| `apres-la-formation/` | Certificats, attestations, réponses formulaires PDF |
| `preuves-qualiopi/` | Preuves d'envoi, preuves eval |
| `originaux/` | Fichiers uploadés par l'opérateur (devis source, programme DOCX/PDF…) |

Dossier formation **absent** tant qu'aucun fichier (pas de lancement) — ou grisé « Aucun document » avec lien vers la formation.

---

## Interactions

### Navigation arbre

- Clic **formation** → expand/collapse (chevron) ou sélection highlight
- Clic **dossier phase** → expand fichiers
- Clic **fichier** → aperçu à droite (PDF iframe) ; non-PDF → message + bouton Télécharger

### Recherche

- Filtre instantané sur : nom formation, nom client, nom fichier
- Résultats : liste plate avec breadcrumb `Formation — phase / fichier` ; clic → scroll/select dans l'arbre

### Sélection multiple

- Checkbox sur chaque fichier (pas sur dossiers formation entiers en v1 — sélectionner fichiers dans un dossier phase ou multi-fichiers cross-folder via recherche)
- **v1 simplification validée coaching :** checkbox fichier ; bouton « Tout sélectionner dans ce dossier » sur un dossier phase ouvert
- Barre d'actions sticky en bas quand ≥1 sélection :
  - **Télécharger** (N) — fichiers individuels en ZIP si N>1 sans export dossier complet
  - **Exporter en ZIP** — archive nommée `{formation}-{phase}-{date}.zip` ou `{formation}-selection.zip`

### Actions fichier (sans sélection)

- Télécharger
- Ouvrir dans un onglet
- *(optionnel v1)* « Voir la formation → » lien vers fiche Documents

### Export dossier complet

- Clic droit ou menu `⋯` sur dossier phase → **Exporter ce dossier (ZIP)**
- Menu `⋯` sur racine formation → **Exporter toute la formation (ZIP)**

---

## États vides & erreurs

| État | Message |
|------|---------|
| Aucune formation | « Aucune formation pour le moment. » + CTA Nouvelle formation |
| Formation sans docs | Dossier grisé · « Les documents apparaîtront après le lancement. » |
| Aperçu indisponible | « Aperçu non disponible. Téléchargez le fichier. » |
| Erreur chargement | Bandeau rouge + Actualiser |

---

## Lien fiche formation

Section **Documents** (formation) = même arbre, scope local.  
Bouton en haut : **« Ouvrir dans la Bibliothèque »** → deep-link `/bibliotheque?formation={id}` avec formation pré-expand.

---

## Voice (microcopy)

| Élément | Texte |
|---------|-------|
| Titre page | Bibliothèque |
| Sous-titre | Tous les documents de vos formations, prêts pour l'audit. |
| Placeholder recherche | Rechercher une formation ou un fichier… |
| Barre sélection | {N} fichier(s) sélectionné(s) |
| ZIP formation | Exporter toute la formation |
| ZIP dossier | Exporter ce dossier |

---

## Maquette

→ `.working/key-bibliotheque.html` — vue split + sélection + barre ZIP
