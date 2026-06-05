"use server";

import { revalidatePath } from "next/cache";
import slugify from "slugify";
import { FormationStatut, Modalite } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { launchFormation } from "@/server/workflows/launch";
import {
  generateEmargements,
  regenerateEmargements,
} from "@/server/workflows/emargements";
import { processFinFormation } from "@/server/workflows/fin-formation";
import { runEvalFroidCron } from "@/server/workflows/eval-froid";
import { sendMail, getResendTestRecipient } from "@/server/services/mail";
import { startRun, finishRun } from "@/server/services/audit";
import { AutomationStatus, AutomationWorkflow } from "@prisma/client";
import {
  ensureFormationStorage,
  buildFormationFolderName,
  subPath,
  writeFile,
  removeFormationStorage,
} from "@/server/services/storage";
import { assertPdfUpload } from "@/server/services/file-security";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");
}

export async function listFormations() {
  await requireAuth();
  return prisma.formation.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      entreprise: true,
      stagiaires: { select: { id: true, prenom: true, nom: true } },
      formSubmissions: {
        select: { type: true, stagiaireId: true, createdAt: true, pdfPath: true },
      },
      _count: { select: { stagiaires: true } },
    },
  });
}

export async function getFormation(id: string) {
  await requireAuth();
  return prisma.formation.findUnique({
    where: { id },
    include: {
      entreprise: true,
      formateur: true,
      stagiaires: true,
      seances: { orderBy: { date: "asc" } },
      objectifs: true,
      automationRuns: { orderBy: { startedAt: "desc" }, take: 30 },
      formSubmissions: {
        orderBy: { createdAt: "desc" },
        select: {
          type: true,
          stagiaireId: true,
          createdAt: true,
          pdfPath: true,
        },
      },
      signatureRequests: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type FormationInput = {
  intitule: string;
  intituleCommercial: string;
  nomClient: string;
  dateDebut: string;
  dateFin: string;
  lieu?: string;
  modalite: Modalite;
  dureeHeures: number;
  tarifTotalHt: number;
  tarifParPersonne?: number;
  codeFormation?: string;
  entreprise: {
    raisonSociale: string;
    email: string;
    contactNom?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
  };
  formateurNom?: string;
  stagiaires: {
    id?: string;
    prenom: string;
    nom: string;
    email: string;
    telephone?: string;
    fonction?: string;
  }[];
  seances: {
    id?: string;
    nom?: string;
    date: string;
    heureDebut: string;
    heureFin: string;
    includeInEmargement?: boolean;
  }[];
  objectifs: string[];
};

export async function createFormation(data: FormationInput) {
  await requireAuth();
  const baseSlug = slugify(data.intituleCommercial, { lower: true, strict: true });
  let slug = baseSlug;
  let n = 0;
  while (await prisma.formation.findUnique({ where: { slug } })) {
    n++;
    slug = `${baseSlug}-${n}`;
  }

  const entreprise = await prisma.entreprise.create({
    data: {
      raisonSociale: data.entreprise.raisonSociale,
      email: data.entreprise.email,
      contactNom: data.entreprise.contactNom,
      adresse: data.entreprise.adresse,
      codePostal: data.entreprise.codePostal,
      ville: data.entreprise.ville,
    },
  });

  let formateurId: string | undefined;
  if (data.formateurNom) {
    const f = await prisma.formateur.create({
      data: { nom: data.formateurNom },
    });
    formateurId = f.id;
  }

  const formation = await prisma.formation.create({
    data: {
      slug,
      intitule: data.intitule,
      intituleCommercial: data.intituleCommercial,
      nomClient: data.nomClient,
      dateDebut: new Date(data.dateDebut),
      dateFin: new Date(data.dateFin),
      lieu: data.lieu,
      modalite: data.modalite,
      dureeHeures: data.dureeHeures,
      tarifTotalHt: data.tarifTotalHt,
      tarifParPersonne: data.tarifParPersonne,
      codeFormation: data.codeFormation,
      entrepriseId: entreprise.id,
      formateurId,
      stagiaires: {
        create: data.stagiaires.map(({ id: _id, ...s }) => s),
      },
      seances: {
        create: data.seances.map((s) => ({
          nom: s.nom ?? "Séance",
          date: new Date(s.date),
          heureDebut: s.heureDebut,
          heureFin: s.heureFin,
          includeInEmargement: s.includeInEmargement ?? true,
        })),
      },
      objectifs: {
        create: data.objectifs.filter(Boolean).map((libelle) => ({ libelle })),
      },
    },
  });

  revalidatePath("/");
  return formation.id;
}

export async function updateFormation(id: string, data: FormationInput) {
  await requireAuth();
  const existing = await prisma.formation.findUnique({
    where: { id },
    include: { stagiaires: true, seances: true },
  });
  if (!existing) throw new Error("Formation introuvable");

  await prisma.$transaction(async (tx) => {
    await tx.formation.update({
      where: { id },
      data: {
        intitule: data.intitule,
        intituleCommercial: data.intituleCommercial,
        nomClient: data.nomClient,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        lieu: data.lieu,
        modalite: data.modalite,
        dureeHeures: data.dureeHeures,
        tarifTotalHt: data.tarifTotalHt,
        tarifParPersonne: data.tarifParPersonne,
        codeFormation: data.codeFormation,
      },
    });

    if (existing.entrepriseId) {
      await tx.entreprise.update({
        where: { id: existing.entrepriseId },
        data: {
          raisonSociale: data.entreprise.raisonSociale,
          email: data.entreprise.email,
          adresse: data.entreprise.adresse,
          codePostal: data.entreprise.codePostal,
          ville: data.entreprise.ville,
        },
      });
    }

    if (data.formateurNom) {
      if (existing.formateurId) {
        await tx.formateur.update({
          where: { id: existing.formateurId },
          data: { nom: data.formateurNom },
        });
      } else {
        const f = await tx.formateur.create({ data: { nom: data.formateurNom } });
        await tx.formation.update({
          where: { id },
          data: { formateurId: f.id },
        });
      }
    }

    const keptStagiaireIds: string[] = [];
    for (const s of data.stagiaires) {
      const { id: stagiaireId, ...fields } = s;
      if (stagiaireId) {
        await tx.stagiaire.update({ where: { id: stagiaireId }, data: fields });
        keptStagiaireIds.push(stagiaireId);
      } else {
        const created = await tx.stagiaire.create({
          data: { formationId: id, ...fields },
        });
        keptStagiaireIds.push(created.id);
      }
    }
    await tx.stagiaire.deleteMany({
      where: {
        formationId: id,
        id: { notIn: keptStagiaireIds },
      },
    });

    const keptSeanceIds: string[] = [];
    for (const s of data.seances) {
      const { id: seanceId, ...fields } = s;
      const payload = {
        nom: fields.nom ?? "Séance",
        date: new Date(fields.date),
        heureDebut: fields.heureDebut,
        heureFin: fields.heureFin,
        includeInEmargement: fields.includeInEmargement ?? true,
      };
      if (seanceId) {
        await tx.seance.update({ where: { id: seanceId }, data: payload });
        keptSeanceIds.push(seanceId);
      } else {
        const created = await tx.seance.create({
          data: { formationId: id, ...payload },
        });
        keptSeanceIds.push(created.id);
      }
    }
    await tx.seance.deleteMany({
      where: {
        formationId: id,
        id: { notIn: keptSeanceIds },
      },
    });

    await tx.objectifFormation.deleteMany({ where: { formationId: id } });
    if (data.objectifs.filter(Boolean).length > 0) {
      await tx.objectifFormation.createMany({
        data: data.objectifs
          .filter(Boolean)
          .map((libelle) => ({ formationId: id, libelle })),
      });
    }
  });

  revalidatePath(`/formations/${id}`);
  revalidatePath(`/formations/${id}/edit`);
  revalidatePath("/");
}

export async function updateFormationStatut(id: string, statut: FormationStatut) {
  await requireAuth();
  const prev = await prisma.formation.findUnique({ where: { id } });
  if (!prev) throw new Error("Formation introuvable");

  await prisma.formation.update({ where: { id }, data: { statut } });

  if (statut === FormationStatut.EN_COURS && prev.statut !== FormationStatut.EN_COURS) {
    await generateEmargements(id);
  }
  if (statut === FormationStatut.TERMINEE && prev.statut !== FormationStatut.TERMINEE) {
    await processFinFormation(id);
  }

  revalidatePath(`/formations/${id}`);
  revalidatePath("/");
}

export async function uploadDevis(formationId: string, formData: FormData) {
  await requireAuth();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("Fichier devis manquant.");
  }

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
  });
  if (!formation) throw new Error("Formation introuvable");

  const buf = Buffer.from(await file.arrayBuffer());
  assertPdfUpload(file, buf);

  const year = formation.dateDebut.getFullYear();
  const folderName = buildFormationFolderName(
    year,
    formation.nomClient,
    formation.intitule
  );
  const base =
    formation.storagePath ??
    (await ensureFormationStorage(folderName));
  const dest = subPath(base, "avant-la-formation", "Devis.pdf");
  await writeFile(dest, buf);

  await prisma.formation.update({
    where: { id: formationId },
    data: {
      storagePath: base,
      devisPath: dest,
      devisUploadedAt: new Date(),
    },
  });

  revalidatePath(`/formations/${formationId}`);
  return { ok: true, path: dest };
}

export async function actionLaunchFormation(id: string) {
  await requireAuth();
  const formation = await prisma.formation.findUnique({ where: { id } });
  if (!formation?.devisPath) {
    throw new Error(
      "Importez le devis (PDF) avant de lancer la formation. Ce document sera envoyé à l'entreprise."
    );
  }
  const result = await launchFormation(id);
  revalidatePath(`/formations/${id}`);
  return result;
}

export async function actionRegenerateEmargements(id: string) {
  await requireAuth();
  await regenerateEmargements(id);
  revalidatePath(`/formations/${id}`);
  return { ok: true };
}

/** Remet la formation à l'état initial pour retester les workflows (POC). */
export async function resetFormationForTest(id: string) {
  await requireAuth();
  const formation = await prisma.formation.findUnique({ where: { id } });
  if (!formation) throw new Error("Formation introuvable");

  if (formation.storagePath) {
    await removeFormationStorage(formation.storagePath);
  }

  await prisma.$transaction([
    prisma.formSubmission.deleteMany({ where: { formationId: id } }),
    prisma.automationRun.deleteMany({ where: { formationId: id } }),
    prisma.stagiaire.updateMany({
      where: { formationId: id },
      data: { evalFroidSent: false },
    }),
    prisma.seance.updateMany({
      where: { formationId: id },
      data: { emargementGenerated: false },
    }),
    prisma.formation.update({
      where: { id },
      data: {
        statut: FormationStatut.BROUILLON,
        storagePath: null,
        programmePath: null,
        devisPath: null,
        devisUploadedAt: null,
        lancementAt: null,
        conventionGenerated: false,
        emargementsGenerated: false,
        finFormationProcessed: false,
        evalFroidSent: false,
      },
    }),
  ]);

  revalidatePath(`/formations/${id}`);
  revalidatePath("/");
  return { ok: true };
}

export async function actionRunEvalFroidCron() {
  await requireAuth();
  return runEvalFroidCron();
}

export async function actionTestEmail() {
  await requireAuth();
  const to = getResendTestRecipient();
  if (!to) {
    throw new Error(
      "Ajoutez MAIL_TEST_TO=mathispetitfr@gmail.com dans .env (email de votre compte Resend). Voir docs/EMAIL_SETUP.md"
    );
  }
  const run = await startRun(AutomationWorkflow.TEST_EMAIL);
  try {
    await sendMail({
      to,
      subject: "Test email — Qualiopi POC",
      html: "<p>Configuration email OK.</p>",
    });
    await finishRun(run.id, AutomationStatus.SUCCESS, `Envoyé à ${to}`);
    return { ok: true, to };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(run.id, AutomationStatus.FAILED, msg);
    throw e;
  }
}

export async function uploadProgramme(formationId: string, formData: FormData) {
  await requireAuth();
  const file = formData.get("file") as File | null;
  if (!file) throw new Error("Fichier manquant");
  const formation = await prisma.formation.findUnique({ where: { id: formationId } });
  if (!formation) throw new Error("Formation introuvable");

  const year = formation.dateDebut.getFullYear();
  const folderName = buildFormationFolderName(
    year,
    formation.nomClient,
    formation.intitule
  );
  const base =
    formation.storagePath ??
    (await ensureFormationStorage(folderName));
  const buf = Buffer.from(await file.arrayBuffer());
  const dest = subPath(base, "avant-la-formation", file.name);
  await writeFile(dest, buf);
  await prisma.formation.update({
    where: { id: formationId },
    data: { storagePath: base, programmePath: dest },
  });
  revalidatePath(`/formations/${formationId}`);
}
