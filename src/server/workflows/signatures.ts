import {
  AutomationStatus,
  AutomationWorkflow,
  SignatureDocumentType,
  SignatureRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startRun, finishRun } from "@/server/services/audit";
import { getFormationFull } from "@/server/db/formation";
import {
  createPdfSignatureRequest,
  downloadSignedDocument,
  fetchSubmissionDocuments,
  isDocusealEnabled,
} from "@/server/services/docuseal";
import { subPath, writeFile } from "@/server/services/storage";
import { stagiaireFullName } from "@/server/services/formation-data";

function safeFilenamePart(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, "-").trim().slice(0, 60) || "document";
}

function externalId(
  formationId: string,
  type: SignatureDocumentType,
  stagiaireId?: string
) {
  return stagiaireId
    ? `${formationId}:ri:${stagiaireId}`
    : `${formationId}:convention`;
}

export async function sendLaunchSignatureRequests(
  formationId: string,
  files: {
    conventionPath: string;
    conventionPdf: Buffer;
    conventionFilename: string;
    riPath?: string | null;
    riPdf?: Buffer | null;
  }
) {
  if (!isDocusealEnabled()) {
    return { skipped: true, reason: "DocuSeal désactivé" };
  }

  const formation = await getFormationFull(formationId);
  if (!formation?.storagePath) {
    throw new Error("Formation ou dossier storage introuvable");
  }

  const run = await startRun(AutomationWorkflow.SIGNATURES, formationId);
  const created: string[] = [];

  try {
    if (formation.entreprise?.email) {
      const existing = await prisma.signatureRequest.findFirst({
        where: {
          formationId,
          documentType: SignatureDocumentType.CONVENTION,
          status: SignatureRequestStatus.PENDING,
        },
      });

      if (!existing) {
        const submission = await createPdfSignatureRequest({
          name: `Convention — ${formation.intituleCommercial || formation.intitule}`,
          pdf: files.conventionPdf,
          email: formation.entreprise.email,
          externalId: externalId(formationId, SignatureDocumentType.CONVENTION),
          metadata: {
            formationId,
            documentType: SignatureDocumentType.CONVENTION,
          },
        });
        const submitter = submission.submitters[0];
        await prisma.signatureRequest.create({
          data: {
            formationId,
            documentType: SignatureDocumentType.CONVENTION,
            docusealSubmissionId: submission.id,
            signerEmail: formation.entreprise.email,
            signUrl: submitter?.embed_src ?? null,
          },
        });
        created.push("convention");
      }
    }

    if (files.riPdf && files.riPath) {
      for (const stagiaire of formation.stagiaires) {
        const existing = await prisma.signatureRequest.findFirst({
          where: {
            formationId,
            stagiaireId: stagiaire.id,
            documentType: SignatureDocumentType.REGLEMENT_INTERIEUR,
            status: SignatureRequestStatus.PENDING,
          },
        });
        if (existing) continue;

        const submission = await createPdfSignatureRequest({
          name: `Règlement intérieur — ${stagiaireFullName(stagiaire)}`,
          pdf: files.riPdf,
          email: stagiaire.email,
          externalId: externalId(
            formationId,
            SignatureDocumentType.REGLEMENT_INTERIEUR,
            stagiaire.id
          ),
          metadata: {
            formationId,
            stagiaireId: stagiaire.id,
            documentType: SignatureDocumentType.REGLEMENT_INTERIEUR,
          },
        });
        const submitter = submission.submitters[0];
        await prisma.signatureRequest.create({
          data: {
            formationId,
            stagiaireId: stagiaire.id,
            documentType: SignatureDocumentType.REGLEMENT_INTERIEUR,
            docusealSubmissionId: submission.id,
            signerEmail: stagiaire.email,
            signUrl: submitter?.embed_src ?? null,
          },
        });
        created.push(`ri:${stagiaire.id}`);
      }
    }

    await finishRun(
      run.id,
      AutomationStatus.SUCCESS,
      created.length
        ? `Demandes DocuSeal : ${created.join(", ")}`
        : "Aucune nouvelle demande (déjà en attente)"
    );
    return { success: true, created };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(run.id, AutomationStatus.FAILED, msg);
    throw e;
  }
}

type DocusealWebhookPayload = {
  event_type: string;
  data: {
    id: number;
    status?: string;
    combined_document_url?: string;
    documents?: { name: string; url: string }[];
    submitters?: { email?: string; status?: string }[];
  };
};

export async function handleDocusealWebhook(payload: DocusealWebhookPayload) {
  if (payload.event_type !== "submission.completed") {
    return { ignored: true, event: payload.event_type };
  }

  const submissionId = payload.data.id;
  const request = await prisma.signatureRequest.findUnique({
    where: { docusealSubmissionId: submissionId },
    include: { formation: true, stagiaire: true },
  });

  if (!request) {
    return { ignored: true, reason: "SignatureRequest introuvable" };
  }

  if (request.status === SignatureRequestStatus.COMPLETED) {
    return { skipped: true, reason: "Déjà traité" };
  }

  let downloadUrl =
    payload.data.combined_document_url ??
    payload.data.documents?.[0]?.url ??
    null;

  if (!downloadUrl) {
    const docs = await fetchSubmissionDocuments(submissionId);
    downloadUrl =
      docs.combined_document_url ?? docs.documents?.[0]?.url ?? null;
  }

  if (!downloadUrl) {
    throw new Error("URL du document signé introuvable");
  }

  const signedPdf = await downloadSignedDocument(downloadUrl);
  const base = request.formation.storagePath;
  if (!base) throw new Error("storagePath formation manquant");

  let filename: string;
  if (request.documentType === SignatureDocumentType.CONVENTION) {
    filename = `Convention_signee-${safeFilenamePart(request.formation.nomClient)}.pdf`;
  } else {
    const nom = request.stagiaire
      ? safeFilenamePart(`${request.stagiaire.nom}-${request.stagiaire.prenom}`)
      : "stagiaire";
    filename = `Reglement_interieur_signe-${nom}.pdf`;
  }

  const signedPath = subPath(base, "avant-la-formation", filename);
  await writeFile(signedPath, signedPdf);

  const now = new Date();
  await prisma.signatureRequest.update({
    where: { id: request.id },
    data: {
      status: SignatureRequestStatus.COMPLETED,
      signedPdfPath: signedPath,
      completedAt: now,
    },
  });

  if (request.documentType === SignatureDocumentType.CONVENTION) {
    await prisma.formation.update({
      where: { id: request.formationId },
      data: { conventionSigned: true, conventionSignedAt: now },
    });
  } else if (request.stagiaireId) {
    await prisma.stagiaire.update({
      where: { id: request.stagiaireId },
      data: { riSigned: true, riSignedAt: now },
    });
  }

  return { success: true, signedPath, documentType: request.documentType };
}
