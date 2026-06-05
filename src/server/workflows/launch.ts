import path from "path";
import fs from "fs/promises";
import { AutomationStatus, AutomationWorkflow, FormationStatut } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getTemplatesRoot } from "@/lib/config";
import { startRun, finishRun } from "@/server/services/audit";
import { getFormationFull } from "@/server/db/formation";
import {
  buildTemplateData,
  buildPreuveAvantEntrepriseData,
  buildPreuveAvantStagiaireData,
  formUrl,
  stagiaireFullName,
} from "@/server/services/formation-data";
import { convertStaticDocxToPdf, generatePdf } from "@/server/services/pdf";
import { sendMail } from "@/server/services/mail";
import {
  launchEntrepriseEmail,
  launchStagiaireEmail,
  shouldAttachLivret,
} from "@/server/services/email-templates";
import {
  buildFormationFolderName,
  ensureFormationStorage,
  subPath,
  writeFile,
} from "@/server/services/storage";
import { sendLaunchSignatureRequests } from "@/server/workflows/signatures";
import { isDocusealEnabled } from "@/server/services/docuseal";

function safeFilenamePart(s: string) {
  return s.replace(/[/\\?%*:|"<>]/g, "-").trim().slice(0, 60) || "client";
}

async function resolveLivretPath(): Promise<string | null> {
  const candidates = [
    path.join(getTemplatesRoot(), "static", "2 - LIVRET D_ACCUEIL V2026.pdf"),
    path.join(
      getTemplatesRoot(),
      "avant-la-formation",
      "2 - LIVRET D_ACCUEIL V2026.pdf"
    ),
  ];
  for (const p of candidates) {
    if (await fileExists(p)) return p;
  }
  return null;
}

export async function launchFormation(formationId: string) {
  const formation = await getFormationFull(formationId);
  if (!formation) throw new Error("Formation introuvable");
  if (formation.storagePath && formation.conventionGenerated) {
    return { skipped: true, message: "Lancement déjà effectué (idempotent)" };
  }

  if (!formation.devisPath) {
    throw new Error(
      "Devis obligatoire : importez le PDF du devis avant de lancer la formation."
    );
  }
  if (!(await fileExists(formation.devisPath))) {
    throw new Error(
      "Fichier devis introuvable sur le disque. Réimportez le devis."
    );
  }

  const run = await startRun(AutomationWorkflow.LANCEMENT, formationId);
  try {
    const year = formation.dateDebut.getFullYear();
    const folderName = buildFormationFolderName(
      year,
      formation.nomClient,
      formation.intitule
    );
    const base =
      formation.storagePath ??
      (await ensureFormationStorage(folderName));

    await prisma.formation.update({
      where: { id: formationId },
      data: {
        storagePath: base,
        statut: FormationStatut.A_LANCER,
        lancementAt: new Date(),
      },
    });

    const tplData = buildTemplateData(formation);
    const conventionDoc = await generatePdf("convention", tplData);
    const conventionFilename = `Convention-${safeFilenamePart(formation.nomClient)}.pdf`;
    const conventionPath = subPath(
      base,
      "avant-la-formation",
      conventionFilename
    );
    await writeFile(conventionPath, conventionDoc.buffer);

    const devisDest = subPath(base, "avant-la-formation", "Devis.pdf");
    if (formation.devisPath !== devisDest) {
      const devisBuf = await fs.readFile(formation.devisPath);
      await writeFile(devisDest, devisBuf);
      await prisma.formation.update({
        where: { id: formationId },
        data: { devisPath: devisDest },
      });
    }
    const devisPath = devisDest;

    const cgvSrc = path.join(
      getTemplatesRoot(),
      "avant-la-formation",
      "2 - Conditions générales de vente - formation V2026.docx"
    );
    const cgvDest = subPath(base, "avant-la-formation", "CGV.pdf");
    let cgvReady = false;
    try {
      const cgvPdf = await convertStaticDocxToPdf(cgvSrc);
      await writeFile(cgvDest, cgvPdf);
      cgvReady = true;
    } catch {
      /* CGV optionnel */
    }

    const riSrc = path.join(
      getTemplatesRoot(),
      "avant-la-formation",
      "2 - REGLEMENT INTERIEUR-V2026.docx"
    );
    const riDest = subPath(base, "avant-la-formation", "Reglement-interieur.pdf");
    let riReady = false;
    let riPdf: Buffer | null = null;
    try {
      riPdf = await convertStaticDocxToPdf(riSrc);
      await writeFile(riDest, riPdf);
      riReady = true;
    } catch {
      /* */
    }

    const withLivret = shouldAttachLivret(formation.modalite);
    const livretPath = withLivret ? await resolveLivretPath() : null;
    const programmeReady =
      !!formation.programmePath && (await fileExists(formation.programmePath));
    const programmeFilename = programmeReady
      ? path.basename(formation.programmePath!)
      : null;

    const formBesoinsStagiaire = formUrl(formation.slug, "besoins-stagiaire");
    const formBesoinsEntreprise = formUrl(formation.slug, "besoins-entreprise");

    for (const stagiaire of formation.stagiaires) {
      const lienStagiaire = `${formBesoinsStagiaire}?stagiaire=${stagiaire.id}`;
      const mailStagiaire = launchStagiaireEmail(formation, lienStagiaire, {
        withLivret,
        withProgramme: programmeReady,
      });

      const attachmentNames: string[] = [];
      const attachments: { filename: string; path: string }[] = [];

      if (programmeReady && programmeFilename) {
        attachments.push({
          filename: programmeFilename,
          path: formation.programmePath!,
        });
        attachmentNames.push(programmeFilename);
      }
      if (livretPath) {
        attachments.push({
          filename: "Livret-accueil.pdf",
          path: livretPath,
        });
        attachmentNames.push("Livret-accueil.pdf");
      }
      if (riReady) {
        attachments.push({
          filename: "Reglement-interieur.pdf",
          path: riDest,
        });
        attachmentNames.push("Reglement-interieur.pdf");
      }

      await sendMail({
        to: stagiaire.email,
        subject: mailStagiaire.subject,
        html: mailStagiaire.html,
        attachments,
      });

      const preuveDoc = await generatePdf(
        "preuve-avant-stagiaire",
        buildPreuveAvantStagiaireData(
          formation,
          stagiaire,
          attachmentNames,
          lienStagiaire
        )
      );
      await writeFile(
        subPath(
          base,
          "preuves-qualiopi",
          `Preuve_envoi_stagiaire_${stagiaire.nom}.${preuveDoc.extension}`
        ),
        preuveDoc.buffer
      );
    }

    if (formation.entreprise?.email) {
      const entAttachmentNames: string[] = [
        conventionFilename,
        "Devis.pdf",
      ];
      const entAttachments: { filename: string; path: string }[] = [
        { filename: conventionFilename, path: conventionPath },
        { filename: "Devis.pdf", path: devisPath },
      ];
      if (cgvReady) {
        entAttachments.push({ filename: "CGV.pdf", path: cgvDest });
        entAttachmentNames.push("CGV.pdf");
      }

      const mailEntreprise = launchEntrepriseEmail(formation, formBesoinsEntreprise);
      await sendMail({
        to: formation.entreprise.email,
        subject: mailEntreprise.subject,
        html: mailEntreprise.html,
        attachments: entAttachments,
      });

      const preuveEntDoc = await generatePdf(
        "preuve-avant-entreprise",
        buildPreuveAvantEntrepriseData(
          formation,
          entAttachmentNames,
          formBesoinsEntreprise
        )
      );
      await writeFile(
        subPath(
          base,
          "preuves-qualiopi",
          `Preuve_envoi_entreprise.${preuveEntDoc.extension}`
        ),
        preuveEntDoc.buffer
      );
    }

    await prisma.formation.update({
      where: { id: formationId },
      data: { conventionGenerated: true },
    });

    if (isDocusealEnabled()) {
      await sendLaunchSignatureRequests(formationId, {
        conventionPath,
        conventionPdf: conventionDoc.buffer,
        conventionFilename,
        riPath: riReady ? riDest : null,
        riPdf: riReady ? riPdf : null,
      });
    }

    await finishRun(
      run.id,
      AutomationStatus.SUCCESS,
      isDocusealEnabled()
        ? "Lancement terminé (PDF + DocuSeal)"
        : "Lancement terminé (PDF)"
    );
    return { success: true, storagePath: base };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(run.id, AutomationStatus.FAILED, msg);
    throw e;
  }
}

async function fileExists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}
