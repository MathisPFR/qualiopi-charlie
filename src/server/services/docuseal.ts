/** Client API DocuSeal (self-host ou cloud). */

export type DocusealSubmitter = {
  id: number;
  email: string;
  slug?: string;
  embed_src?: string;
  status?: string;
};

export type DocusealSubmissionResponse = {
  id: number;
  name: string;
  status: string;
  submitters: DocusealSubmitter[];
};

function apiBase(): string {
  const root = (process.env.DOCUSEAL_URL ?? "http://localhost:3002").replace(/\/$/, "");
  return `${root}/api`;
}

export function isDocusealEnabled(): boolean {
  return (
    process.env.DOCUSEAL_ENABLED === "true" &&
    Boolean(process.env.DOCUSEAL_API_KEY?.trim())
  );
}

export async function docusealFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const key = process.env.DOCUSEAL_API_KEY?.trim();
  if (!key) throw new Error("DOCUSEAL_API_KEY manquant");

  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": key,
      ...init?.headers,
    },
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `DocuSeal HTTP ${res.status}${text ? ` — ${text.slice(0, 300)}` : ""}`
    );
  }

  return res.json() as Promise<T>;
}

/** Estime le nombre de pages d'un PDF (suffisant pour placer la signature). */
export function estimatePdfPageCount(pdf: Buffer): number {
  const text = pdf.toString("latin1");
  const matches = text.match(/\/Type\s*\/Page\b/g);
  return Math.max(1, matches?.length ?? 1);
}

export async function createPdfSignatureRequest(input: {
  name: string;
  pdf: Buffer;
  email: string;
  externalId: string;
  metadata?: Record<string, string>;
  sendEmail?: boolean;
}): Promise<DocusealSubmissionResponse> {
  const page = estimatePdfPageCount(input.pdf);
  const sendEmail =
    input.sendEmail ?? process.env.DOCUSEAL_SEND_EMAIL !== "false";

  return docusealFetch<DocusealSubmissionResponse>("/submissions/pdf", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      send_email: sendEmail,
      documents: [
        {
          name: input.name,
          file: input.pdf.toString("base64"),
          fields: [
            {
              name: "Signature",
              type: "signature",
              required: true,
              areas: [{ x: 72, y: 700, w: 220, h: 50, page }],
            },
            {
              name: "Date",
              type: "date",
              required: true,
              areas: [{ x: 320, y: 700, w: 120, h: 30, page }],
            },
          ],
        },
      ],
      submitters: [
        {
          role: "First Party",
          email: input.email,
          external_id: input.externalId,
          metadata: input.metadata,
        },
      ],
    }),
  });
}

export async function fetchSubmissionDocuments(submissionId: number): Promise<{
  documents: { name: string; url: string }[];
  combined_document_url?: string;
  audit_log_url?: string;
}> {
  return docusealFetch(`/submissions/${submissionId}/documents`);
}

export async function downloadSignedDocument(url: string): Promise<Buffer> {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) {
    throw new Error(`Téléchargement DocuSeal échoué (${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}
