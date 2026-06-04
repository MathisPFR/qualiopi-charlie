import fs from "fs/promises";
import path from "path";
import { getStorageRoot } from "@/lib/config";

export const FORMATION_SUBDIRS = [
  "avant-la-formation",
  "pendant-la-formation",
  "apres-la-formation",
  "preuves-qualiopi",
] as const;

export type FormationSubdir = (typeof FORMATION_SUBDIRS)[number];

export function buildFormationFolderName(
  year: number,
  nomClient: string,
  intitule: string
): string {
  const safe = (s: string) =>
    s.replace(/[/\\?%*:|"<>]/g, "-").trim().slice(0, 80);
  return `${year} - ${safe(nomClient)} - ${safe(intitule)}`;
}

export async function ensureFormationStorage(
  folderName: string
): Promise<string> {
  const root = getStorageRoot();
  const base = path.join(root, folderName);
  await fs.mkdir(base, { recursive: true });
  for (const sub of FORMATION_SUBDIRS) {
    await fs.mkdir(path.join(base, sub), { recursive: true });
  }
  return base;
}

export function subPath(base: string, sub: FormationSubdir, filename: string) {
  return path.join(base, sub, filename);
}

export async function writeFile(filePath: string, content: Buffer) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

export async function copyFile(src: string, dest: string) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.copyFile(src, dest);
}

export async function readFileIfExists(filePath: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

export async function removeFormationStorage(basePath: string): Promise<void> {
  try {
    await fs.rm(basePath, { recursive: true, force: true });
  } catch {
    /* dossier déjà absent */
  }
}

export type DriveNode = {
  name: string;
  relativePath: string;
  kind: "folder" | "file";
  children?: DriveNode[];
};

const DRIVE_FOLDERS: { key: FormationSubdir; label: string }[] = [
  { key: "avant-la-formation", label: "Avant la formation" },
  { key: "pendant-la-formation", label: "Pendant la formation" },
  { key: "apres-la-formation", label: "Après la formation" },
  { key: "preuves-qualiopi", label: "Preuves Qualiopi" },
];

export async function listFormationDrive(
  basePath: string,
  extraFiles: { relativePath: string; label: string }[] = []
): Promise<DriveNode[]> {
  const nodes: DriveNode[] = [];

  for (const { key, label } of DRIVE_FOLDERS) {
    const dir = path.join(basePath, key);
    const children: DriveNode[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!e.isFile()) continue;
        if (e.name.toLowerCase().endsWith(".docx")) continue;
        children.push({
          name: e.name,
          relativePath: path.join(key, e.name).replace(/\\/g, "/"),
          kind: "file",
        });
      }
    } catch {
      /* dossier vide */
    }
    nodes.push({
      name: label,
      relativePath: key,
      kind: "folder",
      children,
    });
  }

  if (extraFiles.length > 0) {
    nodes.unshift({
      name: "Documents importés",
      relativePath: "_imports",
      kind: "folder",
      children: extraFiles.map((f) => ({
        name: f.label,
        relativePath: f.relativePath,
        kind: "file" as const,
      })),
    });
  }

  return nodes;
}

export async function listFormationFiles(basePath: string): Promise<string[]> {
  const results: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else results.push(full);
    }
  }
  try {
    await walk(basePath);
  } catch {
    /* empty */
  }
  return results;
}
