import path from "path";

const MAX_DEVIS_BYTES = 15 * 1024 * 1024;

export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

export function assertPdfUpload(file: File, buf: Buffer): void {
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Seuls les fichiers PDF sont acceptés pour le devis.");
  }
  if (file.type && file.type !== "application/pdf") {
    throw new Error("Type MIME invalide. Envoyez un PDF.");
  }
  if (buf.length > MAX_DEVIS_BYTES) {
    throw new Error("Le devis dépasse la taille maximale (15 Mo).");
  }
  if (!isPdfBuffer(buf)) {
    throw new Error("Le fichier n'est pas un PDF valide.");
  }
}

export function sanitizeRelativePath(relative: string): string {
  const normalized = relative.replace(/\\/g, "/").replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) {
    throw new Error("Chemin de fichier invalide.");
  }
  return normalized;
}

export function resolvePathUnderBase(basePath: string, relative: string): string {
  const safe = sanitizeRelativePath(relative);
  const base = path.resolve(basePath);
  const resolved = path.resolve(base, safe);
  if (resolved !== base && !resolved.startsWith(base + path.sep)) {
    throw new Error("Accès au fichier refusé.");
  }
  return resolved;
}
