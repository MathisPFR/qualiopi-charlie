"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormationStatut } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  actionLaunchFormation,
  updateFormationStatut,
  actionRegenerateEmargements,
} from "@/server/actions/formations";

export function FormationActions({
  formationId,
  statut,
  canLaunch,
  hasDevis,
  canRegenerateEmargements,
}: {
  formationId: string;
  statut: FormationStatut;
  canLaunch: boolean;
  hasDevis: boolean;
  canRegenerateEmargements: boolean;
}) {
  const launchAllowed = canLaunch && hasDevis;
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function run(label: string, fn: () => Promise<unknown>, okMessage?: string) {
    setLoading(label);
    setError(null);
    setSuccess(null);
    try {
      await fn();
      if (okMessage) setSuccess(okMessage);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  const busy = !!loading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enchaînez les étapes comme dans le processus Qualiopi (lancement → en
          cours → clôture).
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {canLaunch && !hasDevis && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Importez le devis PDF ci-dessus avant de lancer la formation.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {canLaunch && (
            <Button
              disabled={busy || !launchAllowed}
              title={!hasDevis ? "Devis obligatoire" : undefined}
              onClick={() =>
                run(
                  "launch",
                  () => actionLaunchFormation(formationId),
                  "Lancement terminé — consultez le drive et les emails."
                )
              }
            >
              {loading === "launch"
                ? "Lancement…"
                : "Lancer l'automatisation"}
            </Button>
          )}
          {statut === FormationStatut.A_LANCER && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(
                  "en cours",
                  () =>
                    updateFormationStatut(formationId, FormationStatut.EN_COURS),
                  "Formation en cours — émargements générés."
                )
              }
            >
              {loading === "en cours" ? "Mise à jour…" : "Passer en cours"}
            </Button>
          )}
          {statut === FormationStatut.EN_COURS && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(
                  "terminée",
                  () =>
                    updateFormationStatut(formationId, FormationStatut.TERMINEE),
                  "Formation terminée — attestations et emails envoyés."
                )
              }
            >
              {loading === "terminée"
                ? "Clôture…"
                : "Terminer la formation"}
            </Button>
          )}
          {canRegenerateEmargements && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run(
                  "emargements",
                  () => actionRegenerateEmargements(formationId),
                  "Émargements régénérés dans « Pendant la formation »."
                )
              }
            >
              {loading === "emargements"
                ? "Génération…"
                : "Régénérer les émargements"}
            </Button>
          )}
          {statut === FormationStatut.TERMINEE && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                run("archiver", () =>
                  updateFormationStatut(formationId, FormationStatut.ARCHIVEE)
                )
              }
            >
              Archiver
            </Button>
          )}
        </div>

        {success && (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {success}
          </p>
        )}
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
