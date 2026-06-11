# Suivi du temps — Qualiopi Charlie

> **Dernière mise à jour :** 2026-06-11  
> **Périmètre :** temps passé sur le projet via Cursor (dev, specs, recherche, docs) — pas le temps « hors écran » (réflexion seule, réunions client sans Cursor, etc.).

---

## Méthodologie

| Source | Ce qu’elle apporte | Limite |
|--------|-------------------|--------|
| **Commits Git** (`git log`) | Horodatage précis des livrables | Ne couvre pas le temps sans commit |
| **Transcripts Cursor** (`agent-transcripts/*.jsonl`) | Sessions identifiables, sujet, volume d’échanges | **Pas de timestamp par message** — seulement date de fichier (souvent = fin de session) |
| **Estimation** | Durée dérivée des plages de commits + densité des échanges | Fourchette indicative, pas un chronomètre |

**Règle d’estimation utilisée :**

- Plage entre premier et dernier commit d’une session + ~30 min de marge (setup, tests locaux).
- Sessions sans commit : ~15–20 min par message utilisateur « substantiel », plafonnée par le bon sens.
- Sessions courtes (1–4 messages) : 15–45 min.

Tu peux corriger les colonnes **Heures (réel)** si tu chronomètres toi-même — colonne laissée vide pour ça.

---

## Récapitulatif

| Période | Sessions | Heures estimées | Fourchette |
|---------|----------|-----------------|------------|
| 2026-06-05 → 2026-06-06 | POC initial | 7,0 h | 5–9 h |
| 2026-06-09 | Prep réunion | 0,5 h | 0,25–0,75 h |
| 2026-06-10 (soir) → 2026-06-11 (00h) | Infra, BMAD, PRD | 3,25 h | 2,5–4 h |
| 2026-06-11 (après-midi) | UX + recherche technique | 4,0 h | 3–5 h |
| **Total cumulé** | **5 blocs** | **≈ 14,75 h** | **≈ 11–19 h** |

---

## Détail par session

### 1. Construction du POC (Next.js full code)

| Champ | Valeur |
|-------|--------|
| **Dates** | 2026-06-05 (nuit) → 2026-06-06 (nuit) ; transcript archivé le 2026-06-08 |
| **Chat Cursor** | `387a3fa0` |
| **Sujet** | Explication du besoin, implémentation du plan POC, mails Resend, workflows, debug local, DocuSeal puis retrait (licence Pro) |
| **Échanges** | 68 messages utilisateur / 489 assistant |
| **Commits liés** | `032c6a2` → `5ec41ad` (2026-06-05 01:32 — 2026-06-06 02:27) |
| **Heures estimées** | **7,0 h** |
| **Heures (réel)** | _à compléter_ |
| **Notes** | Grosse session ; une partie du travail peut avoir eu lieu hors plages de commits visibles. |

---

### 2. Préparation réunion Anne-Hélène

| Champ | Valeur |
|-------|--------|
| **Date** | 2026-06-09 (~11h) |
| **Chat Cursor** | `48873e08` |
| **Sujet** | Positionnement vs Digiforma, récap avant RDV, orientation multi-clients |
| **Échanges** | 4 / 7 |
| **Commits liés** | — |
| **Heures estimées** | **0,5 h** |
| **Heures (réel)** | _à compléter_ |

---

### 3. Soirée produit : Docker, BMAD, amorce refonte

| Champ | Valeur |
|-------|--------|
| **Dates** | 2026-06-10 21:35 → ~22:30 |
| **Chats Cursor** | `e5ac3ac8`, `efe0df8b` (sessions courtes enchaînées) |
| **Sujet** | Fix FormData, dockerisation VPS, install BMAD Method, `bmad-help` pour passer en prod-ready |
| **Échanges** | 5 / 41 (cumul) |
| **Commits liés** | `b6d44c1`, `6d5b82e`, `846d0e1` |
| **Heures estimées** | **1,25 h** |
| **Heures (réel)** | _à compléter_ |

---

### 4. PRD v1 et contexte projet

| Champ | Valeur |
|-------|--------|
| **Dates** | 2026-06-10 ~22h → 2026-06-11 00:39 |
| **Chat Cursor** | `26f99d28` |
| **Sujet** | `bmad-generate-project-context`, décisions produit non figées, réponses coaching PRD, verrouillage partiel des choix |
| **Échanges** | 13 / 51 |
| **Commits liés** | `8ca43c8` (PRD), `ac96663` (UX docs — fin de session) |
| **Heures estimées** | **2,0 h** |
| **Heures (réel)** | _à compléter_ |

---

### 5. Refonte UX (bmad-ux)

| Champ | valeur |
|-------|--------|
| **Date** | 2026-06-11 ~14h–15h |
| **Chat Cursor** | `c34c9d31` |
| **Sujet** | Refonte complète UX, page formation, maquettes, bibliothèque, sidebar |
| **Échanges** | 13 / 47 |
| **Commits liés** | Contenu intégré dans `ac96663` (commit nocturne) ou travail préparatoire à la recherche |
| **Heures estimées** | **1,5 h** |
| **Heures (réel)** | _à compléter_ |

---

### 6. Recherche technique MVP (blocs A → G)

| Champ | Valeur |
|-------|--------|
| **Date** | 2026-06-11 ~15h–16h35 |
| **Chat Cursor** | `9d4d6df1` |
| **Sujet** | `bmad-technical-research` bloc par bloc, verrouillage decision-log, docs ARCHITECTURE / DEPLOYMENT / ONBOARDING |
| **Échanges** | 25 / 103 |
| **Commits liés** | `e54d9df` |
| **Heures estimées** | **2,5 h** |
| **Heures (réel)** | _à compléter_ |

---

## Ce que je n’ai **pas**

- Chronomètre exact Cursor (non exposé dans les exports).
- Timestamps par message dans les JSONL (seulement `role` + `message`).
- Sessions éventuelles **sans** chat Cursor (lecture seule, réunion, code sans agent).
- Travail sur d’autres machines ou branches non poussées.

---

## Comment tenir ce fichier à jour

À chaque fin de session (ou hebdo), ajouter une ligne :

```markdown
### N. [Titre court]
| Date | YYYY-MM-DD |
| Chat | `xxxxxxxx` ou — |
| Sujet | … |
| Heures estimées | X h |
| Heures (réel) | X h |
| Commit | `abcdef0` |
```

Puis recalculer le total dans le tableau récapitulatif.

---

## Historique des mises à jour du suivi

| Date | Action |
|------|--------|
| 2026-06-11 | Création initiale à partir de l’historique Git + 7 transcripts Cursor disponibles |
