import Link from "next/link";
import type {
  SignatureDocumentType,
  SignatureRequest,
  SignatureRequestStatus,
  Stagiaire,
} from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pdfPathToRel } from "@/lib/form-submission-status";
import { isDocusealEnabled } from "@/server/services/docuseal";

const DOC_LABELS: Record<SignatureDocumentType, string> = {
  CONVENTION: "Convention de formation",
  REGLEMENT_INTERIEUR: "Règlement intérieur",
};

function statusBadge(status: SignatureRequestStatus, signed: boolean) {
  if (signed || status === "COMPLETED") {
    return <Badge variant="success">Signé</Badge>;
  }
  if (status === "DECLINED") {
    return <Badge variant="danger">Refusé</Badge>;
  }
  if (status === "EXPIRED") {
    return <Badge variant="outline">Expiré</Badge>;
  }
  return <Badge variant="outline">En attente</Badge>;
}

type Props = {
  formationId: string;
  storagePath: string | null;
  conventionSigned: boolean;
  conventionSignedAt: Date | null;
  stagiaires: Pick<Stagiaire, "id" | "prenom" | "nom" | "riSigned" | "riSignedAt">[];
  signatureRequests: SignatureRequest[];
};

export function FormationSignatureStatus({
  formationId,
  storagePath,
  conventionSigned,
  conventionSignedAt,
  stagiaires,
  signatureRequests,
}: Props) {
  const enabled = isDocusealEnabled();
  const conventionReq = signatureRequests.find(
    (r) => r.documentType === "CONVENTION"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signatures électroniques</CardTitle>
        <p className="text-xs text-muted-foreground">
          {enabled
            ? "DocuSeal envoie les demandes de signature après le lancement."
            : "DocuSeal désactivé — configurez DOCUSEAL_ENABLED et DOCUSEAL_API_KEY."}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {DOC_LABELS.CONVENTION}
            </span>
            {statusBadge(
              conventionReq?.status ?? "PENDING",
              conventionSigned
            )}
          </div>
          {conventionSignedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Signé le {conventionSignedAt.toLocaleString("fr-FR")}
            </p>
          )}
          {conventionReq?.signUrl && !conventionSigned && (
            <a
              href={conventionReq.signUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block text-xs text-primary hover:underline"
            >
              Lien de signature entreprise
            </a>
          )}
          {conventionReq?.signedPdfPath && (
            <PdfLink
              formationId={formationId}
              storagePath={storagePath}
              pdfPath={conventionReq.signedPdfPath}
              label="PDF signé"
            />
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Règlement intérieur (stagiaires)</h3>
          {stagiaires.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun stagiaire.</p>
          ) : (
            <ul className="space-y-2">
              {stagiaires.map((s) => {
                const req = signatureRequests.find(
                  (r) =>
                    r.documentType === "REGLEMENT_INTERIEUR" &&
                    r.stagiaireId === s.id
                );
                return (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {s.prenom} {s.nom}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {statusBadge(req?.status ?? "PENDING", s.riSigned)}
                        {s.riSignedAt && (
                          <span className="text-xs text-muted-foreground">
                            {s.riSignedAt.toLocaleString("fr-FR")}
                          </span>
                        )}
                      </div>
                      {req?.signUrl && !s.riSigned && (
                        <a
                          href={req.signUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-xs text-primary hover:underline"
                        >
                          Lien de signature
                        </a>
                      )}
                      {req?.signedPdfPath && (
                        <PdfLink
                          formationId={formationId}
                          storagePath={storagePath}
                          pdfPath={req.signedPdfPath}
                          label="PDF signé"
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PdfLink({
  formationId,
  storagePath,
  pdfPath,
  label,
}: {
  formationId: string;
  storagePath: string | null;
  pdfPath: string;
  label: string;
}) {
  const rel = pdfPathToRel(storagePath, pdfPath);
  if (!rel) return null;
  return (
    <Link
      href={`/api/formations/${formationId}/file?rel=${encodeURIComponent(rel)}`}
      target="_blank"
      className="mt-1 block text-xs text-primary hover:underline"
    >
      {label}
    </Link>
  );
}
