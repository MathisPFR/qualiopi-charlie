import Link from "next/link";
import { listFormations } from "@/server/actions/formations";
import { FormationStatutBadge } from "@/components/formation-statut-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateFr } from "@/lib/utils";
import {
  buildFormationFormStatus,
  formatFormCompletionLabel,
} from "@/lib/form-submission-status";

export default async function HomePage() {
  const formations = await listFormations();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Formations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pilotez le parcours Qualiopi : lancement, émargements, clôture et
            preuves archivées.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/formations/new">Nouvelle formation</Link>
        </Button>
      </div>

      {formations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune formation pour le moment.</p>
            <Button asChild className="mt-4">
              <Link href="/formations/new">Créer une formation de démo</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {formations.map((f) => {
            const formStatus = buildFormationFormStatus(
              f.stagiaires,
              f.formSubmissions
            );
            const completionLabel = formatFormCompletionLabel(formStatus.summary);
            const allDone =
              formStatus.summary.total > 0 &&
              formStatus.summary.answered === formStatus.summary.total;

            return (
            <Card
              key={f.id}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                <CardTitle className="text-lg font-semibold leading-snug">
                  <Link
                    href={`/formations/${f.id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {f.intitule}
                  </Link>
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={allDone ? "success" : "outline"}>
                    Formulaires {completionLabel}
                  </Badge>
                  <FormationStatutBadge statut={f.statut} />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{f.intituleCommercial}</p>
                <p>
                  {f.nomClient} — {formatDateFr(f.dateDebut)} →{" "}
                  {formatDateFr(f.dateFin)}
                </p>
                <p className="text-xs">
                  {f._count.stagiaires} stagiaire
                  {f._count.stagiaires > 1 ? "s" : ""}
                  {" · "}
                  Entreprise {formStatus.summary.entrepriseAnswered}/
                  {formStatus.summary.entrepriseTotal}
                </p>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
