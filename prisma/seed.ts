import { PrismaClient, Modalite } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@charlie.local";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash },
    create: { email, passwordHash: hash, name: "Admin" },
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
        modalite: Modalite.DISTANCIEL,
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

  console.log("Seed OK — admin:", email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
