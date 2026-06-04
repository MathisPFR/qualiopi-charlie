import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  resolvePathUnderBase,
  sanitizeRelativePath,
} from "@/server/services/file-security";

const MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ formationId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new NextResponse("Non authentifié", { status: 401 });
  }

  const { formationId } = await params;
  const rel = new URL(req.url).searchParams.get("rel");
  if (!rel) {
    return new NextResponse("Paramètre rel manquant", { status: 400 });
  }

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
  });
  if (!formation?.storagePath) {
    return new NextResponse("Dossier formation indisponible", { status: 404 });
  }

  let absolute: string;
  try {
    absolute = resolvePathUnderBase(formation.storagePath, rel);
  } catch {
    return new NextResponse("Chemin refusé", { status: 403 });
  }

  if (
    formation.devisPath &&
    sanitizeRelativePath(rel) ===
      path
        .relative(formation.storagePath, formation.devisPath)
        .replace(/\\/g, "/")
  ) {
    absolute = formation.devisPath;
  }

  try {
    const stat = await fs.stat(absolute);
    if (!stat.isFile()) {
      return new NextResponse("Fichier introuvable", { status: 404 });
    }
    const buf = await fs.readFile(absolute);
    const ext = path.extname(absolute).toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(buf, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(absolute)}"`,
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch {
    return new NextResponse("Fichier introuvable", { status: 404 });
  }
}
