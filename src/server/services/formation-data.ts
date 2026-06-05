import { addMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import type {
  Formation,
  Entreprise,
  Formateur,
  Seance,
  ObjectifFormation,
  Stagiaire,
} from "@prisma/client";
import { getClientConfig } from "@/lib/config";

export type FormationFull = Formation & {
  entreprise: Entreprise | null;
  formateur: Formateur | null;
  seances: Seance[];
  objectifs: ObjectifFormation[];
  stagiaires: Stagiaire[];
};

function fmtDate(d: Date) {
  return format(d, "d MMMM yyyy", { locale: fr });
}

function fmtDateShort(d: Date) {
  return format(d, "dd/MM/yyyy", { locale: fr });
}

function fmtEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function datesRange(debut: Date, fin: Date) {
  return `du ${fmtDate(debut)} au ${fmtDate(fin)}`;
}

export function stagiaireFullName(s: { prenom: string; nom: string }) {
  return `${s.prenom} ${s.nom}`.trim();
}

export function buildTemplateData(
  formation: FormationFull,
  extra: Record<string, unknown> = {}
) {
  const raison =
    formation.entreprise?.raisonSociale ?? formation.nomClient;
  const tarifPersonne =
    formation.tarifParPersonne ??
    (formation.stagiaires.length > 0
      ? formation.tarifTotalHt / formation.stagiaires.length
      : formation.tarifTotalHt);
  const objectifsLines = formation.objectifs.map((o) => `• ${o.libelle}`);
  const objectifsText = objectifsLines.join("\n") || "—";
  const listeStagiaire = formation.stagiaires
    .map((s) => `• ${stagiaireFullName(s)} — ${s.email}`)
    .join("\n");
  const datesFormation = datesRange(formation.dateDebut, formation.dateFin);
  const seanceEmargement = formation.seances.find((s) => s.includeInEmargement);
  const now = new Date();

  const core: Record<string, string> = {
    // Convention & documents administratifs
    NUMERO_CONVENTION:
      formation.codeFormation?.trim() ||
      `CONV-${formation.slug.toUpperCase().replace(/-/g, "")}`,
    DATE_CONVENTION: fmtDate(now),
    RAISON_SOCIALE: raison,
    ADRESSE_POSTALE: formation.entreprise?.adresse ?? "",
    CODE_POSTAL: formation.entreprise?.codePostal ?? "",
    VILLE: formation.entreprise?.ville ?? "",
    NOM_DE_LA_FORMATION: formation.intituleCommercial || formation.intitule,
    OBJECTIFS_DE_FORMATION: objectifsText,
    DATES_DE_FORMATION: datesFormation,
    DATES_DE_FORMATION_M_1: fmtDate(addMonths(formation.dateDebut, -1)),
    DUREE_DE_LA_FORMATION: `${formation.dureeHeures} heures`,
    "DURÉE_DE_LA_FORMATION": `${formation.dureeHeures} heures`,
    LIEU_DE_LA_FORMATION: formation.lieu,
    liste_stagiaire: listeStagiaire,
    NOMBRE_STAGIAIRES: String(formation.stagiaires.length),
    TARIF_FORMATION_PERSONNE: fmtEuro(tarifPersonne),
    TARIF_FORMATION: fmtEuro(formation.tarifTotalHt),

    // Émargement
    FORMATEUR: formation.formateur?.nom ?? "",
    DATE_DEBUT__FORMATION: fmtDate(formation.dateDebut),
    DATE_FIN__FORMATION: fmtDate(formation.dateFin),
    DUREE_HEURES: String(formation.dureeHeures),
    DATE_LONGUE: seanceEmargement
      ? fmtDate(seanceEmargement.date)
      : fmtDate(formation.dateDebut),
    HORAIRES: seanceEmargement
      ? `${seanceEmargement.heureDebut} – ${seanceEmargement.heureFin}`
      : "",

    // Attestation / certificat
    DATE: fmtDate(now),
    stagiaire: listeStagiaire,
    RAISON_SOCIAL: raison,
    NOMBRE_HEURES: String(formation.dureeHeures),

    // Preuves d'envoi (avant formation)
    INTITULE_FORMATION: formation.intituleCommercial || formation.intitule,
    NOM_ENTREPRISE: raison,
    FORMATION_INTITULE: formation.intituleCommercial || formation.intitule,
    ENTREPRISE_NOM: raison,

    // Alias legacy (anciennes clés camelCase — évite "undefined")
    intitule: formation.intitule,
    intituleCommercial: formation.intituleCommercial,
    nomClient: formation.nomClient,
    raisonSociale: raison,
    adresse: formation.entreprise?.adresse ?? "",
    ville: formation.entreprise?.ville ?? "",
    codePostal: formation.entreprise?.codePostal ?? "",
    lieu: formation.lieu,
    dureeHeures: String(formation.dureeHeures),
    tarifTotalHt: String(formation.tarifTotalHt),
    dateDebut: fmtDate(formation.dateDebut),
    dateFin: fmtDate(formation.dateFin),
    formateur: formation.formateur?.nom ?? "",
    objectifs: objectifsText,
    orgName: getClientConfig().orgName,
    ORG_NAME: getClientConfig().orgName,
  };

  formation.stagiaires.forEach((s, i) => {
    const name = stagiaireFullName(s);
    core[`stagiaire_${i + 1}`] = name;
  });

  formation.objectifs.forEach((o, i) => {
    core[`OBJECTIFS_DE_FORMATION_${i + 1}`] = o.libelle;
  });

  const merged = { ...core, ...flattenExtra(extra) };
  applyExtraAliases(merged, extra, formation);
  return merged;
}

export type EmargementSeanceRow = {
  DATE_LONGUE: string;
  HORAIRES: string;
};

/** Données émargement : boucle Word {{#SEANCES}} (dates + horaires par séance). */
export function buildEmargementData(
  formation: FormationFull,
  stagiaire: Stagiaire
): Record<string, string | EmargementSeanceRow[]> {
  const data = buildTemplateData(formation, {
    stagiaireNom: stagiaireFullName(stagiaire),
    stagiaireEmail: stagiaire.email,
  });

  const seances: EmargementSeanceRow[] = formation.seances
    .filter((s) => s.includeInEmargement)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((s) => ({
      DATE_LONGUE: fmtDateShort(s.date),
      HORAIRES: `${s.heureDebut} - ${s.heureFin}`,
    }));

  return { ...data, SEANCES: seances };
}

function flattenExtra(extra: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined || v === null) {
      out[k] = "";
      continue;
    }
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean") out[k] = String(v);
    else out[k] = JSON.stringify(v);
  }
  return out;
}

