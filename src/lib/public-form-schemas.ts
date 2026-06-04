import type { ObjectifFormation } from "@prisma/client";

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "number";

export type FormField = {
  name: string;
  label: string;
  type?: FormFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  description?: string;
  readOnly?: boolean;
};

export type FormSection = {
  title: string;
  description?: string;
  fields: FormField[];
};

export const SCALE_OUI_NON: FormField["options"] = [
  { value: "Oui", label: "Oui" },
  { value: "Non", label: "Non" },
];

/** Échelle 1–4 (éval à chaud) */
export const SCALE_1_4: FormField["options"] = [
  { value: "1", label: "1 — Insatisfaisant / Non, pas du tout" },
  { value: "2", label: "2 — Peu satisfaisant / Non, pas vraiment" },
  { value: "3", label: "3 — Satisfaisant / Oui, en partie" },
  { value: "4", label: "4 — Très satisfaisant / Oui, tout à fait" },
];

/** Échelle satisfaction entreprise 1–5 */
export const SCALE_1_5: FormField["options"] = [
  { value: "1", label: "1 — Pas du tout satisfait" },
  { value: "2", label: "2 — Plutôt non satisfait" },
  { value: "3", label: "3 — Moyennement satisfait" },
  { value: "4", label: "4 — Plutôt satisfait" },
  { value: "5", label: "5 — Totalement satisfait" },
];

export const SCALE_ACQUIS_FROID: FormField["options"] = [
  { value: "1", label: "1 — Pas acquis" },
  { value: "2", label: "2 — Partiellement acquis" },
  { value: "3", label: "3 — Acquis" },
  { value: "4", label: "4 — Totalement acquis" },
];

