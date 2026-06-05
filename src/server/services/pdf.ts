import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import mammoth from "mammoth";
import type { Browser } from "puppeteer";
import { getTemplatesRoot } from "@/lib/config";

export type TemplateKey =
  | "convention"
  | "emargement"
  | "attestation"
  | "certificat"
  | "preuve-avant-stagiaire"
  | "preuve-avant-entreprise"
  | "preuve-eval-chaud"
  | "preuve-eval-entreprise"
  | "preuve-eval-froid"
  | "besoins-stagiaire"
  | "besoins-entreprise"
  | "eval-chaud"
  | "eval-entreprise"
  | "eval-froid";

const TEMPLATE_KEYWORDS: Record<TemplateKey, string[]> = {
  convention: ["convention de formation", "convention"],
  emargement: ["émargement", "emargement"],
  attestation: ["attestation de presence", "attestation de présence", "attestation"],
  certificat: ["certificat de réalisation", "certificat de realisation", "certificat"],
  "preuve-avant-stagiaire": ["preuve", "avant formation"],
  "preuve-avant-entreprise": ["preuve", "avant formation"],
  "preuve-eval-chaud": ["évaluation à chaud", "evaluation a chaud", "preuve"],
  "preuve-eval-entreprise": ["satisfaction entreprise", "preuve"],
  "preuve-eval-froid": ["à froid", "a froid", "preuve"],
  "besoins-stagiaire": ["besoin stagiaire", "eval besoin stagiaire"],
  "besoins-entreprise": ["besoin l_entreprise", "besoin entreprise"],
  "eval-chaud": ["à chaud stagiaire", "a chaud stagiaire"],
  "eval-entreprise": ["satisfaction entreprise"],
  "eval-froid": ["a froid stagiaire", "à froid stagiaire", "grille"],
};

const TEMPLATE_SUBDIR: Record<TemplateKey, string> = {
  convention: "avant-la-formation",
  emargement: "pendant-la-formation",
  attestation: "pendant-la-formation",
  certificat: "post-formation",
  "preuve-avant-stagiaire": "avant-la-formation",
  "preuve-avant-entreprise": "avant-la-formation",
  "preuve-eval-chaud": "post-formation",
  "preuve-eval-entreprise": "post-formation",
  "preuve-eval-froid": "post-formation",
  "besoins-stagiaire": "avant-la-formation",
  "besoins-entreprise": "avant-la-formation",
  "eval-chaud": "post-formation",
  "eval-entreprise": "post-formation",
  "eval-froid": "post-formation",
};

let browserInstance: Browser | null = null;

function isPdfBuffer(buf: Buffer): boolean {
  return buf.length > 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-";
}

async function isFile(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "'");
}

/** Doublons Drive/Windows « fichier(1).docx » — souvent des tags Word incorrects. */
function isDriveDuplicateCopy(filename: string): boolean {
  return /\(\d+\)\.docx$/i.test(filename);
}

function pickTemplateFile(
  docxFiles: string[],
  predicate: (normalizedName: string) => boolean
): string | undefined {
  const matches = docxFiles.filter((name) => predicate(normalize(name)));
  if (matches.length === 0) return undefined;
  const canonical = matches.filter((n) => !isDriveDuplicateCopy(n));
  const pool = canonical.length > 0 ? canonical : matches;
  pool.sort((a, b) => a.localeCompare(b, "fr"));
  return pool[0];
}

