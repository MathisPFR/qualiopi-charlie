import { NextResponse } from "next/server";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listFormationDrive } from "@/server/services/storage";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ formationId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { formationId } = await params;
  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
  });
  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  const extra: { relativePath: string; label: string }[] = [];
  if (formation.programmePath && formation.storagePath) {
    try {
      const rel = path
        .relative(formation.storagePath, formation.programmePath)
        .replace(/\\/g, "/");
      if (!rel.startsWith("..")) {
        extra.push({ relativePath: rel, label: path.basename(formation.programmePath) });
      }
    } catch {
      /* */
    }
  }

  if (!formation.storagePath) {
    return NextResponse.json({
      storageReady: false,
      tree: [],
      devisUploaded: !!formation.devisPath,
    });
  }

  const tree = await listFormationDrive(formation.storagePath, extra);

  return NextResponse.json({
    storageReady: true,
    storagePath: formation.storagePath,
    devisUploaded: !!formation.devisPath,
    tree,
  });
}
