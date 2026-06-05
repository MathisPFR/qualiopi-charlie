import { FormType } from "@prisma/client";

export const STAGIAIRE_FORM_TYPES: FormType[] = [
  FormType.BESOINS_STAGIAIRE,
  FormType.EVAL_CHAUD,
  FormType.EVAL_FROID,
];

export const ENTREPRISE_FORM_TYPES: FormType[] = [
  FormType.BESOINS_ENTREPRISE,
  FormType.EVAL_ENTREPRISE,
];

export const FORM_TYPE_LABELS: Record<FormType, string> = {
  BESOINS_STAGIAIRE: "Besoins stagiaire",
  BESOINS_ENTREPRISE: "Besoins entreprise",
  EVAL_CHAUD: "Éval. à chaud",
  EVAL_ENTREPRISE: "Éval. entreprise",
  EVAL_FROID: "Éval. à froid",
};

export const FORM_TYPE_PHASE: Record<FormType, string> = {
  BESOINS_STAGIAIRE: "Avant formation",
  BESOINS_ENTREPRISE: "Avant formation",
  EVAL_CHAUD: "Après formation",
  EVAL_ENTREPRISE: "Après formation",
  EVAL_FROID: "Suivi M+2",
};

export type FormSubmissionRecord = {
  type: FormType;
  stagiaireId: string | null;
  createdAt: Date;
  pdfPath: string | null;
};

export type FormAnswerStatus = {
  responded: boolean;
  respondedAt: Date | null;
  pdfPath: string | null;
};

export type EntrepriseFormStatus = {
  type: FormType;
  label: string;
  phase: string;
} & FormAnswerStatus;

export type StagiaireFormStatusRow = {
  id: string;
  name: string;
  forms: ({ type: FormType; label: string; phase: string } & FormAnswerStatus)[];
  answeredCount: number;
  totalCount: number;
};

export type FormationFormStatus = {
  entreprise: EntrepriseFormStatus[];
  stagiaires: StagiaireFormStatusRow[];
  summary: {
    answered: number;
    total: number;
    entrepriseAnswered: number;
    entrepriseTotal: number;
    stagiairesAnswered: number;
    stagiairesTotal: number;
  };
};

function submissionKey(type: FormType, stagiaireId: string | null) {
  return `${type}:${stagiaireId ?? ""}`;
}

function latestSubmissions(
  submissions: FormSubmissionRecord[]
): Map<string, FormSubmissionRecord> {
  const latest = new Map<string, FormSubmissionRecord>();
  for (const s of submissions) {
    const key = submissionKey(s.type, s.stagiaireId);
    const existing = latest.get(key);
    if (!existing || s.createdAt > existing.createdAt) {
      latest.set(key, s);
    }
  }
  return latest;
}

function toAnswerStatus(sub?: FormSubmissionRecord): FormAnswerStatus {
  if (!sub) {
    return { responded: false, respondedAt: null, pdfPath: null };
  }
  return {
    responded: true,
    respondedAt: sub.createdAt,
    pdfPath: sub.pdfPath,
  };
}

export function buildFormationFormStatus(
  stagiaires: { id: string; prenom: string; nom: string }[],
  submissions: FormSubmissionRecord[]
): FormationFormStatus {
  const latest = latestSubmissions(submissions);

  const entreprise = ENTREPRISE_FORM_TYPES.map((type) => ({
    type,
    label: FORM_TYPE_LABELS[type],
    phase: FORM_TYPE_PHASE[type],
    ...toAnswerStatus(latest.get(submissionKey(type, null))),
  }));

  const stagiaireRows = stagiaires.map((st) => {
    const forms = STAGIAIRE_FORM_TYPES.map((type) => ({
      type,
      label: FORM_TYPE_LABELS[type],
      phase: FORM_TYPE_PHASE[type],
      ...toAnswerStatus(latest.get(submissionKey(type, st.id))),
    }));
    return {
      id: st.id,
      name: `${st.prenom} ${st.nom}`.trim(),
      forms,
      answeredCount: forms.filter((f) => f.responded).length,
      totalCount: forms.length,
    };
  });

  const entrepriseAnswered = entreprise.filter((f) => f.responded).length;
  const stagiairesAnswered = stagiaireRows.reduce((n, r) => n + r.answeredCount, 0);
  const stagiairesTotal = stagiaireRows.length * STAGIAIRE_FORM_TYPES.length;

  return {
    entreprise,
    stagiaires: stagiaireRows,
    summary: {
      answered: entrepriseAnswered + stagiairesAnswered,
      total: ENTREPRISE_FORM_TYPES.length + stagiairesTotal,
      entrepriseAnswered,
      entrepriseTotal: ENTREPRISE_FORM_TYPES.length,
      stagiairesAnswered,
      stagiairesTotal,
    },
  };
}

export function formatFormCompletionLabel(summary: FormationFormStatus["summary"]) {
  return `${summary.answered}/${summary.total} réponse${summary.total > 1 ? "s" : ""}`;
}

/** Chemin relatif au dossier formation pour l'API `/file?rel=`. */
export function pdfPathToRel(
  storagePath: string | null | undefined,
  pdfPath: string | null
): string | null {
  if (!storagePath || !pdfPath) return null;
  const normalizedBase = storagePath.replace(/\\/g, "/").replace(/\/$/, "");
  const normalizedPdf = pdfPath.replace(/\\/g, "/");
  if (!normalizedPdf.startsWith(normalizedBase)) return null;
  const rel = normalizedPdf.slice(normalizedBase.length).replace(/^\//, "");
  return rel || null;
}
