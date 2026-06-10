import path from "path";

const MAX_DEVIS_BYTES = 15 * 1024 * 1024;

/** Fichier issu d'un FormData (navigateur ou Node/undici — pas de global `File` côté serveur). */
export type FormDataUpload = {
  name: string;
  type?: string;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export function getFormDataFile(
  formData: FormData,
  field = "file"
): FormDataUpload | null {
  const value = formData.get(field);
  if (!value || typeof value !== "object") return null;
  if (
    !("arrayBuffer" in value) ||
    typeof value.arrayBuffer !== "function" ||
    !("name" in value) ||
    typeof value.name !== "string"
  ) {
    return null;
  }
  return value as FormDataUpload;
}

export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

export function assertPdfUpload(file: FormDataUpload, buf: Buffer): void {
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
