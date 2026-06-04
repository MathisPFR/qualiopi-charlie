# Contexte complet — POC Qualiopy Automation

## Vision du projet

Reconstruire en full code un système d'automatisation administrative pour des **organismes de formation certifiés Qualiopi** (France). Le système existant tourne sur **Notion + Make (make.com)** et est fonctionnel mais fragile. L'objectif du POC est de valider qu'on peut reproduire exactement le même comportement en code propre, déployable instance par instance pour chaque client.

**Modèle commercial cible** : one-shot, un repo GitHub, une instance déployée par client sur un VPS, pas de SaaS.

---

## Stack actuelle (ce qu'on remplace)

| Composant actuel | Rôle | Ce qui le remplace dans le POC |
|---|---|---|
| Notion | Base de données + interface utilisateur | À décider (garder Notion API, ou DB propre + front) |
| Make (make.com) | Orchestrateur / automatisation | Code Node.js ou Python sur VPS |
| Google Forms | Formulaires stagiaires / entreprises | Formulaires intégrés dans l'app |
| Google Docs templates | Génération de documents PDF | Génération PDF en code (ex: PDFKit, Puppeteer) |
| PCloud | Stockage fichiers | Stockage local sur serveur (`/storage`) |
| Zoho Sign | Signatures électroniques | Zoho Sign API (conserver) ou alternative |
| Email | Envoi emails | Nodemailer / Brevo API |

---

## Modèle de données (bases Notion existantes)

### Base : Formations
Propriétés clés identifiées dans les scénarios Make :

| Propriété Notion | Type | Usage |
|---|---|---|
| `Intitulé de la formation` | rich_text | Nom interne |
| `Intitulé de la formation (commercial)` | rich_text | Nom affiché, utilisé dans emails et formulaires |
| `Nom client (pour dossiers)` | rich_text | Utilisé pour nommer les dossiers fichiers |
| `Date début` | date | Utilisé pour nommer les dossiers (année) |
| `Date fin` | date | |
| `Mail entreprise (make)` | rollup (email) | Destinataire emails côté entreprise |
| `Adresse entreprise` | rollup | |
| `Objectifs de formation make` | rollup | |
| `Objectifs de formation` | relation | Lien vers autre base |
| `Lien dossier pCloud` | url/rich_text | Chemin racine du dossier fichiers de la formation |
| `Lancement demandé` | checkbox | **Déclencheur** du scénario de lancement |
| `Stagiaire inscrit pour make` | rollup | Liste des stagiaires |
| `Tarif total HT` | number | |
| `Lien Yousign` | url | |
| `Zoho Request ID - Convention` | rich_text | ID de la demande de signature Zoho |
| `R.I signée` | checkbox | |
| `Lien signature R.I envoyé` | checkbox | |
| `Attestation de présence générée` | checkbox | |
| `Certificat de présence signé` | files | |
| `Certificat de réalisation` | files | |
| `Entreprises` | relation | |
| `Date envoi à froid` | formula | Calculée automatiquement (date fin + 2 mois) |
| `Éval à froid envoyée` | checkbox | Empêche le double envoi |

### Base : Stagiaires
Propriétés clés :

| Propriété Notion | Type | Usage |
|---|---|---|
| `Nom du stagiaire` | title/rich_text | |
| `E-mail` | email | Destinataire emails stagiaire |
| `Zoho Request ID - RI` | rich_text | ID signature règlement intérieur |
| `Chemin PCloud` | rich_text | Chemin dossier propre au stagiaire |
| `Formations` | relation | Lien vers la formation |

### Base : Séances
Propriétés clés :

| Propriété Notion | Type | Usage |
|---|---|---|
| `Formations` | relation | Formation liée |
| `Inclure dans l'émargement` | checkbox | Filtre pour génération émargement |
| `Date` | date | Date de la séance |

---

## Les 9 scénarios Make — logique complète

### 1. `[NOTION] Lancement de formation`
**Déclencheur** : `watchDatabaseItems` sur la base Formations, mode `update`  
**Condition implicite** : la checkbox `Lancement demandé` passe à `true`  
**⚠️ Bug connu** : pas de filtre idempotent → si Notion est mis à jour plusieurs fois, le scénario se relance et crée des doublons (dossiers, emails)

**Flow (4 routes parallèles)** :

**Route 1 — Création des dossiers fichiers**
1. Crée dossier principal : `/Agence Charlie/2 - FORMATION/Automatisation Formation/{YYYY} - {Nom client} - {Intitulé formation}`
2. Crée sous-dossiers : `Avant la formation`, `Pendant la formation`, `Après la formation`, `Preuves Qualiopi`
3. Sauvegarde le chemin du dossier principal dans Notion (`Lien dossier pCloud`)

