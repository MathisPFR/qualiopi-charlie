# Formation IA + Vue d'ensemble (Discovery)

> Décisions source : `.decision-log.md` · Option A · shadcn/ui · desktop-first admin

## Navigation — une seule sidebar (contextuelle)

**Problème évité :** double colonne (nav app + nav formation) — source de confusion pour utilisateurs peu à l'aise.

**Pattern retenu :** sidebar contextuelle shadcn (`Sidebar` + swap de `SidebarGroup` selon la route). Références : [shadcn Sidebar](https://ui.shadcn.com/docs/components/radix/sidebar), blocs nested sub-menus, pattern « two column » écarté volontairement.

### Mode A — Application (routes `/`, `/bibliotheque`, `/types`, `/parametres`)

| Entrée | Rôle |
|--------|------|
| **Formations** | Liste des formations |
| **Bibliothèque** | Drive global |
| **Types de formation** | ADMIN — catalogue |
| **Paramètres** | ADMIN — règles instance + **thème client** (couleurs, logo) |

Footer sidebar : compte utilisateur, déconnexion.

### Mode B — Formation (routes `/formations/{id}/*`)

La **même** sidebar remplace son contenu :

```
SidebarHeader
  Logo instance (compact)
  ← Toutes les formations          ← seule sortie vers Mode A

SidebarGroup « Cette formation »
  [Titre formation tronqué]
  [Client · badge statut]

  · Vue d'ensemble    (default)
  · Préparation
  · Lancement
  · En cours
  · Clôture
  · Documents

SidebarFooter
  Compte · Déconnexion
```

| Section | Route | Contenu |
|---------|-------|---------|
| **Vue d'ensemble** | `/formations/{id}` | Statut, alertes, prochaine action, tuiles |
| **Préparation** | `…/preparation` | Fiche, devis, stagiaires, séances, Type |
| **Lancement** | `…/lancement` | Checklist, confirmation, statuts envoi/signature |
| **En cours** | `…/en-cours` | Émargements PDF / signature digitale |
| **Clôture** | `…/cloture` | TERMINEE, évaluations, certificats |
| **Documents** | `…/documents` | Drive local (même arborescence que Bibliothèque) |

**Implémentation shadcn :** un seul `(dashboard)/layout.tsx` avec `SidebarProvider` ; composant `AppSidebar` lit `usePathname()` et rend `NavApp` ou `NavFormation` — jamais les deux.

**Responsive :** desktop = sidebar fixe ; tablette/mobile = `Sheet` + `SidebarTrigger` (même config, pas de double logique).

**Alternative documentée (non retenue) :** sidebar app fixe + onglets horizontaux formation dans le contenu — familier mais deux systèmes de nav visibles ; rejeté au profit du swap contextuel.

## Vue d'ensemble — blocs (ordre vertical)

### 1. En-tête formation (persistant sur toutes les sections)

- Intitulé + badge statut (Brouillon → Archivée)
- Sous-titre : client · dates · modalité · durée
- Fil d'Ariane : Formations → {intitulé}

### 2. Parcours Qualiopi (stepper compact)

4 étapes : Préparation · Lancement · En cours · Clôture  
Étape courante surlignée ; étapes passées avec ✓ vert.  
Clic sur une étape → navigue vers la section correspondante.

### 3. Bandeau alertes (conditionnel)

Visible seulement s'il y a un problème ou une action urgente.

| Priorité | Exemple | Action |
|----------|---------|--------|
| Critique | 2 emails en échec | Lien → Lancement · Relancer |
| Attention | 1 signature en attente (entreprise) | Lien → Lancement ou En cours |
| Info | Devis manquant (brouillon) | Lien → Préparation |

Max 3 alertes visibles ; « Voir tout » si plus.

### 4. Carte « Prochaine action »

**Une seule** action principale — jamais 4 boutons équivalents.

| Statut formation | Prochaine action |
|------------------|----------------|
| BROUILLON, devis manquant | « Importer le devis » → Préparation |
| BROUILLON, prêt | « Vérifier et lancer » → Lancement (checklist) |
| A_LANCER | « Passer en cours » → confirmation → En cours |
| EN_COURS | « Voir les émargements » ou « Terminer la formation » selon état |
| TERMINEE | « Voir la clôture » ou « Archiver » |

Bouton secondaire discret : « Modifier la fiche » → Préparation.

### 5. Tableau de bord suivi (4 tuiles)

Tuiles cliquables — renvoient vers la section détail.

| Tuile | Métrique | Détail au clic |
|-------|----------|----------------|
| **Emails** | X/Y envoyés · Z échecs | Lancement |
| **Signatures** | X/Y signées · Z en attente | Lancement |
| **Formulaires** | X/Y réponses | En cours ou Clôture selon phase |
| **Émargements** | X/Y complétés | En cours |

Code couleur : vert OK · ambre en cours · rouge échec · gris pas encore concerné.

### 6. Résumé participants (condensé)

- Entreprise : nom + statut formulaires/signatures (1 ligne)
- Stagiaires : liste compacte (max 5 visibles + « +N ») avec pastille statut globale par personne

Lien « Voir le détail » → section phase pertinente (Lancement / En cours).

### 7. Raccourci documents

« 24 fichiers · Dernière mise à jour il y a 2 h » → Documents

---

## Garde-fous (Lancement et transitions)

**Pas d'annulation automatique post-lancement** — correction = relancer un envoi, pas « dé-lancer ».

### Flux « Vérifier et lancer » (section Lancement)

1. Checklist obligatoire cochée visuellement (pas de cases à cocher manuelles — système calcule) :
   - Devis importé
   - Au moins 1 stagiaire avec email
   - Entreprise renseignée (si requis par config)
   - Champs obligatoires complets
2. Récap en langage clair :
   - « 3 stagiaires recevront un email avec… »
   - « Sophie (entreprise) recevra… »
   - « Les signatures suivantes seront demandées… »
3. Bouton primaire : **« Confirmer et lancer »** (pas « Lancer » seul)
4. Dialog shadcn `AlertDialog` — second clic requis
5. Pendant exécution : progress + impossibilité de quitter sans avertissement
6. Succès → retour Vue d'ensemble avec tuiles mises à jour

Même pattern pour **Passer en cours** et **Terminer la formation** avec récap adapté.

---

## Bibliothèque globale

### Structure arborescence

```
Bibliothèque/
├── Formation commercial B2B — Acme SA/
│   ├── avant-la-formation/
│   ├── pendant-la-formation/
│   ├── apres-la-formation/
│   ├── preuves-qualiopi/
│   └── originaux/          ← devis uploadé, programme source, etc.
├── Management d'équipe — Beta Corp/
│   └── ...
```

Nom dossier racine : `{intitulé formation} — {nom client}` (tronquer avec tooltip si long).

### Actions

- Clic fichier → aperçu PDF inline ou téléchargement
- Sélection multiple (checkbox) → barre d'actions : Télécharger · Exporter ZIP
- Clic dossier formation → expand ou navigation breadcrumb
- Filtre recherche texte (nom fichier, formation)

### Lien avec fiche formation

Section **Documents** = même arbre, scope une formation. Bouton « Ouvrir dans la Bibliothèque » pour contexte global.

---

## Maquettes

→ `.working/key-formation-overview.html` — Vue d'ensemble  
→ `.working/key-formation-lancement.html` — Lancement (états A + B)  
→ `.working/formation-lancement-spec.md` — spec détaillée Lancement  
→ `.working/key-bibliotheque.html` — Bibliothèque globale  
→ `.working/bibliotheque-spec.md` — spec Bibliothèque  
→ `.working/key-formation-preparation.html` — Préparation  
→ `.working/preparation-spec.md` — spec Préparation + OQ-7