export const BESOINS_STAGIAIRE_SECTIONS: FormSection[] = [
  {
    title: "Identité",
    fields: [
      { name: "NOM", label: "Nom", type: "text", required: true },
      { name: "PRENOM", label: "Prénom", type: "text", required: true },
      { name: "FONCTION", label: "Fonction", type: "text", required: true },
      { name: "TEL", label: "Téléphone", type: "tel", required: true },
      { name: "EMAIL", label: "E-mail", type: "email", required: true },
    ],
  },
  {
    title: "Vos caractéristiques personnelles",
    fields: [
      {
        name: "Q1",
        label: "Êtes-vous en situation de handicap ?",
        type: "select",
        options: SCALE_OUI_NON,
        required: true,
      },
      {
        name: "Q2",
        label:
          "Si oui, quels sont les besoins à prendre en compte pour le déroulement de la formation (pédagogie, matériels, moyens…) ?",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    title: "Votre historique professionnel",
    fields: [
      {
        name: "Q3",
        label: "Quelle est votre formation initiale ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q4",
        label: "Décrivez succinctement votre parcours professionnel",
        type: "textarea",
        required: true,
      },
      {
        name: "Q5",
        label: "Quelles sont vos principales missions et activités ?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    title: "Vos projets",
    fields: [
      {
        name: "Q6",
        label: "Quelles sont vos motivations d'entrée en formation ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q7",
        label: "Quels sont vos objectifs, à quelle échéance ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q8",
        label:
          "Quel pourrait être l'impact de cette formation dans votre fonction actuelle ?",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    title: "Votre niveau",
    fields: [
      {
        name: "Q9",
        label: "Comment définiriez-vous votre niveau en informatique ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q10",
        label: "Avez-vous des attentes ou des besoins particuliers ? Si oui, précisez",
        type: "textarea",
        required: false,
      },
    ],
  },
];

export const BESOINS_ENTREPRISE_SECTIONS: FormSection[] = [
  {
    title: "Identité du répondant",
    fields: [
      { name: "NOM", label: "Nom", type: "text", required: true },
      { name: "PRENOM", label: "Prénom", type: "text", required: true },
      { name: "FONCTION", label: "Fonction", type: "text", required: true },
      { name: "TEL", label: "Téléphone", type: "tel", required: true },
      { name: "EMAIL", label: "E-mail", type: "email", required: true },
    ],
  },
  {
    title: "Salariés concernés",
    fields: [
      {
        name: "Q1",
        label: "Combien de salariés sont concernés par cette formation ?",
        type: "text",
        required: true,
        placeholder: "Ex. 3",
      },
      {
        name: "Q2",
        label: "Quelles sont leurs fonctions ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q3",
        label:
          "Avez-vous connaissance d'une situation de handicap concernant ces salariés ?",
        type: "select",
        options: SCALE_OUI_NON,
        required: true,
      },
    ],
  },
  {
    title: "Votre besoin",
    fields: [
      {
        name: "Q4",
        label:
          "Décrivez le contexte de votre structure, vos motivations et les problématiques rencontrées",
        type: "textarea",
        required: true,
      },
      {
        name: "Q5",
        label: "Quelles sont vos attentes et objectifs concernant notre formation ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q6",
        label: "À quelles échéances ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q7",
        label: "Quel impact cette formation doit-elle avoir sur votre structure ?",
        type: "textarea",
        required: true,
      },
      {
        name: "Q8",
        label:
          "Autres points (aménagements handicap, précisions complémentaires…)",
        type: "textarea",
        required: false,
      },
    ],
  },
];

export const EVAL_CHAUD_SECTIONS: FormSection[] = [
  {
    title: "Pour quelle(s) raison(s) avez-vous suivi cette formation ?",
    description: "Répondez Oui ou Non à chaque proposition.",
    fields: [
      {
        name: "RAISON_ENTREPRISE",
        label: "Formation prévue par votre entreprise ?",
        type: "select",
        options: SCALE_OUI_NON,
        required: true,
      },
      {
        name: "RAISON_COMPETENCES_ACTUELLES",
        label: "Utile pour renforcer vos compétences dans votre poste actuel ?",
        type: "select",
        options: SCALE_OUI_NON,
        required: true,
      },
      {
        name: "RAISON_NOUVELLES_COMPETENCES",
        label: "Utile pour acquérir de nouvelles compétences ?",
        type: "select",
        options: SCALE_OUI_NON,
        required: true,
      },
      {
        name: "RAISON_EVOLUTION_PRO",
        label: "Utile pour votre évolution professionnelle ?",
        type: "select",
        options: SCALE_OUI_NON,
        required: true,
      },
    ],
  },
  {
    title: "Votre évaluation de la formation",
    description: "1 = insatisfaisant · 4 = très satisfaisant",
    fields: [
      { name: "EVAL_COMMUNICATION", label: "Communication des objectifs et du programme avant la formation", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_ORGANISATION", label: "Organisation et déroulement de la formation", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_COMPOSITION_GROUPE", label: "Composition du groupe (effectif, niveaux homogènes)", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_MOYENS_MATERIELS", label: "Adéquation des moyens matériels mis à disposition", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_CONFORMITE_PROGRAMME", label: "Conformité de la formation dispensée au programme", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_CLARTE_CONTENU", label: "Clarté du contenu", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_QUALITE_SUPPORTS", label: "Qualité des supports pédagogiques", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_ANIMATION", label: "Animation de la formation par le ou les intervenants", type: "select", options: SCALE_1_4, required: true },
      { name: "EVAL_PROGRESSION", label: "Progression de la formation (durée, rythme, théorie/pratique)", type: "select", options: SCALE_1_4, required: true },
      {
        name: "note",
        label: "Note globale de qualité de la formation (/10)",
        type: "number",
        required: true,
        placeholder: "Ex. 8",
      },
      {
        name: "COMMENTAIRES_EVALUATION",
        label: "Commentaires sur la qualité globale",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    title: "Votre satisfaction",
    description: "1 = non, pas du tout · 4 = oui, tout à fait",
    fields: [
      { name: "SATISF_ATTENTES_INITIALES", label: "La formation a-t-elle répondu à vos attentes initiales ?", type: "select", options: SCALE_1_4, required: true },
      { name: "SATISF_OBJECTIFS_ATTEINTS", label: "Pensez-vous avoir atteint les objectifs pédagogiques ?", type: "select", options: SCALE_1_4, required: true },
      { name: "SATISF_ADEQUATION_METIER", label: "Formation en adéquation avec le métier / le secteur ?", type: "select", options: SCALE_1_4, required: true },
      { name: "SATISF_RECOMMANDATION", label: "Recommanderiez-vous ce stage à un collègue du même métier ?", type: "select", options: SCALE_1_4, required: true },
      {
        name: "COMMENTAIRES_SATISFACTION",
        label: "Commentaires",
        type: "textarea",
        required: false,
      },
    ],
  },
];

export const EVAL_ENTREPRISE_SECTIONS: FormSection[] = [
  {
    title: "Satisfaction",
    description:
      "1 = pas du tout satisfait · 5 = totalement satisfait",
    fields: [
      {
        name: "SATISFACTION_ECHANGES",
        label: "Qualité des échanges (réactivité, communication)",
        type: "select",
        options: SCALE_1_5,
        required: true,
      },
      {
        name: "SATISFACTION_ADAPTATION",
        label: "Adaptation du programme aux besoins de vos salariés",
        type: "select",
        options: SCALE_1_5,
        required: true,
      },
      {
        name: "SATISFACTION_GESTION",
        label:
          "Qualité de la gestion administrative (devis, dossier de financement, facturation)",
        type: "select",
        options: SCALE_1_5,
        required: true,
      },
      {
        name: "SATISFACTION_CONFORMITE",
        label: "Conformité de l'action de formation à vos attentes",
        type: "select",
        options: SCALE_1_5,
        required: true,
      },
      {
        name: "SATISFACTION_SUIVI",
        label: "Qualité du suivi pédagogique des stagiaires",
        type: "select",
        options: SCALE_1_5,
        required: true,
      },
      {
        name: "SUGGESTION",
        label: "Suggestion d'amélioration",
        type: "textarea",
        required: false,
      },
      {
        name: "RETOURS",
        label: "Autres retours que vous souhaitez communiquer",
        type: "textarea",
        required: false,
      },
      {
        name: "SIGNATURE",
        label: "Nom du signataire (date = jour de la soumission)",
        type: "text",
        required: true,
      },
    ],
  },
];

export function buildEvalFroidSections(
  objectifs: Pick<ObjectifFormation, "libelle">[]
): FormSection[] {
  const objFields: FormField[] = [];
  const count = Math.max(objectifs.length, 1);

  for (let i = 0; i < Math.min(count, 10); i++) {
    const n = i + 1;
    const libelle = objectifs[i]?.libelle ?? `Objectif ${n}`;
    objFields.push({
      name: `ACQUIS_${n}`,
      label: `Objectif ${n} : ${libelle}`,
      description: "Degré d'acquisition en situation de travail",
      type: "select",
      options: SCALE_ACQUIS_FROID,
      required: true,
    });
    objFields.push({
      name: `COMMENTAIRE_OBJ_${n}`,
      label: `Commentaires (objectif ${n})`,
      type: "textarea",
      required: false,
    });
  }

  return [
    {
      title: "Évaluation par objectif pédagogique",
      description:
        "Ne remplissez que les objectifs qui vous concernent. Laissez vides les autres si besoin.",
      fields: objFields,
    },
    {
      title: "Bilan en situation professionnelle",
      fields: [
        {
          name: "changements",
          label:
            "En pratique dans votre travail, quels changements avez-vous constaté ?",
          type: "textarea",
          required: true,
        },
        {
          name: "commentaires",
          label: "Vos commentaires",
          type: "textarea",
          required: false,
        },
      ],
    },
  ];
}

export function flattenSections(sections: FormSection[]): FormField[] {
  return sections.flatMap((s) => s.fields);
}

export const PUBLIC_FORM_META: Record<
  string,
  { title: string; sections: FormSection[] | ((o: ObjectifFormation[]) => FormSection[]) }
> = {
  "besoins-stagiaire": {
    title: "Évaluation du besoin — Stagiaire",
    sections: BESOINS_STAGIAIRE_SECTIONS,
  },
  "besoins-entreprise": {
    title: "Évaluation du besoin — Entreprise",
    sections: BESOINS_ENTREPRISE_SECTIONS,
  },
  "eval-chaud": {
    title: "Évaluation à chaud — Stagiaire",
    sections: EVAL_CHAUD_SECTIONS,
  },
  "eval-entreprise": {
    title: "Évaluation de satisfaction — Entreprise",
    sections: EVAL_ENTREPRISE_SECTIONS,
  },
  "eval-froid": {
    title: "Évaluation à froid — Stagiaire",
    sections: (objectifs) => buildEvalFroidSections(objectifs),
  },
};
