# GUIDE D’UTILISATION

## Système automatisé de gestion des formations – Agence Charlie

---

# 1️⃣ Création d’une nouvelle formation

## Étape 1 — Créer la formation

Depuis la page **Pilotage des formations**, cliquer sur le bouton :

➕ **Créer une nouvelle formation**

![image.png](GUIDE%20D%E2%80%99UTILISATION/image.png)

---

## Étape 2 — Remplir les informations générales

Une nouvelle page s’ouvre.

Tous les champs doivent être complétés avant de lancer l’automatisation.

### Champs à renseigner :

- **Titre de la formation** (en haut de page)
- **Nom du client**
- **Date de début**
- **Date de fin**
- **Lieu (si distanciel mettre : Formation réalisée à distance, en visioconférence via Teams.)**
- **Modalité** (Présentiel / Mixte / Distanciel)
- **Durée en heures** (saisir uniquement un chiffre)
- **Tarif total** (saisir uniquement un chiffre – le symbole € s’ajoute automatiquement)
- **Tarif par personne** (saisir uniquement un chiffre)
- **Nom du formateur**
- **Statut**
- Programme de formation à importer en fichier (doit être importé sinon ça ne fonctionnera pas)

⚠️ Ne pas modifier le statut.

Toute nouvelle formation doit rester en **Brouillon** tant que toutes les informations ne sont pas complètes.

- **Nombre de stagiaires**
- **Code formation**

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%201.png)

---

# 2️⃣ Ajouter les stagiaires

Sous les informations générales se trouve la base de données **Stagiaires**.

⚠️ Très important :

Pour créer un stagiaire lié à la formation en cours :

❌ Ne pas utiliser le bouton bleu situé en haut à droite.

✅ Utiliser le bouton **“Nouveau” / “Nouvelle page”** situé sous les colonnes de la table.

![image (1).png](GUIDE%20D%E2%80%99UTILISATION/image_(1).png)

### Pourquoi ?

Le bouton bleu crée une page indépendante qui ne sera pas liée à la formation en cours.

Le bouton “Nouveau” crée automatiquement un stagiaire rattaché à la formation.

---

## Remplir les informations du stagiaire

Après avoir cliqué sur “Nouveau” :

- Remplir toutes les colonnes visibles.
- Il peut être nécessaire de faire défiler horizontalement pour voir tous les champs.

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%202.png)

---

# 3️⃣ Ajouter l’entreprise

La base **Entreprise** fonctionne de la même manière :

⚠️ Toujours utiliser le bouton “Nouveau” dans la table et ne pas utiliser le bouton bleu.

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%203.png)

---

# 4️⃣ Ajouter les séances

Dans la section **Séances**, créer chaque séance prévue.

Champs à renseigner :

- Nom de la séance
- Date
- Heure de début (Exemple: 9H, Mettre le “H” fait que il sera aussi dans le document sinon non)
- Heure de fin (Exemple: 13H, Mettre le “H” fait que il sera aussi dans le document sinon non)

⚠️ Important :

Les séances doivent être renseignées avant la génération des émargements.

Il est possible de les compléter plus tard, mais elles devront obligatoirement être renseignées avant le passage en statut **En cours**.

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%204.png)

---

# 4️⃣ Ajouter les objectifs

Dans la section Objectif, créer chaque obejctif prévue.

Juste le nom suffit et la méthode d’ajout et la même que pour les autres

---

# 5️⃣ Lancer l’automatisation

Une fois que toutes les informations sont complètes :

Cliquer sur :

🚀 **Valider et lancer l’automatisation**

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%205.png)

⚠️ Cette action déclenche automatiquement plusieurs processus :

---

## 📧 Pour l’entreprise

Envoi automatique d’un email contenant :

- La convention de formation
- Les CGV
- Le lien vers la Google Form d’évaluation des besoins entreprise

---

## 📧 Pour les stagiaires

Envoi automatique d’un email contenant :

- Le livret d’accueil (uniquement si la formation est en présentiel)
- Le règlement intérieur
- Le lien vers la Google Form d’évaluation des besoins stagiaires
- Le lien Zoho Sign pour signature du règlement intérieur (si activé)

---

