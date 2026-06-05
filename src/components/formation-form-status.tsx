import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FormationFormStatus } from "@/lib/form-submission-status";
import { pdfPathToRel } from "@/lib/form-submission-status";
import { cn } from "@/lib/utils";

function formatRespondedAt(date: Date) {
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ responded }: { responded: boolean }) {
  return (
    <Badge variant={responded ? "success" : "outline"}>
      {responded ? "Répondu" : "En attente"}
    </Badge>
  );
}

function FormStatusCell({
  label,
  phase,
  responded,
  respondedAt,
  pdfHref,
}: {
  label: string;
  phase: string;
  responded: boolean;
  respondedAt: Date | null;
  pdfHref?: string | null;
}) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{label}</span>
        <StatusBadge responded={responded} />
      </div>
      <p className="text-xs text-muted-foreground">{phase}</p>
      {responded && respondedAt && (
        <p className="text-xs text-muted-foreground">
          Le {formatRespondedAt(respondedAt)}
        </p>
      )}
      {responded && pdfHref && (
        <Link
          href={pdfHref}
          target="_blank"
          className="text-xs text-primary hover:underline"
        >
          Voir le PDF
        </Link>
      )}
    </div>
  );
}

type FormationFormStatusProps = {
  status: FormationFormStatus;
  formationId: string;
  storagePath: string | null;
};

export function FormationFormStatus({
  status,
  formationId,
  storagePath,
}: FormationFormStatusProps) {
  const { summary, entreprise, stagiaires } = status;
  const allDone = summary.answered === summary.total && summary.total > 0;

  const fileUrl = (pdfPath: string | null) => {
    const rel = pdfPathToRel(storagePath, pdfPath);
    return rel
      ? `/api/formations/${formationId}/file?rel=${encodeURIComponent(rel)}`
      : null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Suivi des formulaires</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Réponses enregistrées par l&apos;entreprise et chaque stagiaire.
            </p>
          </div>
          <Badge variant={allDone ? "success" : "secondary"}>
            {summary.answered}/{summary.total} réponses
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <p className="font-medium">Entreprise</p>
            <p className="text-muted-foreground">
              {summary.entrepriseAnswered}/{summary.entrepriseTotal} formulaire
              {summary.entrepriseTotal > 1 ? "s" : ""}
            </p>
          </div>
          <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
            <p className="font-medium">Stagiaires</p>
            <p className="text-muted-foreground">
              {summary.stagiairesAnswered}/{summary.stagiairesTotal} réponses
              {stagiaires.length > 0
                ? ` (${stagiaires.length} stagiaire${stagiaires.length > 1 ? "s" : ""})`
                : ""}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Entreprise</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {entreprise.map((form) => (
              <div key={form.type} className="rounded-md border px-3 py-2">
                <FormStatusCell
                  label={form.label}
                  phase={form.phase}
                  responded={form.responded}
                  respondedAt={form.respondedAt}
                  pdfHref={fileUrl(form.pdfPath)}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold">Stagiaires</h3>
          {stagiaires.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun stagiaire.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Stagiaire</th>
                    {stagiaires[0]?.forms.map((form) => (
                      <th key={form.type} className="px-3 py-2 font-medium">
                        {form.label}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium">Progression</th>
                  </tr>
                </thead>
                <tbody>
                  {stagiaires.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-3 py-3 align-top font-medium">{row.name}</td>
                      {row.forms.map((form) => (
                        <td key={form.type} className="px-3 py-3 align-top">
                          <div className="space-y-1">
                            <StatusBadge responded={form.responded} />
                            {form.responded && form.respondedAt && (
                              <p className="text-xs text-muted-foreground">
                                {formatRespondedAt(form.respondedAt)}
                              </p>
                            )}
                            {form.responded && form.pdfPath && fileUrl(form.pdfPath) && (
                              <Link
                                href={fileUrl(form.pdfPath)!}
                                target="_blank"
                                className="block text-xs text-primary hover:underline"
                              >
                                PDF
                              </Link>
                            )}
                          </div>
                        </td>
                      ))}
                      <td className="px-3 py-3 align-top">
                        <span
                          className={cn(
                            "text-xs font-medium",
                            row.answeredCount === row.totalCount
                              ? "text-green-700"
                              : "text-muted-foreground"
                          )}
                        >
                          {row.answeredCount}/{row.totalCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
