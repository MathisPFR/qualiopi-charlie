import type { Modalite } from "@prisma/client";
import type { FormationInput } from "@/server/actions/formations";

export type StagiaireRow = {
  /** Clé React (stable à l’édition si id présent). */
  key: string;
  id?: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  fonction: string;
};

export type SeanceRow = {
  key: string;
  id?: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  nom: string;
  includeInEmargement: boolean;
};

export type FormationFormValues = FormationInput & {
  formationId?: string;
  entrepriseId?: string;
  formateurId?: string;
};

export type FormationFormInitial = Omit<
  FormationFormValues,
  "stagiaires" | "seances" | "objectifs"
> & {
  stagiaireRows: StagiaireRow[];
  seanceRows: SeanceRow[];
  objectifRows: string[];
};

export function newStagiaireRow(partial?: Partial<StagiaireRow>): StagiaireRow {
  return {
    key: partial?.id ?? `stg-${crypto.randomUUID()}`,
    id: partial?.id,
    prenom: partial?.prenom ?? "",
    nom: partial?.nom ?? "",
    email: partial?.email ?? "",
    telephone: partial?.telephone ?? "",
    fonction: partial?.fonction ?? "",
  };
}

export function newSeanceRow(partial?: Partial<SeanceRow>): SeanceRow {
  return {
    key: partial?.id ?? `sea-${crypto.randomUUID()}`,
    id: partial?.id,
    date: partial?.date ?? "",
    heureDebut: partial?.heureDebut ?? "09:00",
    heureFin: partial?.heureFin ?? "12:00",
    nom: partial?.nom ?? "Séance",
    includeInEmargement: partial?.includeInEmargement ?? true,
  };
}

export function stagiairesFromDb(
  stagiaires: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    telephone?: string | null;
    fonction?: string | null;
  }[]
): StagiaireRow[] {
  return stagiaires.map((s) =>
    newStagiaireRow({
      id: s.id,
      prenom: s.prenom,
      nom: s.nom,
      email: s.email,
      telephone: s.telephone ?? "",
      fonction: s.fonction ?? "",
    })
  );
}

export function seancesFromDb(
  seances: {
    id: string;
    date: Date;
    heureDebut: string;
    heureFin: string;
    nom: string;
    includeInEmargement: boolean;
  }[]
): SeanceRow[] {
  return seances.map((s) =>
    newSeanceRow({
      id: s.id,
      date: formatDateInput(s.date),
      heureDebut: s.heureDebut,
      heureFin: s.heureFin,
      nom: s.nom,
      includeInEmargement: s.includeInEmargement,
    })
  );
}

export function buildFormationPayload(
  fd: FormData,
  stagiaireRows: StagiaireRow[],
  seanceRows: SeanceRow[],
  objectifRows: string[]
): FormationFormValues {
  const tarifPar = fd.get("tarifParPersonne");
  const codeFormation = fd.get("codeFormation");

  return {
    formationId: String(fd.get("formationId") || "") || undefined,
    entrepriseId: String(fd.get("entrepriseId") || "") || undefined,
    formateurId: String(fd.get("formateurId") || "") || undefined,
    intitule: String(fd.get("intitule")),
    intituleCommercial: String(fd.get("intituleCommercial")),
    nomClient: String(fd.get("nomClient")),
    dateDebut: String(fd.get("dateDebut")),
    dateFin: String(fd.get("dateFin")),
    lieu: String(fd.get("lieu") || "") || undefined,
    modalite: (fd.get("modalite") as Modalite) || "DISTANCIEL",
    dureeHeures: Number(fd.get("dureeHeures")),
    tarifTotalHt: Number(fd.get("tarifTotalHt")),
    tarifParPersonne: tarifPar ? Number(tarifPar) : undefined,
    codeFormation: codeFormation ? String(codeFormation) : undefined,
    formateurNom: String(fd.get("formateurNom") || "") || undefined,
    entreprise: {
      raisonSociale: String(fd.get("raisonSociale")),
      email: String(fd.get("entrepriseEmail")),
      adresse: String(fd.get("adresse") || "") || undefined,
      codePostal: String(fd.get("codePostal") || "") || undefined,
      ville: String(fd.get("ville") || "") || undefined,
    },
    stagiaires: stagiaireRows
      .filter((s) => s.prenom.trim() || s.nom.trim() || s.email.trim())
      .map((s) => ({
        id: s.id,
        prenom: s.prenom.trim(),
        nom: s.nom.trim(),
        email: s.email.trim(),
        telephone: s.telephone.trim() || undefined,
        fonction: s.fonction.trim() || undefined,
      })),
    seances: seanceRows
      .filter((s) => s.date.trim())
      .map((s) => ({
        id: s.id,
        date: s.date.trim(),
        heureDebut: s.heureDebut.trim(),
        heureFin: s.heureFin.trim(),
        nom: s.nom.trim() || "Séance",
        includeInEmargement: s.includeInEmargement,
      })),
    objectifs: objectifRows.map((o) => o.trim()).filter(Boolean),
  };
}

export function validateFormationPayload(data: FormationFormValues): string | null {
  if (data.stagiaires.length === 0) {
    return "Ajoutez au moins un stagiaire.";
  }
  for (const s of data.stagiaires) {
    if (!s.prenom || !s.nom || !s.email) {
      return "Chaque stagiaire doit avoir un prénom, un nom et un e-mail.";
    }
    if (!s.email.includes("@")) {
      return `E-mail invalide pour ${s.prenom} ${s.nom}.`;
    }
  }
  if (data.seances.length === 0) {
    return "Ajoutez au moins une séance (pour les émargements).";
  }
  for (const s of data.seances) {
    if (!s.heureDebut || !s.heureFin) {
      return `Indiquez les horaires pour la séance du ${s.date}.`;
    }
  }
  return null;
}

export function formatDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const DEFAULT_FORMATION_FORM: FormationFormInitial = {
  intitule: "Formation Test",
  intituleCommercial: "Stratégie commerciale",
  nomClient: "Agence Charlie",
  dateDebut: "2026-06-07",
  dateFin: "2026-06-14",
  lieu: "Formation réalisée à distance, en visioconférence via Teams.",
  modalite: "DISTANCIEL",
  dureeHeures: 30,
  tarifTotalHt: 10000,
  tarifParPersonne: 1000,
  codeFormation: "222",
  formateurNom: "Anne Hélène Joulaud",
  entreprise: {
    raisonSociale: "Agence Charlie",
    email: "contact@charlie-uniquecontent.fr",
    adresse: "10 rue boissons",
    codePostal: "63800",
    ville: "Chamalières",
  },
  stagiaireRows: [
    newStagiaireRow({
      prenom: "Mathis",
      nom: "Petit",
      email: "mathispetitfr@gmail.com",
      fonction: "Commercial",
    }),
  ],
  seanceRows: [
    newSeanceRow({
      date: "2026-06-07",
      heureDebut: "9H",
      heureFin: "12H",
      nom: "Séance 1",
    }),
    newSeanceRow({
      date: "2026-06-08",
      heureDebut: "9H",
      heureFin: "13H",
      nom: "Séance 2",
    }),
  ],
  objectifRows: ["Objectif 1", "Objectif 2"],
};