**Route 2 — Convention**
1. Génère la convention depuis template Google Docs
2. Coche checkbox `convention générée` dans Notion
3. Exporte en PDF
4. Upload dans `{dossier}/Avant la formation`

**Route 3 — Emails stagiaires (itère sur chaque stagiaire)**
1. Définit variable : lien Google Form besoins stagiaire avec param `Intitulé formation (commercial)` pré-rempli
   - URL : `https://docs.google.com/forms/d/e/1FAIpQLSdwuKKBqLHnOfr_8F6ob3CyVFT5UNDt8WXQBeEVttJV98RsPg/viewform?entry.1982610986={intitulé}`
2. Télécharge depuis PCloud : Livret d'accueil + Règlement intérieur
3. Pour chaque stagiaire :
   - Envoie email à `stagiaire.email` : objet `Bienvenue dans votre formation {intitulé} 🎓 – Documents à compléter`
   - Génère preuve Qualiopi (Google Docs template)
   - Upload preuve dans `{dossier}/Preuves Qualiopi`
   - Coche checkbox dans Notion

**Route 4 — Email entreprise**
1. Définit variable : lien Google Form besoins entreprise avec param pré-rempli
   - URL : `https://docs.google.com/forms/d/e/1FAIpQLSdnmUh1EsKs1QuFKhNsUH6StrB0O4apiwxiIwc43L616Cx00Q/viewform?entry.1771889048={intitulé}`
2. Télécharge depuis PCloud : CGV + Convention
3. Envoie email à `formation.mail_entreprise` : objet `Votre formation {intitulé} – Documents administratifs à compléter 📋`
4. Génère preuve Qualiopi + upload
5. Coche checkbox dans Notion

---

### 2. `SIGNATURES — Récupération & classement (Zoho Sign)`
**Déclencheur** : webhook Zoho Sign `DocumentCompleted` (event-driven, le plus fiable du système)

**Route 1 — Convention signée**
1. Cherche dans base Formations où `Zoho Request ID - Convention` = `request_id` reçu
2. Télécharge le PDF signé depuis Zoho Sign
3. Upload dans `{Lien dossier pCloud}/Avant la formation`
4. Met à jour Notion : `Convention signée` = true

**Route 2 — Règlement intérieur signé**
1. Cherche dans base Stagiaires où `Zoho Request ID - RI` = `request_id` reçu
2. Télécharge le PDF signé
3. Upload dans `{Chemin PCloud stagiaire}/Avant la formation`
4. Met à jour Notion : `R.I signée` = true

---

### 3. `Génération des émargements`
**Déclencheur** : `watchDatabaseItems` sur Formations, mode `update`  
**Condition implicite** : déclenchement manuel ou sur changement spécifique

**Flow** :
1. Cherche toutes les séances liées à la formation où `Inclure dans l'émargement` = true
2. Agrège les séances en JSON
3. Itère sur chaque stagiaire
4. Pour chaque stagiaire, génère un document émargement depuis template Google Docs (avec les séances injectées)
5. Appel HTTP (probablement conversion PDF)
6. Export PDF
7. Upload dans `{dossier}/Pendant la formation`
8. Met à jour Notion

---

### 4. `Fin de formation (attestation de présence + éval + certif)`
**Déclencheur** : `watchDatabaseItems` sur Formations, mode `update`

**Route 1 — Attestation de présence**
1. Génère attestation depuis template Google Docs
2. Met à jour Notion
3. Export PDF
4. Upload dans `{Lien dossier pCloud}/Pendant la formation`

**Route 2 — Certificats de réalisation (par stagiaire)**
1. Itère sur chaque stagiaire
2. Pour chaque stagiaire : génère certificat depuis template + export PDF
3. Upload dans `{Lien dossier pCloud}/Après la formation`
4. Met à jour Notion

**Route 3 — Email évaluation à chaud (par stagiaire)**
1. Lien form éval à chaud : `https://docs.google.com/forms/d/e/1FAIpQLSd0bXwoFHSepTSh-WTCC-BURZUeq4KQpgwvuZd9AdFCnG4Q0Q/viewform?entry.648480416={intitulé}`
2. Itère sur chaque stagiaire
3. Récupère le certificat généré à l'étape précédente depuis PCloud : `{dossier}/Après la formation/Certificat_de_realisation-{intitulé}-{nom_stagiaire}.pdf`
4. Envoie email à `stagiaire.email` : objet `🎓 Votre certificat et votre avis sur la formation {intitulé}` (avec certificat en PJ)
5. Génère preuve Qualiopi + upload dans `{dossier}/Preuves Qualiopi`
6. Met à jour Notion

