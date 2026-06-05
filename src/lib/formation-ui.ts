import { FormationStatut, type AutomationWorkflow } from "@prisma/client";

export const STATUT_LABELS: Record<FormationStatut, string> = {
  BROUILLON: "Brouillon",
  A_LANCER: "À lancer",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
  ARCHIVEE: "Archivée",
};

export const STATUT_BADGE_VARIANT: Record<
  FormationStatut,
  "default" | "secondary" | "success" | "outline"
> = {
  BROUILLON: "outline",
  A_LANCER: "secondary",
  EN_COURS: "default",
  TERMINEE: "success",
  ARCHIVEE: "outline",
};

export const WORKFLOW_STEPS: {
  statut: FormationStatut;
  label: string;
  hint: string;
}[] = [
  {
    statut: FormationStatut.BROUILLON,
    label: "Préparation",
    hint: "Devis, stagiaires, séances",
  },
  {
    statut: FormationStatut.A_LANCER,
    label: "Lancement",
    hint: "Emails, conventions, formulaires",
  },
  {
    statut: FormationStatut.EN_COURS,
    label: "En cours",
    hint: "Émargements, formation active",
  },
  {
    statut: FormationStatut.TERMINEE,
    label: "Clôture",
    hint: "Attestation, certificats, évaluations",
  },
];

export function workflowStepIndex(statut: FormationStatut): number {
  if (statut === FormationStatut.ARCHIVEE) {
    return WORKFLOW_STEPS.length;
  }
  const i = WORKFLOW_STEPS.findIndex((s) => s.statut === statut);
  return i >= 0 ? i : 0;
}

export const AUTOMATION_WORKFLOW_LABELS: Partial<Record<AutomationWorkflow, string>> =
  {
    LANCEMENT: "Lancement",
    EMARGEMENTS: "Émargements",
    FIN_FORMATION: "Fin de formation",
    EVAL_FROID: "Évaluation à froid",
    FORM_BESOINS_STAGIAIRE: "Formulaire besoins stagiaire",
    FORM_BESOINS_ENTREPRISE: "Formulaire besoins entreprise",
    FORM_EVAL_CHAUD: "Évaluation à chaud",
    FORM_EVAL_ENTREPRISE: "Évaluation entreprise",
    SIGNATURES: "Signatures DocuSeal",
    TEST_EMAIL: "Test email",
  };
