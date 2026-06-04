import { AutomationStatus, AutomationWorkflow } from "@prisma/client";
import { startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { startRun, finishRun } from "@/server/services/audit";
import {
  buildTemplateData,
  evalFroidDueDate,
  formUrl,
  stagiaireFullName,
} from "@/server/services/formation-data";
import { generatePdf } from "@/server/services/pdf";
import { sendMail } from "@/server/services/mail";
import { evalFroidStagiaireEmail } from "@/server/services/email-templates";
import { subPath, writeFile } from "@/server/services/storage";

export async function runEvalFroidCron() {
  const today = startOfDay(new Date());
  const formations = await prisma.formation.findMany({
    where: { evalFroidSent: false, finFormationProcessed: true },
    include: {
      entreprise: true,
      formateur: true,
      seances: true,
      objectifs: true,
      stagiaires: { where: { evalFroidSent: false } },
    },
  });

  const results: { formationId: string; sent: number }[] = [];

  for (const formation of formations) {
    const due = startOfDay(evalFroidDueDate(formation.dateFin));
    if (today.getTime() < due.getTime()) continue;
    if (!formation.storagePath || formation.stagiaires.length === 0) continue;

    const run = await startRun(AutomationWorkflow.EVAL_FROID, formation.id);
    try {
      const tpl = buildTemplateData(formation);
      const link = formUrl(formation.slug, "eval-froid");
      let sent = 0;
      for (const s of formation.stagiaires) {
        const lienFroid = `${link}?stagiaire=${s.id}`;
        const mailFroid = evalFroidStagiaireEmail(formation, lienFroid);
        await sendMail({
          to: s.email,
          subject: mailFroid.subject,
          html: mailFroid.html,
        });
        const now = new Date();
        const preuveDoc = await generatePdf("preuve-eval-froid", {
          ...tpl,
          stagiaireNom: stagiaireFullName(s),
          email: s.email,
          dateEnvoi: now.toLocaleDateString("fr-FR"),
          heureEnvoi: now.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          lienForm: lienFroid,
        });
        await writeFile(
          subPath(
            formation.storagePath,
            "preuves-qualiopi",
            `Preuve_eval_froid_${s.nom}.${preuveDoc.extension}`
          ),
          preuveDoc.buffer
        );
        await prisma.stagiaire.update({
          where: { id: s.id },
          data: { evalFroidSent: true },
        });
        sent++;
      }
      await prisma.formation.update({
        where: { id: formation.id },
        data: { evalFroidSent: true },
      });
      await finishRun(run.id, AutomationStatus.SUCCESS, `${sent} email(s)`);
      results.push({ formationId: formation.id, sent });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await finishRun(run.id, AutomationStatus.FAILED, msg);
    }
  }
  return results;
}
