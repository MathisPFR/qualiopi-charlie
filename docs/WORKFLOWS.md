# Workflows (parité Make)

| Make | Fichier | Déclencheur |
|------|---------|-------------|
| Lancement formation | `launch.ts` | Bouton « Valider et lancer » |
| Signatures Zoho | — | **Hors scope POC** |
| Émargements | `emargements.ts` | Statut → `EN_COURS` |
| Fin de formation | `fin-formation.ts` | Statut → `TERMINEE` |
| Éval à froid M+2 | `eval-froid.ts` | Cron / bouton admin |
| Form besoins stagiaire | `form-response.ts` | POST `/f/{slug}/besoins-stagiaire` |
| Form besoins entreprise | `form-response.ts` | POST `/f/{slug}/besoins-entreprise` |
| Form éval à chaud | `form-response.ts` | POST `/f/{slug}/eval-chaud` |
| Form éval entreprise | `form-response.ts` | POST `/f/{slug}/eval-entreprise` |
| Form éval à froid | `form-response.ts` | POST `/f/{slug}/eval-froid` |

## Stockage par formation

```
storage/{YYYY} - {client} - {intitule}/
  avant-la-formation/
  pendant-la-formation/
  apres-la-formation/
  preuves-qualiopi/
```

## Emails (objets)

| Événement | Objet |
|-----------|--------|
| Lancement stagiaire | Bienvenue dans votre formation {intitulé} – Documents à compléter |
| Lancement entreprise | Votre formation {intitulé} – Documents administratifs à compléter |
| Fin stagiaire | Votre certificat et votre avis sur la formation {intitulé} |
| Fin entreprise | Votre avis sur la formation {intitulé} – Évaluation entreprise |
| Éval à froid | Suivi de votre formation – Évaluation à froid {intitulé} |

## Éval à froid

Date d'envoi = `dateFin` + **2 mois** (`date-fns` `addMonths`).

Cron : `GET /api/cron/eval-a-froid` avec header `Authorization: Bearer {CRON_SECRET}`.
