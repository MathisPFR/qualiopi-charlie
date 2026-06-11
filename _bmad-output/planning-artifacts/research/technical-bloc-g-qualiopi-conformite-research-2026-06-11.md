---
workflowType: research
research_type: technical
research_topic: Bloc G — Conformité Qualiopi & preuves audit
date: 2026-06-11
user_name: Root
---

# Research Report: technical — Bloc G (Qualiopi)

## Contexte

- **OQ-3 PRD** : checklist audit Qualiopi — à documenter
- **Référentiel** : RNQ **V9** (guide de lecture janv. 2024, toujours en vigueur 2026) — 7 critères, 32 indicateurs ([guide PDF officiel](https://www.mfrdenaucelle.fr/medias/File/2025%202026/guide_de_lecture_qualiopi_v9_du_8_janvier_2024-2.pdf))
- **Principe auditeur** : preuves **datées, traçables, cohérentes** — pas une liste exhaustive de documents imposés ([Certifopac](https://certifopac.fr/qualiopi/referentiel/))
- **Périmètre app** : automatisation **administrative par formation** — pas un QMS complet (handicap, veille métier, réclamations process… restent hors app ou partiels)

---

## G0 — Ce que l'app couvre vs hors scope

| Couvert par Qualiopi Charlie v1 | Hors scope app (processus org) |
|---------------------------------|--------------------------------|
| Docs contractuels + signatures (conv., RI, devis) | Politique accessibilité handicap (ind. 26) |
| Preuves envoi email | Veille réglementaire / veille métier |
| Formulaires besoins / évaluations | Analyse des besoins **amont** commercial (ind. 1) |
| Émargements PDF ou signés | Réclamations — workflow dédié ind. 16 (v1.1) |
| Certificats, attestations, preuves PDF | Sous-traitance / contrats prestataires (ind. 27) |
| Archivage R2 + export ZIP Bibliothèque | Programme détaillé pédagogique (contenu métier) |
| Traçabilité automation (`EmailDelivery`, `SignatureRequest`, `AutomationRun`) | Qualification formateurs (ind. 21) |

**North star audit app** : pour une formation donnée, l'auditeur peut ouvrir **Bibliothèque → formation → ZIP** et reconstituer le dossier session.

---

## G1 — Mapping indicateurs ↔ artefacts app (OF formation — tronc commun)

> Indicateurs **directement alimentés** par les workflows v1. Les autres restent responsabilité documentaire / processus client hors app.

### Critère 2 — Objectifs et adaptation des prestations

| Ind. | Objet | Artefact app | Emplacement R2 |
|------|-------|--------------|----------------|
| **4** | Analyse du besoin | Synthèse PDF formulaire **besoins stagiaire/entreprise** | `apres-la-formation/` ou `preuves-qualiopi/` |
| **5** | Objectifs / évaluation | Formulaires **éval chaud/froid** + synthèses PDF | `apres-la-formation/` |
| **8** | Convention / contrat | **Convention** PDF + **signée** (Documenso) | `avant-la-formation/` |
| **6–7** | Positionnement / adaptation | Programme PDF (si envoyé) + données formation | `originaux/` + fiche |

### Critère 3 — Accueil, accompagnement, suivi, évaluation

| Ind. | Objet | Artefact app | Emplacement R2 |
|------|-------|--------------|----------------|
| **9** | Conditions déroulement | **Règlement intérieur** signé + emails lancement | `avant-la-formation/` |
| **10** | Émargement | **Émargement** PDF ou signé digital | `pendant-la-formation/` |
| **11** | Évaluation atteinte objectifs | **Éval à chaud** + entreprise | `apres-la-formation/` |
| **12** | Accompagnement | Preuves envoi + formulaires (partiel) | `preuves-qualiopi/` |
| **15** | Éval à froid / impact | Workflow **éval à froid** M+2 | `apres-la-formation/` |
| **16** | Réclamations | ⚠️ **Hors v1** — export emails/logs possible | — |

### Critère 4 — Moyens (partiel)

| Ind. | Objet | Artefact app |
|------|-------|--------------|
| **18–20** | Ressources pédagogiques | Programme, livret (si généré), docs déposés |

### Critère 7 — Amélioration continue (partiel)

| Ind. | Objet | Artefact app |
|------|-------|--------------|
| **30–32** | Recueil appréciations | Agrégat évaluations (export manuel v1 ; dashboard v2) |

---

## G2 — Dossier type par formation (checklist auditeur)

Structure R2 alignée UX + Qualiopi :

```
{formationId}/
  avant-la-formation/
    □ Convention-{client}.pdf          [signée entreprise]
    □ Reglement-interieur.pdf          [signé chaque stagiaire — ou preuve par stagiaire]
    □ Devis.pdf                        [signé entreprise]
    □ CGV.pdf                          [si template actif]
    □ Programme.pdf                    [si règle client]
  pendant-la-formation/
    □ Emargement-{stagiaire}.pdf       [ou preuves signature digitale]
  apres-la-formation/
    □ Certificat / Attestation
    □ Synthèses formulaires (besoins, éval)
  preuves-qualiopi/
    □ Preuve_envoi_stagiaire_*.pdf
    □ Preuve_envoi_entreprise_*.pdf
    □ Preuve_envoi_eval_froid_*.pdf
  originaux/
    □ Devis uploadé source
    □ Programme source
```

**Export audit** : Bibliothèque → sélection formation → **ZIP** (bloc F).

---

## G3 — Preuves système (traçabilité technique)

| Preuve | Source | Utilité audit |
|--------|--------|---------------|
| PDF preuve envoi email | Workflow (existant POC) | Ind. 9, 12 — trace envoi |
| `EmailDelivery` | DB | Date, destinataire, statut |
| `SignatureRequest` + audit Documenso | DB + export | Ind. 8, 9 — consentement |
| `FormSubmission` + PDF | DB + R2 | Ind. 4, 5, 11, 15 |
| `AutomationRun` | DB | Journal technique litiges |

**Recommandation v1** : bouton ADMIN **« Exporter dossier audit formation »** = ZIP R2 + `audit-summary.json` (métadonnées DB).

---

## G4 — Écarts & roadmap conformité

| Sujet | v1 | v1.1+ |
|-------|-----|-------|
| Module réclamations (ind. 16) | Processus manuel client | Ticket léger in-app |
| Handicap / accessibilité (ind. 26) | Hors app | Champ formation + doc |
| Tableau de bord synthèse évals (ind. 30–32) | Export manuel | Dashboard qualité |
| Sous-traitance (ind. 27) | Hors app | Lien doc prestataire |

---

## G5 — Validation terrain

1. **Audit blanc Anne-Hélène** (profil référence) avec ZIP d'une formation réelle
2. Ajuster checklist selon retour certificateur
3. Documenter dans `docs/QUALIOPI-AUDIT.md` (à créer à l'implémentation)

---

## G6 — MCP-first (QA & audit)

| Usage | Outil |
|-------|-------|
| Parcours opérateur bout-en-bout | **cursor-ide-browser** MCP |
| Vérif formulaires publics | MCP browser |
| Futurs MCP (email, storage…) | Priorité sur scripts custom |

---

## Décisions proposées

| ID | Proposition | Statut |
|----|-------------|--------|
| G1 | App = **dossier formation audit-ready** ; pas QMS complet | ✅ Locked |
| G2 | Arborescence R2 = checklist auditeur (§ G2) | ✅ Locked |
| G3 | Export ZIP + `audit-summary.json` v1 | ✅ Locked |
| G4 | Mapping indicateurs § G1 comme référence OQ-3 | ✅ Locked |
| G5 | Validation sur **1er audit réel** Anne-Hélène | ✅ Locked |
| G6 | Tests parcours audit → **MCP browser** | ✅ Locked |

---

## Sources

- [Guide de lecture Qualiopi V9 (PDF)](https://www.mfrdenaucelle.fr/medias/File/2025%202026/guide_de_lecture_qualiopi_v9_du_8_janvier_2024-2.pdf)
- [Certifopac — référentiel](https://certifopac.fr/qualiopi/referentiel/)
- PRD OQ-3 · CONTEXT POC Notion/Make
