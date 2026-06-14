import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Stagiaire } from "@prisma/client";
import { SCALE_ACQUIS_FROID } from "@/lib/public-form-schemas";
import {
  buildTemplateData,
  stagiaireFullName,
  type FormationFull,
} from "@/server/services/formation-data";

function acquisFroidLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const opt = SCALE_ACQUIS_FROID?.find((o) => o.value === trimmed);
  return opt?.label ?? trimmed;
}

export type EvalFroidObjectifRow = {
  num: string;
  libelle: string;
  acquis: string;
  commentaire: string;
};

function fmtDate(d: Date) {
  return format(d, "d MMMM yyyy", { locale: fr });
}

function fmtDateShort(d: Date) {
  return format(d, "dd/MM/yyyy", { locale: fr });
}

/** Données pour remplir les modèles Word (tags {{Q1}}, {{EVAL_*}}, etc.). */
export function buildFormTemplateData(
  formation: FormationFull,
  responses: Record<string, string>,
  stagiaire?: Stagiaire | null
) {
  const data = buildTemplateData(formation, { ...responses });

  for (const [key, value] of Object.entries(responses)) {
    if (value === undefined || value === null) continue;
    const v = String(value).trim();
    data[key] = v;
    data[key.toUpperCase()] = v;
  }

  for (let i = 1; i <= 8; i++) {
    const k = `Q${i}`;
    if (!data[k]?.trim()) data[k] = "—";
  }

  const now = new Date();
  data.DATE = fmtDateShort(now);
  data.DATE_SIGNATURE = fmtDateShort(now);

  if (stagiaire) {
    const nomComplet = stagiaireFullName(stagiaire);
    data.NOM = responses.NOM || stagiaire.nom;
    data.PRENOM = responses.PRENOM || stagiaire.prenom;
    data.FONCTION = responses.FONCTION || stagiaire.fonction || "";
    data.TEL = responses.TEL || stagiaire.telephone || "";
    data.EMAIL = responses.EMAIL || stagiaire.email;
    data.stagiaire = nomComplet;
    data.stagiaire_1 = nomComplet;
    data.NOM_PRENOM_STAGIAIRE = nomComplet;
  }

  const objectifsRows: EvalFroidObjectifRow[] = formation.objectifs.map((o, i) => {
    const n = i + 1;
    const acquisKey = `ACQUIS_${n}`;
    const rawAcquis = responses[acquisKey] ?? data[acquisKey] ?? "";
    return {
      num: String(n),
      libelle: o.libelle,
      acquis: acquisFroidLabel(String(rawAcquis)),
      commentaire: responses[`COMMENTAIRE_OBJ_${n}`] ?? "",
    };
  });
  (data as Record<string, unknown>).OBJECTIFS = objectifsRows;

  formation.objectifs.forEach((o, i) => {
    const n = i + 1;
    data[`OBJECTIFS_DE_FORMATION_${n}`] = o.libelle;
    data[`ACQUIS_${n}`] = objectifsRows[i]?.acquis ?? "";
    data[`COMMENTAIRE_OBJ_${n}`] = objectifsRows[i]?.commentaire ?? "";
  });

  if (!data.changements) data.changements = "";
  if (!data.commentaires) data.commentaires = "";
  if (!data.note) data.note = "";
  if (!data.SIGNATURE) data.SIGNATURE = "";

  data.DATES_DE_FORMATION =
    data.DATES_DE_FORMATION ||
    `du ${fmtDate(formation.dateDebut)} au ${fmtDate(formation.dateFin)}`;

  return data;
}