/** Modèle avec boucle {{#SEANCES}} (tableau dates / horaires). */
async function pickEmargementTemplate(
  subdir: string,
  docxFiles: string[]
): Promise<string | undefined> {
  const keywords = TEMPLATE_KEYWORDS.emargement.map(normalize);
  const matches = docxFiles.filter(
    (name) =>
      keywords.some((kw) => normalize(name).includes(kw)) &&
      !isDriveDuplicateCopy(name)
  );
  for (const name of matches) {
    const content = await fs.readFile(path.join(subdir, name));
    const zip = new PizZip(content);
    const xml = zip.file("word/document.xml")?.asText() ?? "";
    if (/#SEANCES/i.test(xml)) return name;
  }
  return pickTemplateFile(docxFiles, (n) => keywords.some((kw) => n.includes(kw)));
}

/** Modèle avec boucle {{#OBJECTIFS}} (nombre d'objectifs dynamique). */
async function pickEvalFroidTemplate(
  subdir: string,
  docxFiles: string[]
): Promise<string | undefined> {
  const keywords = TEMPLATE_KEYWORDS["eval-froid"].map(normalize);
  const matches = docxFiles.filter(
    (name) =>
      keywords.some((kw) => normalize(name).includes(kw)) &&
      !isDriveDuplicateCopy(name)
  );
  const pool = matches.length > 0 ? matches : docxFiles.filter((n) => !isDriveDuplicateCopy(n));

  for (const name of pool) {
    if (!normalize(name).includes("froid")) continue;
    const content = await fs.readFile(path.join(subdir, name));
    const zip = new PizZip(content);
    const xml = zip.file("word/document.xml")?.asText() ?? "";
    if (/#OBJECTIFS/i.test(xml)) return name;
  }

  for (const name of pool) {
    if (!normalize(name).includes("froid")) continue;
    const content = await fs.readFile(path.join(subdir, name));
    const zip = new PizZip(content);
    const xml = zip.file("word/document.xml")?.asText() ?? "";
    if (/ACQUIS_1/i.test(xml)) return name;
  }

  return undefined;
}

async function resolveTemplatePath(key: TemplateKey): Promise<string> {
  const root = getTemplatesRoot();
  const subdir = path.join(root, TEMPLATE_SUBDIR[key]);
  const keywords = TEMPLATE_KEYWORDS[key].map(normalize);

  const entries = await fs.readdir(subdir, { withFileTypes: true });
  const docxFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".docx"))
    .map((e) => e.name);

  if (key === "convention") {
    const modele = pickTemplateFile(
      docxFiles,
      (n) => n.includes("modele") && n.includes("convention")
    );
    if (modele) return path.join(subdir, modele);
  }

  if (key === "preuve-avant-stagiaire" || key === "preuve-avant-entreprise") {
    const preuve = pickTemplateFile(
      docxFiles,
      (n) => n.includes("preuve") && n.includes("avant")
    );
    if (preuve) return path.join(subdir, preuve);
  }

  if (key === "emargement") {
    const emargement = await pickEmargementTemplate(subdir, docxFiles);
    if (emargement) return path.join(subdir, emargement);
  }

  if (key === "eval-froid") {
    const evalFroid = await pickEvalFroidTemplate(subdir, docxFiles);
    if (evalFroid) return path.join(subdir, evalFroid);
  }

  const chosen = pickTemplateFile(docxFiles, (n) =>
    keywords.some((kw) => n.includes(kw))
  );
  if (chosen) {
    const full = path.join(subdir, chosen);
    if (await isFile(full)) return full;
  }

  throw new Error(
    `Template ${key} introuvable dans ${subdir}. Fichiers .docx : ${docxFiles.join(", ") || "(aucun)"}`
  );
}

function pocHighlightEnabled(): boolean {
  return process.env.POC_TEMPLATE_RED !== "false";
}

function normalizeForMatch(s: string) {
  return s
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectHighlightNeedles(data: Record<string, unknown>): string[] {
  const needles = new Set<string>();
  for (const v of Object.values(data)) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (trimmed.length < 2 || trimmed === "undefined") continue;
    needles.add(trimmed);
    trimmed.split("\n").forEach((line) => {
      const part = line.replace(/^•\s*/, "").trim();
      if (part.length > 1) needles.add(part);
    });
    const oneLine = trimmed.replace(/\n/g, " ");
    if (oneLine.length > 1) needles.add(oneLine);
  }
  return [...needles].sort((a, b) => b.length - a.length);
}

function addRedToRunXml(runXml: string): string {
  if (runXml.includes('w:val="FF0000"') || runXml.includes('w:val="ff0000"')) {
    return runXml;
  }
  if (runXml.includes("<w:rPr")) {
    return runXml.replace(
      /<w:rPr([^>]*)>/,
      '<w:rPr$1><w:color w:val="FF0000"/>'
    );
  }
  return runXml.replace(/(<w:r[^>]*>)/, "$1<w:rPr><w:color w:val=\"FF0000\"/></w:rPr>");
}

function runContainsNeedle(runXml: string, needles: string[]): boolean {
  const texts = [...runXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => normalizeForMatch(m[1]))
    .join(" ");
  if (!texts) return false;
  return needles.some((n) => {
    const needle = normalizeForMatch(n);
    return needle.length > 1 && texts.includes(needle);
  });
}

/** Met en rouge les valeurs injectées (POC) dans le DOCX avant conversion PDF. */
function highlightInjectedValues(
  docxBuffer: Buffer,
  needles: string[]
): Buffer {
  const zip = new PizZip(docxBuffer);
  if (needles.length === 0) return docxBuffer;

  const targets = [
    "word/document.xml",
    "word/header1.xml",
    "word/header2.xml",
    "word/footer1.xml",
    "word/footer2.xml",
  ];

  for (const filePath of targets) {
    const file = zip.file(filePath);
    if (!file) continue;
    let xml = file.asText();
    xml = xml.replace(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, (runXml) =>
      runContainsNeedle(runXml, needles) ? addRedToRunXml(runXml) : runXml
    );
    zip.file(filePath, xml);
  }
  return zip.generate({ type: "nodebuffer" });
}

