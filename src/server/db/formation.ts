import { prisma } from "@/lib/prisma";
import type { FormationFull } from "@/server/services/formation-data";

export async function getFormationFull(id: string): Promise<FormationFull | null> {
  return prisma.formation.findUnique({
    where: { id },
    include: {
      entreprise: true,
      formateur: true,
      seances: { orderBy: { date: "asc" } },
      objectifs: true,
      stagiaires: true,
    },
  });
}

export async function getFormationBySlug(slug: string): Promise<FormationFull | null> {
  return prisma.formation.findUnique({
    where: { slug },
    include: {
      entreprise: true,
      formateur: true,
      seances: { orderBy: { date: "asc" } },
      objectifs: true,
      stagiaires: true,
    },
  });
}
