import fs from "fs/promises";
import path from "path";
import { AutomationStatus, AutomationWorkflow } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { startRun, finishRun } from "@/server/services/audit";
import { getFormationFull } from "@/server/db/formation";
import { buildEmargementData } from "@/server/services/formation-data";
import { generatePdf } from "@/server/services/pdf";
import { subPath, writeFile } from "@/server/services/storage";

async function removeExistingEmargementPdfs(storagePath: string) {
  const dir = path.join(storagePath, "pendant-la-formation");
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return;
  }
  await Promise.all(
    files
      .filter((f) => /^Emargement-/i.test(f) && f.toLowerCase().endsWith(".pdf"))
      .map((f) => fs.unlink(path.join(dir, f)).catch(() => undefined))
  );
}

export async function generateEmargements(
  formationId: string,
  options?: { force?: boolean }
) {
  const formation = await getFormationFull(formationId);
  if (!formation?.storagePath) {
    throw new Error("Dossier formation manquant — lancez d'abord l'automatisation");
  }
  if (formation.emargementsGenerated && !options?.force) {
    return { skipped: true };
  }
  if (formation.stagiaires.length === 0) {
    throw new Error("Aucun stagiaire inscrit — impossible de générer les émargements.");
  }

  const run = await startRun(AutomationWorkflow.EMARGEMENTS, formationId);
  try {
    const base = formation.storagePath;
    if (options?.force) {
      await removeExistingEmargementPdfs(base);
    }
    for (const stagiaire of formation.stagiaires) {
      const data = buildEmargementData(formation, stagiaire);
      const doc = await generatePdf("emargement", data);
      const filename = `Emargement-${formation.intitule}-${stagiaire.nom}.${doc.extension}`;
      await writeFile(subPath(base, "pendant-la-formation", filename), doc.buffer);
    }
    await prisma.formation.update({
      where: { id: formationId },
      data: { emargementsGenerated: true },
    });
    await finishRun(run.id, AutomationStatus.SUCCESS);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await finishRun(run.id, AutomationStatus.FAILED, msg);
    throw e;
  }
}

/** Régénère les feuilles d'émargement (écrase les PDF existants). */
export async function regenerateEmargements(formationId: string) {
  return generateEmargements(formationId, { force: true });
}
