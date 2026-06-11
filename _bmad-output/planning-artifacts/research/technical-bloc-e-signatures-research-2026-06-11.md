---
workflowType: research
research_type: technical
research_topic: Bloc E — Signatures électroniques
date: 2026-06-11
user_name: Root
---

# Research Report: technical — Bloc E (Signatures électroniques)

## Contexte

- **POC** : PDF générés **non signés** ; mention Zoho Sign hors périmètre
- **PRD** : FR-17/18/19 (émargements), FR-23 (lancement), FR-24 (statuts)
- **Make historique** : Zoho Sign
- **Contrainte Root** : **zéro coût logiciel** si alternative viable ; instance par client sur VPS
- **Email** : liens de signature dans mails **Brevo** (bloc D) — pas un 2ᵉ système mail

---

## E0bis — Conformité Qualiopi × Documenso (analyse 2026-06-11)

### Ce que dit [Documenso Compliance](https://documenso.com/fr/compliance)

| Réglementation | Statut Documenso |
|----------------|------------------|
| ESIGN / UETA (US) | ✅ Conforme |
| **eIDAS SES** (signature électronique **simple**) | ✅ **Conforme** |
| eIDAS AES (signature **avancée**) | ⏳ Prévu |
| eIDAS QES (signature **qualifiée**) | ⏳ Prévu |

Documenso CE fournit aujourd'hui du **SES** : scellement cryptographique du PDF, audit trail (horodatage, IP, événements), envoi par email nominatif — [niveaux de signature](https://docs.documenso.com/users/compliance/signature-levels).

### Ce que Qualiopi exige (référentiel V9)

Qualiopi **ne impose pas** un niveau eIDAS précis. L'auditeur vérifie surtout ([source Fresh Management](https://fresh-management.fr/signature-electronique-un-outil-devenu-indispensable/)) :

- le document signé **existe**, est **daté**, **nominatif**, rattaché à la formation / au stagiaire ;
- un **faisceau de preuves** traçable (envoi, signature, archivage) ;
- indicateurs **4** (convention / consentement), **9** (conditions contractuelles), **11** (attestations), **16** (historique).

### Grille document par document (OF France)