/** Mappe les champs passés par les workflows vers les tags Word. */
function applyExtraAliases(
  data: Record<string, string>,
  extra: Record<string, unknown>,
  formation: FormationFull
) {
  const str = (k: string) =>
    typeof extra[k] === "string" ? (extra[k] as string) : data[k] ?? "";

  if (extra.stagiaireNom) {
    data.STAGIAIRE_NOM_PRENOM = str("stagiaireNom");
    data.stagiaire = str("stagiaireNom");
    data.stagiaire_1 = str("stagiaireNom");
    data.NOM_PRENOM_STAGIAIRE = str("stagiaireNom");
  }

  if (extra.destinataire) {
    data.TYPE_DESTINATAIRE = str("destinataire");
  }
  if (extra.email) {
    data.EMAIL_DESTINATAIRES = str("email");
    data.STAGIAIRE_EMAIL = str("email");
    data.ENTREPRISE_EMAIL = str("email");
  }
  if (extra.dateEnvoi) {
    data.DATE_ENVOI = str("dateEnvoi");
  }
  const heure =
    typeof extra.heureEnvoi === "string"
      ? extra.heureEnvoi
      : format(new Date(), "HH:mm", { locale: fr });
  data.HEURE_ENVOI = heure;

  if (extra.documentsEnvoyes) {
    data.DOCUMENTS_ENVOYES = str("documentsEnvoyes");
  }
  if (extra.liensTransmis) {
    data.LIENS_TRANSMIS = str("liensTransmis");
  }
  if (extra.lienForm) {
    data.LIEN_FORM_EVAL_CHAUD = str("lienForm");
    data.LIEN_FORM_EVAL_ENTREPRISE = str("lienForm");
    data.LIEN_FORM_EVAL_FROID = str("lienForm");
  }
  if (extra.pieceJointe) {
    data.PIECE_JOINTE_1 = str("pieceJointe");
  }

  // Réponses formulaires POC → champs eval besoins
  const responseKeys = Object.keys(extra).filter(
    (k) =>
      ![
        "stagiaireNom",
        "stagiaireEmail",
        "destinataire",
        "email",
        "dateEnvoi",
        "heureEnvoi",
        "documentsEnvoyes",
        "liensTransmis",
        "lienForm",
        "pieceJointe",
        "reponses",
      ].includes(k)
  );
  responseKeys.forEach((k) => {
    const v = extra[k];
    if (typeof v !== "string" || !v) return;
    const upper = k.toUpperCase();
    data[upper] = v;
    // Ne pas renuméroter les champs identité (NOM, EMAIL…) vers Q1, Q2… — aligné sur les tags Word.
    if (/^Q\d+$/i.test(k)) {
      data[upper] = v;
    }
  });

  if (extra.reponses && typeof extra.reponses === "string") {
    data.Q1 = extra.reponses.slice(0, 500);
  }

  const first = formation.stagiaires[0];
  if (first) {
    data.NOM = data.NOM || first.nom;
    data.PRENOM = data.PRENOM || first.prenom;
    data.FONCTION = data.FONCTION || first.fonction || "";
    data.TEL = data.TEL || first.telephone || "";
    data.EMAIL = data.EMAIL || first.email;
  }
}

export function buildPreuveAvantStagiaireData(
  formation: FormationFull,
  stagiaire: Stagiaire,
  docs: string[],
  lien: string
) {
  const now = new Date();
  return buildTemplateData(formation, {
    destinataire: stagiaireFullName(stagiaire),
    email: stagiaire.email,
    dateEnvoi: now.toLocaleDateString("fr-FR"),
    heureEnvoi: format(now, "HH:mm"),
    documentsEnvoyes: docs.join(", "),
    liensTransmis: lien,
    TYPE_DESTINATAIRE: "Stagiaire",
  });
}

export function buildPreuveAvantEntrepriseData(
  formation: FormationFull,
  docs: string[],
  lien: string
) {
  const now = new Date();
  return buildTemplateData(formation, {
    destinataire: formation.entreprise?.raisonSociale ?? formation.nomClient,
    email: formation.entreprise?.email ?? "",
    dateEnvoi: now.toLocaleDateString("fr-FR"),
    heureEnvoi: format(now, "HH:mm"),
    documentsEnvoyes: docs.join(", "),
    liensTransmis: lien,
    TYPE_DESTINATAIRE: "Entreprise",
  });
}

export function formUrl(slug: string, type: string) {
  const base = getClientConfig().formBaseUrl;
  return `${base}/f/${slug}/${type}`;
}

export function evalFroidDueDate(dateFin: Date): Date {
  return addMonths(dateFin, 2);
}
