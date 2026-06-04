# Modèle de données

## Entités

### Formation

Cœur métier. Statuts : `BROUILLON` → `A_LANCER` → `EN_COURS` → `TERMINEE` → `ARCHIVEE`.

Flags workflow :

- `storagePath` — chemin absolu du dossier formation
- `conventionGenerated`, `emargementsGenerated`, `finFormationProcessed`, `evalFroidSent`
- `lancementAt`

### Stagiaire

Lié à une formation. `evalFroidSent` par stagiaire.

### Entreprise / Formateur

Relation optionnelle 1-N avec formations.

### Seance

`includeInEmargement` filtre les séances pour les feuilles d'émargement.

### ObjectifFormation

Libellés injectés dans les documents.

### AutomationRun

Journal d'audit : `workflow`, `status`, `message`, `payload` JSON.

### FormSubmission

Réponses formulaires publics + chemin PDF généré.

### User

Admin unique pour le POC.

## Schéma Prisma

Voir [`prisma/schema.prisma`](../prisma/schema.prisma).

## Commandes

```bash
node node_modules/prisma/build/index.js db push
node prisma/seed.mjs
```