**Route 4 — Email évaluation entreprise**
1. Lien form éval entreprise : `https://docs.google.com/forms/d/e/1FAIpQLSeOvzqvfqNC4xo0-JFg5N_PVnjDx1vnW15WzS9BGCVGCvbeKg/viewform?entry.1040764421={intitulé}`
2. Récupère attestation de présence depuis PCloud : `{dossier}/Pendant la formation/Attestation de présence-{intitulé}-{raison_sociale}.pdf`
3. Envoie email à `formation.mail_entreprise` : objet `Votre avis sur la formation {intitulé} – Évaluation entreprise` (avec attestation en PJ)
4. Génère preuve Qualiopi + upload
5. Met à jour Notion

---

### 5. `Éval à froid envoie mail M+2`
**Déclencheur** : `searchObjects1` (scheduled, tourne probablement tous les jours)  
**Filtre** : formations où `Date envoi à froid` ≤ aujourd'hui ET `Éval à froid envoyée` = false

**Flow** :
1. Lien form éval à froid : `https://docs.google.com/forms/d/e/1FAIpQLSfpw2ycZvIiZdhk5lgTi3uc8H_Du-Iq31yD0-vZDLMM5OYHrw/viewform?entry.1717395031={intitulé}`
2. Itère sur chaque stagiaire
3. Envoie email à `stagiaire.email` : objet `🎓 Suivi de votre formation – Évaluation à froid {intitulé}`
4. Met à jour Notion : `Éval à froid envoyée` = true
5. Génère preuve Qualiopi + upload

---

### 6. `[FORM] Réponse besoins stagiaire`
**Déclencheur** : `watchResponses` Google Forms (polling)  
**Clé de matching** : réponse `762c3e2a` = intitulé de la formation (champ caché pré-rempli)

**Flow** :
1. Récupère la réponse complète
2. Cherche la formation dans Notion par `Intitulé de la formation (commercial)` = valeur du champ
3. Génère document depuis template Google Docs (avec les réponses)
4. Export PDF
5. Upload dans `{Lien dossier pCloud}/Avant la formation`

---

### 7. `[FORM] Réponse besoins entreprise`
**Déclencheur** : `watchResponses` Google Forms  
**Clé de matching** : réponse `699ce198` = intitulé de la formation

Même flow que besoins stagiaire → upload dans `/Avant la formation`

---

### 8. `[FORM] Réponse évaluation à chaud stagiaires`
**Déclencheur** : `watchResponses` Google Forms  
**Clé de matching** : réponse `26a706a0` = intitulé de la formation

Même flow → upload dans `/Après la formation`

---

### 9. `[FORM] Réponse évaluation de satisfaction entreprise`
**Déclencheur** : `watchResponses` Google Forms  
**Clé de matching** : réponse `3e08ce05` = intitulé de la formation

Même flow → upload dans `/Après la formation`

---

## Structure des dossiers fichiers (par formation)

```
/storage/
  {YYYY} - {Nom client} - {Intitulé formation}/
    Avant la formation/
      Convention.pdf
      Convention_signée.pdf          ← après Zoho Sign
      Besoins_stagiaire_{nom}.pdf    ← après réponse formulaire
      Besoins_entreprise.pdf
      Preuve_envoi_stagiaire_{nom}.pdf   ← Preuves Qualiopi
      Preuve_envoi_entreprise.pdf
    Pendant la formation/
      Attestation_de_présence-{intitulé}-{raison_sociale}.pdf
      Emargement_{stagiaire}.pdf     ← un par stagiaire
    Après la formation/
      Certificat_de_realisation-{intitulé}-{nom_stagiaire}.pdf   ← un par stagiaire
      Eval_chaud_{stagiaire}.pdf
      Eval_satisfaction_entreprise.pdf
    Preuves Qualiopi/
      Preuve_*.pdf                   ← toutes les preuves d'envoi
```

---

## Cycle de vie complet d'une formation

