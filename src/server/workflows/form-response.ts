import { FormType, AutomationStatus, AutomationWorkflow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startRun, finishRun } from "@/server/services/audit";
import { getFormationBySlug } from "@/server/db/formation";
import { buildFormTemplateData } from "@/server/services/form-template-data";
import { stagiaireFullName } from "@/server/services/formation-data";
import { generatePdf, type TemplateKey } from "@/server/services/pdf";
import { subPath, writeFile } from "@/server/services/storage";

const FORM_CONFIG: Record<
  FormType,
  {
    template: TemplateKey;
    subdir: "avant-la-formation" | "apres-la-formation";
    workflow: AutomationWorkflow;
  }
> = {
  BESOINS_STAGIAIRE: {
    template: "besoins-stagiaire",
    subdir: "avant-la-formation",
    workflow: AutomationWorkflow.FORM_BESOINS_STAGIAIRE,
  },
  BESOINS_ENTREPRISE: {
    template: "besoins-entreprise",
    subdir: "avant-la-formation",
    workflow: AutomationWorkflow.FORM_BESOINS_ENTREPRISE,
  },
  EVAL_CHAUD: {
    template: "eval-chaud",
    subdir: "apres-la-formation",
    workflow: AutomationWorkflow.FORM_EVAL_CHAUD,
  },
  EVAL_ENTREPRISE: {
    template: "eval-entreprise",
    subdir: "apres-la-formation",
    workflow: AutomationWorkflow.FORM_EVAL_ENTREPRISE,
  },
  EVAL_FROID: {
    template: "eval-froid",
    subdir: "apres-la-formation",
    workflow: AutomationWorkflow.EVAL_FROID,
  },
};

function outputFilename(
  type: FormType,
  formation: { intitule: string; intituleCommercial: string },
  stagiaire?: { nom: string; prenom: string } | null
) {
  const safe = (s: string) => s.replace(/[/\\?%*:|"<>]/g, "-").trim();
  switch (type) {
    case "BESOINS_STAGIAIRE":
      return `Evaluation_besoin_stagiaire_${safe(stagiaire?.nom ?? "stagiaire")}_${safe(stagiaire?.prenom ?? "")}.pdf`;
    case "BESOINS_ENTREPRISE":
      return `Evaluation_besoin_entreprise_${Date.now()}.pdf`;
    case "EVAL_CHAUD":
      return `Evaluation_satisfaction_${safe(stagiaireFullName(stagiaire!))}.pdf`;
    case "EVAL_ENTREPRISE":
      return `Evaluation_satisfaction_entreprise_${Date.now()}.pdf`;
    case "EVAL_FROID":
      return `Evaluation_a_froid_${safe(stagiaire?.nom ?? "stagiaire")}_${safe(stagiaire?.prenom ?? "")}.pdf`;
    default:
      return `${type}-${Date.now()}.pdf`;
  }
}

export async function processFormSubmission(
  slug: string,
  type: FormType,
  responses: Record<string, string>,
  stagiaireId?: string
) {
  const formation = await getFormationBySlug(slug);
  if (!formation?.storagePath) {
    throw new Error(
      "Formation introuvable ou pas encore lancée (dossier storage manquant)."
    );
  }

  const stagiaire = stagiaireId
    ? formation.stagiaires.find((s) => s.id === stagiaireId)
    : undefined;

  if (
    (type === FormType.BESOINS_STAGIAIRE ||
      type === FormType.EVAL_CHAUD ||
      type === FormType.EVAL_FROID) &&
    !stagiaire
  ) {
    throw new Error("Lien formulaire invalide : identifiant stagiaire manquant.");
  }

  const cfg = FORM_CONFIG[type];
  const run = await startRun(cfg.workflow, formation.id, responses);

  try {
    const data = buildFormTemplateData(formation, responses, stagiaire);
    const doc = await generatePdf(cfg.template, data);
    const filename = outputFilename(type, formation, stagiaire);
    const pdfPath = subPath(formation.storagePath, cfg.subdir, filename);
    await writeFile(pdfPath, doc.buffer);

    await prisma.formSubmission.create({
      data: {
        formationId: formation.id,
        type,
        stagiaireId: stagiaire?.id,
        responses,
        pdfPath,
      },
    });

    await finishRun(run.id, AutomationStatus.SUCCESS, filename);
    return { pdfPath };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(run.id, AutomationStatus.FAILED, msg);
    throw e;
  }
}

export function formTypeFromRoute(route: string): FormType | null {
  const map: Record<string, FormType> = {
    "besoins-stagiaire": FormType.BESOINS_STAGIAIRE,
    "besoins-entreprise": FormType.BESOINS_ENTREPRISE,
    "eval-chaud": FormType.EVAL_CHAUD,
    "eval-entreprise": FormType.EVAL_ENTREPRISE,
    "eval-froid": FormType.EVAL_FROID,
  };
  return map[route] ?? null;
}
