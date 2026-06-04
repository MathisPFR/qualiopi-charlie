# Configuration email (envois réels)

## Option 1 — Resend (recommandé POC)

1. Créer un compte sur [resend.com](https://resend.com)
2. Générer une clé API
3. Dans `.env` :

```env
MAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM=onboarding@resend.dev
MAIL_FROM_NAME=Agence Charlie
```

En test, `onboarding@resend.dev` permet d'envoyer **uniquement vers l'email du compte Resend** (celui utilisé à l'inscription).

**Configuration POC obligatoire** dans `.env` :

```env
MAIL_TEST_TO=mathispetitfr@gmail.com
MAIL_DEV_REDIRECT=mathispetitfr@gmail.com
```

- `MAIL_TEST_TO` : destinataire du bouton « Tester email »
- `MAIL_DEV_REDIRECT` : tous les emails des workflows (lancement, fin de formation…) sont redirigés vers cette adresse, avec le vrai destinataire indiqué dans l'objet et le corps du mail

Sans `MAIL_DEV_REDIRECT`, le lancement vers `contact@charlie-uniquecontent.fr` échouera avec la même erreur Resend.

Pour la prod / démo client : vérifier un domaine sur [resend.com/domains](https://resend.com/domains) et utiliser `MAIL_FROM=contact@votre-domaine.fr`, puis retirer `MAIL_DEV_REDIRECT`.

Quota gratuit : ~100 emails/jour.

## Option 2 — Brevo (SMTP)

1. Compte [brevo.com](https://www.brevo.com)
2. Créer une clé SMTP
3. Dans `.env` :

```env
MAIL_PROVIDER=smtp
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=votre-login
SMTP_PASS=votre-cle-smtp
MAIL_FROM=contact@votre-domaine.fr
```

Quota gratuit : ~300 emails/jour.

## Tester la config

1. Renseigner `MAIL_TEST_TO=votre@email.com` dans `.env`
2. Ouvrir une fiche formation → **Tester email**

Ou sans UI : les workflows échouent avec un message clair si la clé API manque.

## Preuves Qualiopi

Même si l'email échoue, le code tente de générer les PDF de preuve dans `preuves-qualiopi/`. En cas d'échec email, `AutomationRun` passe en `FAILED` avec le message d'erreur.

## Dépannage

| Erreur | Action |
|--------|--------|
| `RESEND_API_KEY manquant` | Ajouter la clé ou passer en SMTP |
| Domaine non vérifié | Utiliser `onboarding@resend.dev` en test |
| SMTP auth failed | Vérifier user/pass Brevo |