# 📁 Création automatique du dossier pCloud

Lors du lancement, un dossier est généré automatiquement :

**Nom de la formation + année**

Avec les sous-dossiers suivants :

- Avant formation
- Pendant formation
- Après formation
- Preuves

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%206.png)

Classement automatique :

- La convention et les CGV sont stockées dans **Avant formation**.
- Les emails envoyés sont archivés dans **Preuves**.
- Les justificatifs liés aux envois sont également stockés dans **Preuves**.

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%207.png)

---

# 6️⃣ Réception des évaluations de besoins

Lorsque l’entreprise et les stagiaires complètent les formulaires :

Make génère automatiquement les documents correspondants et les stocke dans le dossier **Avant formation** sur pCloud.

---

# 7️⃣ Passer la formation en statut “En cours”

Après le lancement :

Aller dans la section **Formations à lancer**.

Modifier le statut :

À lancer → En cours

La formation bascule automatiquement dans la section **En cours**.

![image.png](GUIDE%20D%E2%80%99UTILISATION/image%208.png)

---

# 8️⃣ Génération des émargements

Lorsque la formation est en statut **En cours** :

Make génère automatiquement (toutes les 60 minutes) :

- Les feuilles d’émargement
- Pour toutes les séances
- Pour tous les stagiaires

Les documents sont stockés dans le dossier **Pendant formation**.

⚠️ D’où l’importance d’avoir correctement renseigné les séances avant le changement de statut.

---

# 9️⃣ Clôturer la formation

À la fin de la formation :

Modifier le statut :

En cours → Terminée

---

# 1️⃣0️⃣ Automatisations de fin de formation

Lorsque le statut passe à **Terminée**, Make génère automatiquement :

## Pour l’entreprise :

- Les attestations de présence
- Un email contenant le lien vers le formulaire d’évaluation de satisfaction entreprise

## Pour les stagiaires :

- Leur certificat de réalisation
- Un email contenant le lien vers le formulaire d’évaluation à chaud

---

# 📁 Classement automatique en fin de formation

Les documents sont classés comme suit :

- Après formation :
    - Certificats de réalisation
    - Documents liés à la fin de formation
- Pendant formation :
    - Attestations de présence
- Preuves :
    - Copies des emails envoyés
    - Preuves d’envoi
    - Justificatifs liés aux évaluations

Lorsque les formulaires sont complétés, les documents générés sont également stockés automatiquement dans pCloud.

---

# 📌 Archivage de la formation

Une fois que la formation est terminée, que tous les documents ont été générés, envoyés et correctement classés, et que les évaluations ont été récupérées, il est nécessaire de modifier le statut une dernière fois :

**Terminée → Archivée**

Le statut “Archivée” permet de signaler que le dossier est totalement clôturé et qu’aucune action supplémentaire n’est attendue.

La formation bascule alors automatiquement dans la section “Formations archivées” du tableau de pilotage.

⚠️ Le passage en “Archivée” doit être effectué uniquement lorsque l’ensemble du processus est finalisé (documents générés, emails envoyés, évaluations récupérées).

---

# ⏱ Fonctionnement des automatisations Make

Le système fonctionne selon des déclenchements programmés et automatiques.

### Scénarios exécutés toutes les 60 minutes :

- Lancement des processus liés au passage en statut “À lancer”
- Génération des émargements (lorsque la formation est en statut “En cours”)
- Automatisations de fin de formation (lorsque le statut passe à “Terminée”)

Cela signifie qu’un délai maximum d’environ une heure peut exister entre le changement de statut et l’exécution complète des actions.

---

### Formulaires (Google Forms)

Les vérifications et traitements des réponses aux formulaires (évaluation des besoins, évaluations de satisfaction, etc.) sont exécutés automatiquement **chaque jour à 9h**.

Les documents correspondants sont générés et classés dans pCloud après traitement.

---

### Signatures électroniques (Zoho Sign)

La récupération et le classement des documents signés fonctionnent en déclenchement automatique.

Dès qu’une signature est finalisée et que la donnée est reçue, Make exécute immédiatement le scénario de récupération et classe automatiquement le document dans le dossier approprié sur pCloud.

Aucune action manuelle n’est nécessaire pour cette étape.