/**
 * Regénère le modèle Word « évaluation à froid » avec boucle {{#OBJECTIFS}}.
 * Usage : node scripts/build-eval-froid-template.mjs
 */
import fs from "fs/promises";
import path from "path";
import PizZip from "pizzip";

const root = path.join(process.cwd(), "templates/post-formation");
const source = path.join(root, "GRILLE D_ÉVALUATION « A FROID » 2026.docx");
const target = path.join(
  root,
  "GRILLE D'ÉVALUATION À FROID STAGIAIRE.docx"
);

function wParagraph(text, { bold = false, underline = false, red = false } = {}) {
  const rPrParts = [];
  if (bold) rPrParts.push("<w:b w:val=\"1\"/><w:bCs w:val=\"1\"/>");
  if (underline) rPrParts.push("<w:u w:val=\"single\"/>");
  if (red) rPrParts.push("<w:color w:val=\"ff0000\"/>");
  rPrParts.push("<w:sz w:val=\"26\"/><w:szCs w:val=\"26\"/><w:rtl w:val=\"0\"/>");
  const rPr = `<w:rPr>${rPrParts.join("")}</w:rPr>`;
  return `<w:p w:rsidR="00000000" w:rsidDel="00000000" w:rsidP="00000000" w:rsidRDefault="00000000" w:rsidRPr="00000000"><w:pPr><w:spacing w:line="256.7994545454545" w:lineRule="auto"/><w:jc w:val="both"/><w:rPr><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr></w:pPr><w:r w:rsidDel="00000000" w:rsidR="00000000" w:rsidRPr="00000000">${rPr}<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`;
}

function buildObjectifsLoopXml() {
  return [
    wParagraph("{{#OBJECTIFS}}"),
    wParagraph("Objectif {{num}} — {{libelle}}", { bold: true, underline: true }),
    wParagraph("Degré d'acquisition en situation de travail : {{acquis}}", {
      red: true,
    }),
    wParagraph("Commentaires : {{commentaire}}"),
    wParagraph(" "),
    wParagraph("{{/OBJECTIFS}}"),
  ].join("");
}

function patchDocumentXml(xml) {
  let out = xml;

  out = out.replace(
    /Organisme de formation : Agence CHARLIE/g,
    "Organisme de formation : {{ORG_NAME}}"
  );
  out = out.replace(
    /Formateur : Anne-Hélène JOULAUD/g,
    "Formateur : {{FORMATEUR}}"
  );

  out = out.replace(
    "OBJECTIFS (ETRE CAPABLE DE..)",
    "OBJECTIFS PÉDAGOGIQUES — MISE EN ŒUVRE EN SITUATION DE TRAVAIL"
  );

  const legend =
    "Échelle d'évaluation : 1 — Pas acquis · 2 — Partiellement acquis · 3 — Acquis · 4 — Totalement acquis";
  out = out.replace(
    "Il s’agit d’évaluer en différé « à froid » la mise en oeuvre en situation de travail des compétences acquises, au moins trois mois après la formation.",
    "Il s’agit d’évaluer en différé « à froid » la mise en oeuvre en situation de travail des compétences acquises, au moins trois mois après la formation."
  );

  const loopStart = out.indexOf("OBJECTIF 1 :");
  const loopEnd = out.indexOf("En pratique dans votre travail");
  if (loopStart === -1 || loopEnd === -1) {
    throw new Error("Section objectifs introuvable dans le modèle source");
  }
  const startPara = out.lastIndexOf("<w:p ", loopStart);
  const endPara = out.lastIndexOf("<w:p ", loopEnd);
  if (startPara === -1 || endPara === -1) {
    throw new Error("Paragraphes objectifs introuvables dans le modèle source");
  }
  out =
    out.slice(0, startPara) +
    wParagraph(legend) +
    buildObjectifsLoopXml() +
    out.slice(endPara);

  return out;
}

const buf = await fs.readFile(source);
const zip = new PizZip(buf);
const doc = zip.file("word/document.xml");
if (!doc) throw new Error("word/document.xml introuvable");
zip.file("word/document.xml", patchDocumentXml(doc.asText()));
await fs.writeFile(target, zip.generate({ type: "nodebuffer" }));
console.log("Modèle généré :", target);
