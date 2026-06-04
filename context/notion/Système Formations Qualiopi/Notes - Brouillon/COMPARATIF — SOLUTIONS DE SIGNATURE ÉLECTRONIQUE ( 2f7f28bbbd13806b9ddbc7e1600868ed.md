# COMPARATIF — SOLUTIONS DE SIGNATURE ÉLECTRONIQUE
 (1)

## Automatisation Qualiopi • Connexion Make • Usage agence

## 1. Contexte du besoin

Ce comparatif vise à identifier une solution de signature électronique adaptée à l’automatisation du workflow Qualiopi de l’agence, avec les contraintes suivantes :

- Signature de documents réglementaires (convention de formation, règlement intérieur, émargement)
- 1 signataire = 1 enveloppe
- Génération automatique des demandes de signature
- Récupération automatique des PDF signés
- Archivage centralisé dans pCloud
- Pilotage via Notion et Make
- Conformité Qualiopi / eIDAS / RGPD
- Possibilité de tests en environnement de développement

---

## 2. Solutions analysées

---

## **Yousign**

### Avantages

- Intégration native officielle avec Make
- API disponible dès les offres professionnelles
- Très bonne reconnaissance en audit Qualiopi
- Gestion claire des enveloppes et des signataires
- Interface simple pour les stagiaires et les entreprises
- Solution française, conforme RGPD et eIDAS

### Inconvénients

- Pas de sandbox totalement gratuite
- Enveloppes consommées lors des tests
- Coût supérieur à certaines solutions concurrentes

### Compatibilité Make

- Excellente (module officiel)

### Mode test

- Compte d’essai possible
- Tests réels, enveloppes comptabilisées

### Positionnement

- Solution cible long terme pour une agence
- Recommandée pour un déploiement en production

---

## **SignWell**

### Avantages

- API disponible dès les petits plans
- Intégration existante avec Make
- Mise en place rapide
- Tarifs accessibles
- Très bon outil pour POC ou MVP
- UX simple pour les signataires

### Inconvénients

- Moins connu des auditeurs que Yousign ou DocuSign
- Fonctionnalités plus limitées pour les workflows complexes
- Support moins structuré

### Compatibilité Make

- Bonne (module disponible)

### Mode test

- Version gratuite ou peu restrictive
- Très adaptée aux tests techniques

### Positionnement

- Très bon choix pour tester et valider un workflow
- Alternative crédible pour petits volumes

---

## **Signi** (signi.com)

### Avantages

- Solution française
- Conforme eIDAS et RGPD
- Tarifs généralement accessibles
- Adaptée à un usage manuel ou semi-automatisé
- Acceptée dans un cadre Qualiopi

### Inconvénients

- Pas d’intégration native avec Make
- API plus limitée et moins documentée
- Mise en œuvre technique plus complexe (HTTP, webhooks)
- Maintenance plus lourde dans le temps

### Compatibilité Make

- Indirecte (via modules HTTP uniquement)

### Mode test

- Démonstration possible
- Pas de véritable sandbox développeur

### Positionnement

- Solution envisageable si l’automatisation est partielle
- Peu recommandée pour un workflow 100 % automatisé

---

## **DocuSign**

### Avantages

- Leader international de la signature électronique
- API très complète et robuste
- Sandbox développeur gratuite
- Forte reconnaissance juridique et institutionnelle

### Inconvénients

- Coût élevé en production
- Paramétrage complexe
- Surdimensionné pour un usage Qualiopi standard
- UX parfois lourde pour des stagiaires

### Compatibilité Make

- Bonne (module disponible)

### Mode test

- Excellent environnement développeur

### Positionnement

- Intéressant pour des tests techniques avancés
- Peu adapté à une agence pour un usage courant

---

## **Adobe Acrobat Sign**

### (Abonnement Creative Cloud)

### Limites bloquantes

- Pas d’accès API avec Creative Cloud
- Connexion impossible à Make
- Automatisation non réalisable

### Positionnement

- À exclure pour ce projet
- Usage uniquement manuel

---

## 3. Tableau comparatif synthétique

| Solution | Intégration Make | Mode test | Coût | Adapté Qualiopi | Verdict |
| --- | --- | --- | --- | --- | --- |
| Yousign | Oui (native) | Limité | Moyen | Oui | Solution cible |
| SignWell | Oui | Très bon | Faible à moyen | Oui | Excellent POC |
| Signi.com | Partielle (HTTP) | Limité | Faible à moyen | Oui | Plus technique |
| DocuSign | Oui | Excellent | Élevé | Oui | Overkill |
| Adobe CC | Non | Non | Moyen | Non | À exclure |

---

## 4. Recommandation finale

Dans le cadre du projet d’automatisation Qualiopi de l’agence :

- **SignWell** est recommandé pour les tests et la validation rapide du workflow.
- **Yousign** est recommandé comme solution cible long terme pour la production.
- **Signi.com** peut être envisagé uniquement si une intégration API custom est acceptée.
- **DocuSign** est pertinent uniquement pour du benchmark ou des besoins complexes.
- **Adobe Acrobat Sign (Creative Cloud)** ne permet pas l’automatisation requise.

---

## 5. Prochaine étape possible

- Mise en place d’un plan de test comparatif (critères techniques, enveloppes, coûts)
- Réalisation d’un POC Make avec SignWell
- Préparation d’un argumentaire décisionnel à destination de la direction
- Choix définitif de l’outil et intégration complète au workflow Qualiopi