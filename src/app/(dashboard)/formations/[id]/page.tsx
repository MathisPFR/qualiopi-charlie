import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormation } from "@/server/actions/formations";
import { FormationActions } from "@/components/formation-actions";
import { FormationTestTools } from "@/components/formation-test-tools";
import { FormationWorkflowSteps } from "@/components/formation-workflow-steps";
import { FormationStatutBadge } from "@/components/formation-statut-badge";
import { DevisUpload } from "@/components/devis-upload";
import { FormationDrive } from "@/components/formation-drive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateFr } from "@/lib/utils";
import { getClientConfig } from "@/lib/config";
import {
  AUTOMATION_WORKFLOW_LABELS,
  STATUT_LABELS,
} from "@/lib/formation-ui";
import { FormationStatut, Modalite } from "@prisma/client";

export default async function FormationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formation = await getFormation(id);
  if (!formation) notFound();

  const config = getClientConfig();
  const baseUrl = config.formBaseUrl;
  const formLinks = [
    {
      label: "Besoins stagiaire",
      href: `${baseUrl}/f/${formation.slug}/besoins-stagiaire`,
    },
    {
      label: "Besoins entreprise",
      href: `${baseUrl}/f/${formation.slug}/besoins-entreprise`,
    },
    { label: "Éval à chaud", href: `${baseUrl}/f/${formation.slug}/eval-chaud` },
    {
      label: "Éval entreprise",
      href: `${baseUrl}/f/${formation.slug}/eval-entreprise`,
    },
    { label: "Éval à froid", href: `${baseUrl}/f/${formation.slug}/eval-froid` },
  ];

  const canLaunch =
    formation.statut === FormationStatut.BROUILLON ||
    !formation.conventionGenerated;
  const hasDevis = !!formation.devisPath;
  const livretActif =
    formation.modalite === Modalite.PRESENTIEL ||
    formation.modalite === Modalite.MIXTE;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/"
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Retour aux formations
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {formation.intitule}
              </h1>
              <FormationStatutBadge statut={formation.statut} />
            </div>
            <p className="text-muted-foreground">{formation.intituleCommercial}</p>
            <p className="text-sm text-muted-foreground">
              {formation.nomClient} — {formatDateFr(formation.dateDebut)} →{" "}
              {formatDateFr(formation.dateFin)} — {formation.modalite} —{" "}
              {formation.dureeHeures} h
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0">
            <Link href={`/formations/${formation.id}/edit`}>Modifier</Link>
          </Button>
        </div>
      </div>

      <FormationWorkflowSteps statut={formation.statut} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <DevisUpload
            formationId={formation.id}
            hasDevis={hasDevis}
            devisUploadedAt={formation.devisUploadedAt}
          />
          <FormationActions
            formationId={formation.id}
            statut={formation.statut}
            canLaunch={canLaunch}
            hasDevis={hasDevis}
            canRegenerateEmargements={!!formation.storagePath}
          />
          <FormationTestTools formationId={formation.id} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formulaires publics</CardTitle>
              <p className="text-xs text-muted-foreground">
                Liens envoyés par email ou à copier pour la démo.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {formLinks.map((l) => (
                <div key={l.href} className="rounded-md border bg-muted/20 p-2">
                  <p className="text-xs font-medium text-foreground">{l.label}</p>
                  <a
                    href={l.href}
                    className="mt-1 block break-all text-xs text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.href}
                  </a>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Stagiaires</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {formation.stagiaires.map((s) => (
                  <li key={s.id} className="rounded-md border px-2 py-1.5">
                    <span className="font-medium">
                      {s.prenom} {s.nom}
                    </span>
                    <br />
                    <span className="text-xs text-muted-foreground">{s.email}</span>
                  </li>
                ))}
                {formation.stagiaires.length === 0 && (
                  <li className="text-muted-foreground">Aucun stagiaire</li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entreprise</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {formation.entreprise ? (
                <div className="space-y-1">
                  <p className="font-medium">{formation.entreprise.raisonSociale}</p>
                  <p className="text-muted-foreground">{formation.entreprise.email}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">Non renseignée</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rappel emails (lancement)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-muted-foreground">
              <p>
                <strong className="text-foreground">Entreprise :</strong> convention
                + devis + CGV
              </p>
              <p>
                <strong className="text-foreground">Stagiaires :</strong> règlement
                intérieur
                {livretActif ? " + livret (présentiel/mixte)" : ""} — pas la convention
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <FormationDrive formationId={formation.id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Journal d&apos;automatisation</CardTitle>
          <p className="text-xs text-muted-foreground">
            Historique des workflows exécutés pour cette formation.
          </p>
        </CardHeader>
        <CardContent>
          {formation.automationRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune exécution pour le moment.</p>
          ) : (
            <ul className="divide-y text-sm">
              {formation.automationRuns.map((r) => (
                <li key={r.id} className="flex flex-wrap gap-x-2 py-2 first:pt-0">
                  <span className="text-muted-foreground">
                    {r.startedAt.toLocaleString("fr-FR")}
                  </span>
                  <span className="font-medium">
                    {AUTOMATION_WORKFLOW_LABELS[r.workflow] ?? r.workflow}
                  </span>
                  <span
                    className={
                      r.status === "FAILED"
                        ? "text-red-600"
                        : r.status === "SUCCESS"
                          ? "text-green-700"
                          : "text-muted-foreground"
                    }
                  >
                    {r.status === "SUCCESS"
                      ? "Réussi"
                      : r.status === "FAILED"
                        ? "Échec"
                        : r.status}
                  </span>
                  {r.message && (
                    <span className="w-full text-xs text-muted-foreground">
                      {r.message}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        POC Qualiopi — signatures électroniques (Zoho Sign) hors périmètre : les
        conventions sont générées en PDF non signé. Statut actuel :{" "}
        <strong>{STATUT_LABELS[formation.statut]}</strong>.
      </p>
    </div>
  );
}