function collectHighlightValues(data: Record<string, unknown>): string[] {
  return collectHighlightNeedles(data);
}

export async function renderDocx(
  templateKey: TemplateKey,
  data: Record<string, unknown>
): Promise<Buffer> {
  const templatePath = await resolveTemplatePath(templateKey);
  const content = await fs.readFile(templatePath);
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: "{{", end: "}}" },
    nullGetter: () => "",
  });
  doc.render(data);
  let out = doc.getZip().generate({ type: "nodebuffer" });
  if (pocHighlightEnabled()) {
    out = highlightInjectedValues(out, collectHighlightValues(data));
  }
  return out;
}

/** Convertit un fichier .docx statique (sans merge) en PDF. */
export async function convertStaticDocxToPdf(docxPath: string): Promise<Buffer> {
  const content = await fs.readFile(docxPath);
  return convertDocxToPdf(content);
}

function getGotenbergUrl(): string {
  return process.env.GOTENBERG_URL ?? "http://localhost:3001";
}

/** LibreOffice dans Docker via Gotenberg (aucun sudo sur la machine hôte). */
async function convertWithGotenberg(docxBuffer: Buffer): Promise<Buffer> {
  const baseUrl = getGotenbergUrl().replace(/\/$/, "");
  const form = new FormData();
  form.append(
    "files",
    new Blob([new Uint8Array(docxBuffer)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    "document.docx"
  );

  const res = await fetch(`${baseUrl}/forms/libreoffice/convert`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Gotenberg HTTP ${res.status}${text ? ` — ${text.slice(0, 200)}` : ""}`);
  }

  const pdf = Buffer.from(await res.arrayBuffer());
  if (!isPdfBuffer(pdf)) throw new Error("Gotenberg : réponse non PDF");
  return pdf;
}

async function convertWithLibreOfficeLocal(docxBuffer: Buffer): Promise<Buffer> {
  const libre = await import("libreoffice-convert");
  const convert = libre.convert as (
    buf: Buffer,
    ext: string,
    filter: undefined,
    cb: (err: Error | null, done: Buffer) => void
  ) => void;
  return await new Promise<Buffer>((resolve, reject) => {
    convert(docxBuffer, ".pdf", undefined, (err, done) => {
      if (err) reject(err);
      else resolve(done);
    });
  });
}

async function getBrowser(): Promise<Browser> {
  if (browserInstance?.connected) return browserInstance;
  const puppeteer = await import("puppeteer");
  browserInstance = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  return browserInstance;
}

async function convertWithPuppeteer(docxBuffer: Buffer): Promise<Buffer> {
  const { value: html } = await mammoth.convertToHtml({ buffer: docxBuffer });
  const wrapped = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.4; margin: 24px; color: #111; }
  table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  td, th { border: 1px solid #ccc; padding: 6px; vertical-align: top; }
  p { margin: 0 0 8px; }
</style></head><body>${html}</body></html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(wrapped, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer> {
  const errors: string[] = [];

  try {
    const viaDocker = await convertWithGotenberg(docxBuffer);
    if (isPdfBuffer(viaDocker)) return viaDocker;
    errors.push("Gotenberg (Docker) : sortie invalide");
  } catch (e) {
    errors.push(`Gotenberg (Docker) : ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const viaLibre = await convertWithLibreOfficeLocal(docxBuffer);
    if (isPdfBuffer(viaLibre)) return viaLibre;
    errors.push("LibreOffice local : sortie invalide");
  } catch (e) {
    errors.push(`LibreOffice local : ${e instanceof Error ? e.message : String(e)}`);
  }

  try {
    const viaPuppeteer = await convertWithPuppeteer(docxBuffer);
    if (isPdfBuffer(viaPuppeteer)) return viaPuppeteer;
    errors.push("Puppeteer : sortie invalide");
  } catch (e) {
    errors.push(`Puppeteer : ${e instanceof Error ? e.message : String(e)}`);
  }

  throw new Error(
    `Impossible de produire un PDF lisible. ${errors.join(" | ")}. ` +
      `Lancez : docker compose up -d gotenberg (voir docs/PDF_SETUP.md).`
  );
}

export type GeneratedDocument = {
  /** Toujours un PDF valide */
  buffer: Buffer;
  extension: "pdf";
};

export async function generatePdf(
  templateKey: TemplateKey,
  data: Record<string, unknown>
): Promise<GeneratedDocument> {
  const docx = await renderDocx(templateKey, data);
  const pdf = await convertDocxToPdf(docx);
  return { buffer: pdf, extension: "pdf" };
}
