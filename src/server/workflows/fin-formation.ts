import path from "path";
import { AutomationStatus, AutomationWorkflow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startRun, finishRun } from "@/server/services/audit";
import { getFormationFull } from "@/server/db/formation";
import {
  buildTemplateData,
  formUrl,
  stagiaireFullName,
} from "@/server/services/formation-data";
import { generatePdf } from "@/server/services/pdf";
import { sendMail } from "@/server/services/mail";
import {
  finFormationEntrepriseEmail,
  finFormationStagiaireEmail,
} from "@/server/services/email-templates";
import { subPath, writeFile } from "@/server/services/storage";

export async function processFinFormation(formationId: string) {
  const formation = await getFormationFull(formationId);
  if (!formation?.storagePath) throw new Error("Dossier formation manquant");
  if (formation.finFormationProcessed) return { skipped: true };

  const run = await startRun(AutomationWorkflow.FIN_FORMATION, formationId);
  try {
    const base = formation.storagePath;
    const tpl = buildTemplateData(formation);
    const raison = formation.entreprise?.raisonSociale ?? formation.nomClient;

    const attestationDoc = await generatePdf("attestation", tpl);
    const attestationPath = subPath(
      base,
      "pendant-la-formation",
      `Attestation-de-presence-${formation.intitule}-${raison}.${attestationDoc.extension}`
    );
    await writeFile(attestationPath, attestationDoc.buffer);

    const certPaths: { stagiaireId: string; path: string; nom: string }[] = [];
    for (const s of formation.stagiaires) {
      const data = buildTemplateData(formation, {
        stagiaireNom: stagiaireFullName(s),
      });
      const certDoc = await generatePdf("certificat", data);
      const certPath = subPath(
        base,
        "apres-la-formation",
        `Certificat_de_realisation-${formation.intitule}-${s.nom}.${certDoc.extension}`
      );
      await writeFile(certPath, certDoc.buffer);
      certPaths.push({
        stagiaireId: s.id,
        path: certPath,
        nom: stagiaireFullName(s),
      });
    }

    const formEvalChaud = formUrl(formation.slug, "eval-chaud");
    const formEvalEntreprise = formUrl(formation.slug, "eval-entreprise");

    for (const item of certPaths) {
      const s = formation.stagiaires.find((x) => x.id === item.stagiaireId)!;
      const lienChaud = `${formEvalChaud}?stagiaire=${s.id}`;
      const mailChaud = finFormationStagiaireEmail(formation, lienChaud);
      await sendMail({
        to: s.email,
        subject: mailChaud.subject,
        html: mailChaud.html,
        attachments: [
          {
            filename: `Certificat_de_realisation-${formation.intitule}-${s.nom}.pdf`,
            path: item.path,
          },
        ],
      });
      const now = new Date();
      const preuveDoc = await generatePdf("preuve-eval-chaud", {
        ...tpl,
        stagiaireNom: item.nom,
        email: s.email,
        dateEnvoi: now.toLocaleDateString("fr-FR"),
        heureEnvoi: now.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        lienForm: lienChaud,
        pieceJointe: "Certificat.pdf",
      });
      await writeFile(
        subPath(base, "preuves-qualiopi", `Preuve_eval_chaud_${s.nom}.${preuveDoc.extension}`),
        preuveDoc.buffer
      );
    }

    if (formation.entreprise?.email) {
      const mailEnt = finFormationEntrepriseEmail(formation, formEvalEntreprise);
      await sendMail({
        to: formation.entreprise.email,
        subject: mailEnt.subject,
        html: mailEnt.html,
        attachments: [
          {
            filename: path.basename(attestationPath),
            path: attestationPath,
          },
        ],
      });
      const nowEnt = new Date();
      const preuveEntDoc = await generatePdf("preuve-eval-entreprise", {
        ...tpl,
        email: formation.entreprise.email,
        dateEnvoi: nowEnt.toLocaleDateString("fr-FR"),
        heureEnvoi: nowEnt.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        lienForm: formEvalEntreprise,
        pieceJointe: "Attestation.pdf",
      });
      await writeFile(
        subPath(
          base,
          "preuves-qualiopi",
          `Preuve_eval_entreprise.${preuveEntDoc.extension}`
        ),
        preuveEntDoc.buffer
      );
    }

    await prisma.formation.update({
      where: { id: formationId },
      data: { finFormationProcessed: true },
    });
    await finishRun(run.id, AutomationStatus.SUCCESS);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(run.id, AutomationStatus.FAILED, msg);
    throw e;
  }
}
