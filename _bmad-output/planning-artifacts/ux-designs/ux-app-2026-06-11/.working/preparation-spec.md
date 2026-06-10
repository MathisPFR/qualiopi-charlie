# Préparation — fiche formation (Discovery)

> Section formation · OQ-7 tranché · aligné POC fields + PRD FR-11–14

## Surface

| Propriété | Valeur |
|-----------|--------|
| Route | `/formations/{id}/preparation` |
| Nav | Sidebar contextuelle · **Préparation** active |
| Accès création | Liste → « Nouvelle formation » crée brouillon minimal → redirige ici |
| Édition | Tant que BROUILLON (post-lancement : champs verrouillés selon règles PRD) |

## Objectif

Anne-Hélène remplit **toute la fiche** avant le lancement, sans scroll infini ni jargon. Elle comprend la différence **modèle du catalogue** vs **cette formation**.

---

## OQ-7 — Formation Type (tranché)

**Pas de wizard multi-étapes.** Choix en **3 cartes radio** en haut de la page :

| Option | Qui | Comportement |
|--------|-----|--------------|
| **Partir de zéro** | Tous | Aucun pré-remplissage catalogue |
| **Utiliser un modèle du catalogue** | Tous | Affiche `Select` des Types actifs · preview « Ce modèle apporte : programme, … » · pré-remplit champs héritables |
| **Créer un modèle du catalogue** | ADMIN seul | Panneau inline : nom du modèle + upload programme · enregistre Type + lie à cette formation |

**Nommage UI (éviter confusion Type/instance) :**

| Concept PRD | Libellé UI |
|-------------|------------|
| Formation Type | **Modèle du catalogue** (section) · « Type » dans nav admin Types |
| Formation instance | **Cette formation** (sous-titre sections) |

Helper sous les cartes : *« Le modèle pré-remplit programme et documents par défaut. Dates, stagiaires et devis restent propres à cette session. »*

OPERATEUR : option « Créer un modèle » masquée · lien « Gérer les modèles → » vers Types (ADMIN).

---

## Structure page (ordre vertical)

### 1. En-tête

- Titre : **Préparation**
- Sous-titre : *« Complétez la fiche avant le lancement. »*

### 2. Bandeau complétude (sticky optionnel)

Calculé comme checklist Lancement :

> **Il reste 2 éléments** avant de pouvoir lancer : devis manquant · 1 stagiaire sans email

Liens ancre vers la section concernée. Tout OK → bandeau vert *« Fiche prête — vous pouvez passer au lancement »* + bouton secondaire.

### 3. Section — Modèle du catalogue (optionnel)

Cartes radio + select/panel conditionnel (voir OQ-7).

### 4. Section — Informations de cette formation

Card shadcn · champs POC :
- Intitulé interne · intitulé commercial · nom client (dossiers)
- Dates début/fin · lieu · modalité · durée · tarifs · formateur · code convention

### 5. Section — Entreprise cliente

Raison sociale · email · adresse · CP · ville

### 6. Section — Stagiaires

Éditeur lignes (prénom, nom, email) · ajouter / supprimer · validation email visible

### 7. Section — Séances

Éditeur lignes : date · heure début/fin · intitulé · case **Inclure dans l'émargement** (liée aux feuilles d'émargement et signatures par séance).

- Bouton **« Proposer une séance par jour »** — pré-remplit entre date début et fin (comportement POC conservé)
- **+ Ajouter une séance** — ligne manuelle
- Suppression par ligne (×)

Helper : *« Chaque séance apparaît sur les feuilles d'émargement. »*

### 8. Section — Objectifs

Liste éditable · **+ Ajouter un objectif** · suppression par ligne

### 9. Section — Devis (obligatoire)

Intégré ici (plus sur vue d'ensemble). Zone upload drag ou bouton · état vert/ambre · rappel *« Envoyé à l'entreprise au lancement, pas aux stagiaires »*

### 10. Barre d'actions (bas)

- **Enregistrer** (primary) — sauvegarde sans quitter
- **Annuler les modifications** (outline) — si dirty
- Pas de « Lancer » ici — renvoie vers section Lancement

Auto-save `[ASSUMPTION]` — option v1.1 ; v1 bouton Enregistrer explicite (clarté pour public peu tech).

---

## Création « Nouvelle formation »

Depuis liste Formations :

1. Clic **Nouvelle formation**
2. Dialog léger *« Nom de cette formation »* (intitulé interne minimum) OU création silencieuse « Nouvelle formation » datée
3. Redirect `/formations/{id}/preparation` avec modèle = « Partir de zéro » par défaut

Évite page `/formations/new` séparée du shell formation.

---

## États

| État | Traitement |
|------|------------|
| Champs invalides | Message sous section · scroll vers première erreur au save |
| Type sélectionné mid-edit | Toast *« Champs pré-remplis depuis le modèle — vérifiez avant enregistrement »* |
| Post-lancement | Bandeau *« Formation lancée — certaines informations ne sont plus modifiables »* · champs sensibles disabled |

---

## Maquette

→ `.working/key-formation-preparation.html` — modèle sélectionné + bandeau complétude + sections
