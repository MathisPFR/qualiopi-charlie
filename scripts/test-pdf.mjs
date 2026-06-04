import fs from "fs/promises";
import path from "path";

const gotenbergUrl = (process.env.GOTENBERG_URL ?? "http://localhost:3001").replace(
  /\/$/,
  ""
);
const template = path.join(
  process.cwd(),
  "templates/avant-la-formation/MODELE – Convention de formation.docx"
);
const docx = await fs.readFile(template);

const health = await fetch(`${gotenbergUrl}/health`).catch(() => null);
if (!health?.ok) {
  console.error(`Gotenberg injoignable sur ${gotenbergUrl}`);
  console.error("→ docker compose up -d gotenberg");
  process.exit(1);
}

const form = new FormData();
form.append(
  "files",
  new Blob([docx], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }),
  "document.docx"
);

const res = await fetch(`${gotenbergUrl}/forms/libreoffice/convert`, {
  method: "POST",
  body: form,
});
if (!res.ok) {
  console.error("Conversion échouée:", res.status, await res.text());
  process.exit(1);
}

const pdf = Buffer.from(await res.arrayBuffer());
if (pdf.subarray(0, 5).toString() !== "%PDF-") {
  console.error("Réponse non PDF");
  process.exit(1);
}
console.log(`PDF OK via Gotenberg (Docker) — ${pdf.length} octets`);
