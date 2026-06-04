import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormation } from "@/server/actions/formations";
import { FormationForm } from "@/components/formation-form";
import {
  formatDateInput,
  stagiairesFromDb,
  seancesFromDb,
  type FormationFormInitial,
} from "@/lib/formation-form";
import { Button } from "@/components/ui/button";

export default async function EditFormationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const formation = await getFormation(id);
  if (!formation) notFound();

  const initial: FormationFormInitial = {
    formationId: formation.id,
    entrepriseId: formation.entrepriseId ?? undefined,
    formateurId: formation.formateurId ?? undefined,
    intitule: formation.intitule,
    intituleCommercial: formation.intituleCommercial,
    nomClient: formation.nomClient,
    dateDebut: formatDateInput(formation.dateDebut),
    dateFin: formatDateInput(formation.dateFin),
    lieu: formation.lieu,
    modalite: formation.modalite,
    dureeHeures: formation.dureeHeures,
    tarifTotalHt: formation.tarifTotalHt,
    tarifParPersonne: formation.tarifParPersonne ?? undefined,
    codeFormation: formation.codeFormation ?? undefined,
    formateurNom: formation.formateur?.nom,
    entreprise: {
      raisonSociale: formation.entreprise?.raisonSociale ?? "",
      email: formation.entreprise?.email ?? "",
      adresse: formation.entreprise?.adresse ?? undefined,
      codePostal: formation.entreprise?.codePostal ?? undefined,
      ville: formation.entreprise?.ville ?? undefined,
    },
    stagiaireRows: stagiairesFromDb(formation.stagiaires),
    seanceRows: seancesFromDb(formation.seances),
    objectifRows:
      formation.objectifs.length > 0
        ? formation.objectifs.map((o) => o.libelle)
        : [""],
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/formations/${id}`}
        className="inline-flex text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour à la formation
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Modifier la formation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stagiaires et séances se gèrent bloc par bloc — plus besoin du format
            texte avec point-virgules.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/formations/${id}`}>Fiche formation</Link>
        </Button>
      </div>
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
        Après modification des données métier, utilisez « Repartir à zéro » puis
        relancez l&apos;automatisation pour régénérer les PDF.
      </p>
      <FormationForm mode="edit" initial={initial} />
    </div>
  );
}
