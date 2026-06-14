import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

function loadClientConfig() {
  const path = join(__dirname, "../config/client.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

async function main() {
  const clientConfig = loadClientConfig();
  const email = process.env.ADMIN_EMAIL ?? "admin@charlie.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: "ADMIN" },
    create: {
      email,
      passwordHash: hash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  await prisma.instanceSettings.upsert({
    where: { id: "singleton" },
    update: {
      orgName: clientConfig.orgName ?? null,
      orgEmail: clientConfig.orgEmail ?? null,
      formBaseUrl: clientConfig.formBaseUrl ?? null,
    },
    create: {
      id: "singleton",
      orgName: clientConfig.orgName ?? null,
      orgEmail: clientConfig.orgEmail ?? null,
      formBaseUrl: clientConfig.formBaseUrl ?? null,
    },
  });

  const existing = await prisma.formation.findFirst({
    where: { slug: "strategie-commerciale" },
  });
  if (!existing) {
    const entreprise = await prisma.entreprise.create({
      data: {
        raisonSociale: "Agence Charlie",
        email: "contact@charlie-uniquecontent.fr",
        adresse: "10 rue boissons",
        codePostal: "63800",
        ville: "Chamalières",
      },
    });
    const formateur = await prisma.formateur.create({
      data: { nom: "Anne Hélène Joulaud" },
    });
    await prisma.formation.create({
      data: {
        slug: "strategie-commerciale",
        intitule: "Formation - Formation Test",
        intituleCommercial: "Stratégie commerciale",
        nomClient: "Agence Charlie",
        dateDebut: new Date("2026-06-07"),
        dateFin: new Date("2026-06-14"),
        modalite: "DISTANCIEL",
        dureeHeures: 30,
        tarifTotalHt: 10000,
        tarifParPersonne: 1000,
        codeFormation: "222",
        entrepriseId: entreprise.id,
        formateurId: formateur.id,
        stagiaires: {
          create: {
            prenom: "Mathis",
            nom: "Petit",
            email: "mathispetitfr@gmail.com",
            telephone: "09797979797",
            fonction: "DEV",
          },
        },
        seances: {
          create: [
            {
              nom: "Séance standard",
              date: new Date("2026-06-07"),
              heureDebut: "9H",
              heureFin: "12H",
            },
            {
              nom: "Séance standard (2)",
              date: new Date("2026-06-08"),
              heureDebut: "9H",
              heureFin: "13H",
            },
          ],
        },
        objectifs: {
          create: [
            { libelle: "Objectif 1 de la formation test" },
            { libelle: "Objectif 2" },
          ],
        },
      },
    });
  }

  const slugDemo = "management-equipe-commerciale";
  const existingDemo = await prisma.formation.findFirst({
    where: { slug: slugDemo },
  });
  if (!existingDemo) {
    let entrepriseCharlie = await prisma.entreprise.findFirst({
      where: { email: "contact@charlie-uniquecontent.fr" },
    });
    if (!entrepriseCharlie) {
      entrepriseCharlie = await prisma.entreprise.create({
        data: {
          raisonSociale: "Agence Charlie",
          email: "contact@charlie-uniquecontent.fr",
          adresse: "10 rue Boissons",
          codePostal: "63800",
          ville: "Chamalières",
          contactNom: "Anne Hélène Joulaud",
        },
      });
    }

    let formateur = await prisma.formateur.findFirst({
      where: { nom: "Anne Hélène Joulaud" },
    });
    if (!formateur) {
      formateur = await prisma.formateur.create({
        data: { nom: "Anne Hélène Joulaud", email: "annehelenecom@gmail.com" },
      });
    }

    const seanceDays = [
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
      "2026-09-18",
      "2026-09-19",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
    ];

    await prisma.formation.create({
      data: {
        slug: slugDemo,
        intitule: "Formation - Management équipe commerciale",
        intituleCommercial: "Management d'équipe et négociation B2B",
        nomClient: "Agence Charlie",
        dateDebut: new Date("2026-09-15"),
        dateFin: new Date("2026-09-26"),
        lieu: "Formation réalisée à distance, en visioconférence via Microsoft Teams.",
        modalite: "DISTANCIEL",
        dureeHeures: 35,
        tarifTotalHt: 8400,
        tarifParPersonne: 4200,
        codeFormation: "CFI-MEC-2026-01",
        statut: "BROUILLON",
        entrepriseId: entrepriseCharlie.id,
        formateurId: formateur.id,
        stagiaires: {
          create: [
            {
              prenom: "Mathis",
              nom: "Petit",
              email: "mathispetitfr@gmail.com",
              telephone: "06 12 34 56 78",
              fonction: "Commercial terrain",
            },
            {
              prenom: "Inès",
              nom: "Zaouk",
              email: "izauk970@gmail.com",
              telephone: "06 98 76 54 32",
              fonction: "Responsable grands comptes",
            },
          ],
        },
        seances: {
          create: seanceDays.map((day, i) => ({
            nom: `Module ${i + 1} — ${["Diagnostic", "Leadership", "Négociation", "Pipeline", "Closing", "Coaching", "Objections", "Grands comptes", "Plan d'action", "Bilan"][i]}`,
            date: new Date(day),
            heureDebut: "09:00",
            heureFin: "12:30",
            includeInEmargement: true,
          })),
        },
        objectifs: {
          create: [
            {
              libelle:
                "Piloter une équipe commerciale avec des indicateurs de performance clairs",
            },
            {
              libelle:
                "Structurer un entretien de vente B2B et traiter les objections courantes",
            },
            {
              libelle:
                "Construire un plan d'actions individuel et collectif à 90 jours",
            },
          ],
        },
      },
    });
    console.log("Formation démo créée — slug:", slugDemo);
  }

  console.log("Seed OK — admin:", email, "(ADMIN), InstanceSettings singleton");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