```
[1] LANCEMENT
    ↓ Notion : Lancement demandé = true
    → Crée dossiers fichiers
    → Génère convention
    → Envoie emails stagiaires (+ livret + RI) avec lien form besoins
    → Envoie email entreprise (+ CGV + convention) avec lien form besoins
    → Zoho Sign envoyé pour signatures

[2] SIGNATURES (async, event-driven)
    ↓ Zoho Sign webhook : document signé
    → Télécharge et classe le PDF signé

[3] FORMULAIRES BESOINS (async, event-driven)
    ↓ Réponse Google Form
    → Génère PDF de la réponse + classe dans dossier

[4] PENDANT
    ↓ Notion : déclenchement manuel
    → Génère les feuilles d'émargement (par stagiaire + séances)

[5] FIN DE FORMATION
    ↓ Notion : déclenchement manuel
    → Génère attestation de présence
    → Génère certificats (un par stagiaire)
    → Envoie email stagiaires (certificat + lien éval à chaud)
    → Envoie email entreprise (attestation + lien éval satisfaction)

[6] FORMULAIRES ÉVALS (async, event-driven)
    ↓ Réponse Google Form
    → Génère PDF de la réponse + classe

[7] ÉVAL À FROID (scheduled, J+60)
    ↓ Cron quotidien
    → Pour chaque formation dont date_envoi_froid ≤ aujourd'hui et pas encore envoyé
    → Envoie email stagiaires (lien éval à froid)
```

---

## Bugs connus du système actuel

### Bug 1 — Double déclenchement du lancement
**Cause** : `watchDatabaseItems` en mode `update` se déclenche à chaque sauvegarde Notion. Si la fiche est éditée plusieurs fois (ex : pendant une démo), le scénario tourne plusieurs fois.  
**Symptôme** : dossiers PCloud en double, emails envoyés en double.  
**Fix POC** : vérifier avant tout traitement que `Lien dossier pCloud` est vide (ou que le dossier n'existe pas déjà).

### Bug 2 — Erreur `[2002] A component of parent directory does not exist`
**Cause** : conséquence du Bug 1. Si deux dossiers "Après la formation" sont créés, PCloud renomme le second. Le chemin stocké dans Notion pointe vers un chemin qui n'existe plus exactement.  
**Symptôme** : scénario "Fin de formation" plante sur l'upload.  
**Fix POC** : stockage local avec création idempotente (mkdir -p).

### Bug 3 — Polling Google Forms non fiable
**Cause** : Make poll Google Forms toutes les X minutes. Une réponse peut être ratée si Make est down ou si le polling rate la fenêtre.  
**Fix POC** : formulaires intégrés dans l'app → soumission directe à l'API.

### Bug 4 — Pas de gestion d'erreur explicite
**Cause** : `autoCommit: true` dans tous les scénarios. En cas d'erreur sur un module, Make arrête le bundle sans retry ni alerte structurée.  
**Symptôme** : état incohérent dans Notion (certaines checkboxes cochées, d'autres non).  
**Fix POC** : try/catch sur chaque action critique + log en base.

---

## Ce que le POC doit démontrer

1. **Déclenchement fiable** : une action dans l'interface (ou API) déclenche le bon workflow, une seule fois, même si appelée plusieurs fois (idempotence)
2. **Génération de documents** : produire un PDF depuis un template avec les données de la formation
3. **Envoi d'email** : avec pièce jointe PDF
4. **Stockage fichiers** : organisation en dossiers sur le serveur
5. **Formulaires intégrés** : un form simple qui soumet et génère le PDF correspondant
6. **Logs** : chaque action est tracée, les erreurs sont visibles

---

## Stack suggérée pour le POC

```
Backend : Node.js + Express (ou Fastify)
Base de données : SQLite (simple pour POC) ou PostgreSQL
Génération PDF : Puppeteer (HTML → PDF) ou PDFKit
Emails : Nodemailer + SMTP (ou Brevo API)
Stockage : fichiers locaux /storage sur le serveur
Signatures : Zoho Sign API (conserver l'existant)
Frontend : React ou HTML/JS simple
Déploiement : un seul VPS, Docker optionnel pour la V1
```

---

## Questions ouvertes pour orienter le POC

1. **Garder Notion ou pas ?** Si on garde Notion comme interface, on garde l'API Notion pour lire/écrire les données. Si on le remplace, on code un front minimal.
2. **Templates documents** : les templates Google Docs actuels ont des variables `{{champ}}`. On peut les reproduire en HTML/CSS → Puppeteer PDF, ce qui donne un contrôle total.
3. **Zoho Sign** : API bien documentée, à conserver ou remplacer par DocuSign / YouSign selon le budget client.
4. **Multi-client** : pour le POC, une instance = un client. La config client (nom, templates, emails, etc.) est dans un fichier `.env` ou `config.json`.