| Document Qualiopi Charlie | Niveau « idéal » métier | Documenso CE (SES) | Verdict audit Qualiopi typique |
|---------------------------|-------------------------|--------------------|--------------------------------|
| **Règlement intérieur** (stagiaire) | SES + preuves | ✅ SES + audit trail | ✅ **OK** |
| **Émargement** digital | SES + preuves | ✅ SES + audit trail | ✅ **OK** (si logs + PDF signé archivé) |
| **Convention** (entreprise) | SEA recommandée ([Edusign](https://edusign.com/fr/blog/signature-electronique-niveaux-simple-avance-qualifie-lequel-choisir-pour-vos-documents-de-formation/)) | ⚠️ SES seulement (AES pas encore) | ✅ **OK audit** dans la majorité des cas ; ⚠️ marge juridique plus faible en litige OPCO / gros montant |
| **Devis** (entreprise) | SES souvent suffisant | ✅ SES | ✅ **OK** |

**Parité POC** : Anne-Hélène utilisait **Zoho Sign** (SES + audit) — pas de QES. Documenso SES + même discipline d'archivage = **équivalent fonctionnel** pour Qualiopi.

### Mitigations v1 (recommandées)

1. **Archiver** PDF signé + export audit trail Documenso → **R2** (lien `SignatureRequest`)
2. **Conserver** preuves d'envoi email Brevo (bloc D) — double faisceau
3. **Code d'accès** Documenso sur convention/devis (option API) — renforce identification
4. **Ne pas promettre** SEA/QES tant que Documenso ne les propose pas en CE
5. **OQ-3** : checklist auditeur Qualiopi détaillée (recherche domaine) — valider avec premier audit Anne-Hélène

### Conclusion conformité

| Question | Réponse |
|----------|---------|
| Suffisant pour **audit Qualiopi** (OF classique, profil Anne-Hélène) ? | **Oui**, avec archivage rigoureux — aligné pratique Zoho actuelle |
| Équivalent **signature manuscrite** EU (QES) ? | **Non** — pas nécessaire pour ces docs |
| SEA (AES) pour conventions à fort enjeu ? | **Pas natif** Documenso CE aujourd'hui — surveiller roadmap AES ou OTP renforcé |
| SOC2 / HIPAA page compliance ? | Plutôt **offre cloud** Documenso ; self-host CE = responsabilité infra client |

---

## E0 — Périmètre signatures v1

| Moment | Document | Signataire |
|--------|----------|------------|
| **Lancement** | Règlement intérieur | Chaque stagiaire |
| **Lancement** | Convention | Entreprise |
| **Lancement** | Devis | Entreprise |
| **En cours** (mode signature) | Émargement séance | Chaque stagiaire × séance (envoi manuel opérateur) |

**Hors scope v1** : signature CGV séparée, QES qualifiée eIDAS, signature formateur.

---

## E1 — Options évaluées

| Solution | Coût intégration API | Self-host | API + webhooks | Stack | Verdict |
|----------|---------------------|-----------|----------------|-------|---------|
| **[Documenso CE](https://documenso.com/self-hosted)** | **0 €** | ✅ Docker | ✅ REST + webhooks | Node/Postgres | ✅ **Recommandé** |
| **[DocuSeal](https://www.docuseal.com/on-premises)** OSS | **Pro ~20 $/mois** + 0,20 $/doc API | ✅ | API = **payant** | Ruby/SQLite | ❌ API hors budget |
| **OpenSign** | 0 € | ✅ | ✅ (Parse) | Node/MongoDB | ⚠️ Moins mature, 4 containers |
| **Zoho Sign** | API payante (crédits) | ❌ SaaS | ✅ | Cloud | ❌ Coût + lock-in |
| **DIY PDF sign** | 0 € | — | — | — | ❌ Conformité / maintenance |

### Pourquoi pas DocuSeal (malgré popularité)

La version **community self-hosted** est gratuite pour l'UI manuelle, mais l'**API et l'embedding nécessitent une licence Pro** (~20 $/user/mois + 0,20 $/document signé via API) — [DocuSeal pricing](https://www.docuseal.com/signing-api). Incompatible avec l'automatisation lancement/émargements **sans coût**.

### Pourquoi Documenso CE

- **Community Edition** : self-host **gratuit**, **API complète**, pas de frais par document — [self-hosting](https://documenso.com/self-hosted)
- Même stack familiale (TypeScript, Prisma, Postgres)
- Webhooks `DOCUMENT_COMPLETED`, etc.
- Conformité SES/AES (eIDAS) — suffisant formation Qualiopi (pas QES obligatoire)
- **AGPL-3.0** : on déploie l'image **officielle non modifiée** comme **service séparé** ; Qualiopi appelle l'API en HTTP ; signataires redirigés vers `sign.client.fr` (**pas d'embed iframe** dans l'app) → modèle « PostgreSQL à côté »

---

## E2 — Architecture déploiement

```
VPS client (Dokploy / Traefik)
├── qualiopi.client.fr     → app Next.js
├── sign.client.fr         → Documenso (container)
├── postgres               → DB qualiopi + DB documenso (ou 2 DB même instance)
└── gotenberg              → PDF (inchangé)
```

**Dev local** : service `documenso` dans `docker-compose.yml` + certificat `.p12` auto-généré (script onboarding).

**Onboarding instance** (Root) :
1. Générer certificat de signature `.p12` ([Documenso docs](https://docs.documenso.com/docs/self-hosting/getting-started/tips) — **obligatoire**)
2. Configurer SMTP Documenso (optionnel si on envoie les liens via Brevo uniquement)
3. Créer API key Documenso → `InstanceSettings.documensoApiKey` (chiffré)
4. Webhook secret → URL `https://qualiopi.client.fr/api/webhooks/documenso`

Variables clés :
- `NEXT_PUBLIC_WEBAPP_URL=https://sign.client.fr`
- `NEXT_PRIVATE_INTERNAL_WEBAPP_URL=http://documenso:3000` (webhooks internes Docker)

---

## E3 — Intégration applicative

### Abstraction `SignatureService`

```typescript
interface CreateSignatureInput {
  formationId: string;
  documentType: "REGLEMENT_INTERIEUR" | "CONVENTION" | "DEVIS" | "EMARGEMENT";
  pdfBuffer: Buffer;
  filename: string;
  recipientEmail: string;
  recipientName: string;
  stagiaireId?: string;
  seanceId?: string;
  externalId: string; // idempotence + webhook mapping
}

// Retourne URL de signature pour inclusion email Brevo
```

**Principe** : Documenso **ne envoie pas** l'email (config `sendEmail: false`) — le lien `{{lien_signature}}` part dans le **mail Brevo** Qualiopi (cohérence branding, un seul provider mail).

### Flux lancement (FR-23)

```
1. Générer PDFs → R2 (bloc C)
2. Pour chaque stagiaire : SignatureRequest RI → API Documenso → lien
3. Entreprise : SignatureRequest Convention + Devis (2 requêtes)
4. sendMail() Brevo avec PJ + {{lien_signature}} par doc concerné
5. Webhook async : PDF signé → download → R2 → status SIGNED
```

### Flux émargement digital (FR-18)

```
Opérateur : Séance X → « Envoyer signatures »
  → PDF émargement 1 séance × stagiaire (Gotenberg)
  → SignatureRequest par stagiaire
  → Email Brevo avec lien
```

### Webhook

`POST /api/webhooks/documenso` :
- Vérifier signature HMAC / secret
- `DOCUMENT_COMPLETED` → fetch PDF signé → `R2` → update `SignatureRequest`
- Idempotent via `externalId`

---

## E4 — Modèle données

```prisma
enum SignatureDocumentType {
  REGLEMENT_INTERIEUR
  CONVENTION
  DEVIS
  EMARGEMENT
}

enum SignatureRequestStatus {
  CREATED
  LINK_SENT
  OPENED
  SIGNED
  EXPIRED
  FAILED
}

model SignatureRequest {
  id                String @id @default(cuid())
  formationId       String
  stagiaireId       String?
  seanceId          String?
  documentType      SignatureDocumentType
  recipientEmail    String
  recipientName     String?
  status            SignatureRequestStatus @default(CREATED)
  provider          String @default("documenso")
  providerDocumentId String?
  externalId        String @unique  // ex. formationId-type-stagiaireId
  unsignedR2Key     String?
  signedR2Key       String?
  signingUrl        String?  // temporaire, régénérable via API
  errorMessage      String?
  sentAt            DateTime?
  signedAt          DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

**UI Lancement (FR-24)** : colonne Signature par destinataire — reprend `SignatureRequest` + `EmailDelivery`.

**Preuve Qualiopi** : PDF signé archivé sur R2 + entrée `SignatureRequest` horodatée (audit trail Documenso exportable si besoin audit).

---

## E5 — Emails & liens

| Document | Email | Lien signature |
|----------|-------|----------------|
| RI stagiaire | Mail lancement stagiaire | `{{lien_signature_ri}}` |
| Convention entreprise | Mail lancement entreprise | `{{lien_signature_convention}}` |
| Devis entreprise | Même mail ou 2ᵉ lien | `{{lien_signature_devis}}` |
| Émargement | Mail dédié opérateur | `{{lien_signature_emargement}}` |

Relance signature (v1.1 optionnel) : bouton « Renvoyer lien » régénère URL via API.

---

## E6 — InstanceSettings (extension bloc B)

| Champ | Usage |
|-------|-------|
| `documensoBaseUrl` | `https://sign.client.fr` |
| `documensoApiKeyEncrypted` | Clé API |
| `documensoWebhookSecret` | Validation webhook |
| `emargementModeDefault` | PDF \| SIGNATURE (FR-19) |

---

## E7 — Estimation volume & ressources

| Métrique | Valeur |
|----------|--------|
| Signatures / formation 15 stagiaires | 15 RI + 2 entreprise = **17** |
| 20 formations/an | ~340 signatures/an — gratuit |
| RAM Documenso | ~512 Mo–1 Go |
| Coût logiciel | **0 €** (CE) |

---

## E8 — Phases implémentation

| Phase | Contenu |
|-------|---------|
| **E-0** | Documenso docker-compose dev + certificat + health |
| **E-1** | `SignatureService` + `SignatureRequest` + webhook |
| **E-2** | Intégration workflow **lancement** (FR-23) |
| **E-3** | UI statuts signature lancement (FR-24) |
| **E-4** | Mode émargement digital (FR-18) + UI séance |
| **E-5** | Onboarding Documenso dans guide client (bloc A4) |

---

## Décisions proposées

| ID | Proposition | Statut |
|----|-------------|--------|
| E1 | Provider = **Documenso CE self-hosted** par instance client | ✅ Locked |
| E2 | Sous-domaine `sign.{client}` ; service Docker dédié | ✅ Locked |
| E3 | Liens signature dans **emails Brevo** (pas email Documenso) | ✅ Locked |
| E4 | Table `SignatureRequest` + webhook → R2 | ✅ Locked |
| E5 | Même provider lancement + émargement digital | ✅ Locked |
| E6 | Pas d'embed iframe ; redirection page Documenso | ✅ Locked |
| E7 | **0 €** CE — pas de frais/doc ; API incluse self-host | ✅ Locked |
| E8 | SES suffisant Qualiopi (profil OF classique) ; archivage R2 + audit trail | ✅ Locked |

---

## Sources

- [Documenso self-hosted](https://documenso.com/self-hosted)
- [Documenso self-hosting docs](https://docs.documenso.com/docs/self-hosting)
- [DocuSeal API pricing](https://www.docuseal.com/signing-api)
- [DocuSeal on-premises](https://www.docuseal.com/on-premises)
- PRD FR-17–19, FR-23–24
- POC : `src/server/workflows/launch.ts`, `formations/[id]/page.tsx`
