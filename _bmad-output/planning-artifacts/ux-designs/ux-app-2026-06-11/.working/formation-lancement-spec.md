# Écran Lancement (Discovery)

> Suite de `formation-ia-vue-ensemble.md` · sidebar contextuelle · garde-fous PRD FR-20–FR-27

## Deux états principaux

| État | Statut formation | Contenu écran |
|------|------------------|---------------|
| **A — Prêt à lancer** | BROUILLON | Checklist auto · récap destinataires · CTA « Vérifier et lancer » → dialog |
| **B — Lancement exécuté** | A_LANCER (+) | Table statuts par destinataire · relances · pas de re-lancement global accidentel |

La maquette HTML montre **A avec dialog ouvert** + **B en dessous** (deux colonnes viewport).

---

## État A — Avant lancement

### Blocs (ordre)

1. **Titre section** — « Lancement » + sous-titre rassurant : *« Vérifiez ce qui va partir avant de confirmer. »*
2. **Checklist pré-requis** (calculée, non cochable manuellement)
   - Devis importé
   - Au moins 1 stagiaire avec email valide
   - Entreprise renseignée (si config l'exige)
   - Champs obligatoires de la fiche complets
   - Item en échec = lien vers Préparation + message explicite
3. **Récap « Ce qui va se passer »** — langage humain, listes par bloc :
   - **Documents générés** (convention, règlements, etc.)
   - **Emails stagiaires** (N personnes — PJ + lien formulaire besoins + signature règlement)
   - **Email entreprise** (Sophie — convention, devis, CGV + formulaire + signatures)
   - **Preuves Qualiopi** — mention discrète en bas
4. **Actions**
   - Primaire : **« Vérifier et lancer »** — ouvre `AlertDialog` (disabled si checklist incomplète)
   - Secondaire outline : « Retour à la préparation »
   - Pas de bouton « Lancer » sans étape intermédiaire

### Dialog `AlertDialog` — « Confirmer le lancement ? »

- Titre : **Confirmer le lancement ?**
- Corps : résumé condensé (3 lignes max) + rappel *« Cette action enverra des emails réels. »*
- Liste bullet des destinataires (prénom + email tronqué)
- Boutons :
  - **Annuler** (outline, focus safe)
  - **Confirmer et lancer** (destructive ou primary selon thème client — action forte)
- Pendant exécution : dialog → progress « Lancement en cours… » · barre indéterminée · texte *« Ne fermez pas cette page. »*
- Succès : toast + redirect Vue d'ensemble · échec partiel : rester sur Lancement état B

---

## État B — Après lancement (suivi)

Affiché quand `conventionGenerated` ou équivalent. **Pas** de gros bouton « Relancer tout » en primaire.

### Bandeau résumé

- Vert : « Lancement terminé — tout est OK » (si 100 %)
- Ambre/rouge : « Lancement terminé avec des erreurs » + compteur

### Table « Statut par destinataire »

Colonnes : Destinataire · Email · Documents · Signature · Action

| Ligne type | Email | Documents | Signature | Action |
|------------|-------|-----------|-----------|--------|
| Sophie Martin (Entreprise) | ✓ Envoyé | ✓ OK | En attente | — |
| Marc Dupont | ✓ Envoyé | ✓ OK | En attente | — |
| Julie Bernard | ✗ Échec | ✓ OK | — | **Relancer l'email** |

- Erreur expandable sous la ligne (message humain du provider)
- Relancer = action unitaire, pas relance globale
- Force re-launch (ADMIN) : lien discret « Relancer le lancement complet » avec second dialog d'avertissement — hors chemin principal

### Section documents générés (condensée)

Liste courte des docs créés à l'instant T + lien « Voir tous les documents → » (section Documents)

---

## Microcopy (Voice)

| Contexte | Texte |
|----------|-------|
| CTA pré-lancement | Vérifier et lancer |
| Dialog titre | Confirmer le lancement ? |
| Dialog corps | Des emails seront envoyés aux stagiaires et à l'entreprise. Les signatures seront demandées par email. |
| Progress | Lancement en cours… |
| Retry | Relancer l'email |
| Erreur email | L'email n'a pas pu être envoyé : {raison lisible} |

Ton : sobre, pro, pas de « 🚀 » · pas de jargon technique (SMTP, webhook).

---

## Maquette

→ `.working/key-formation-lancement.html`
