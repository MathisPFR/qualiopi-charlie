import type { ObjectifFormation } from "@prisma/client";
import { notFound } from "next/navigation";
import { getFormationBySlug } from "@/server/db/formation";
import { PublicForm } from "@/components/public-form";
import {
  PUBLIC_FORM_META,
  type FormSection,
} from "@/lib/public-form-schemas";

function resolveSections(
  formType: string,
  objectifs: Pick<ObjectifFormation, "libelle">[]
): FormSection[] | null {
  const meta = PUBLIC_FORM_META[formType];
  if (!meta) return null;
  const sections =
    typeof meta.sections === "function"
      ? meta.sections(objectifs as ObjectifFormation[])
      : meta.sections;
  return sections;
}

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; formType: string }>;
  searchParams: Promise<{ stagiaire?: string }>;
}) {
  const { slug, formType } = await params;
  const { stagiaire: stagiaireId } = await searchParams;
  const meta = PUBLIC_FORM_META[formType];
  if (!meta) notFound();

  const formation = await getFormationBySlug(slug);
  if (!formation) notFound();

  const sections = resolveSections(formType, formation.objectifs);
  if (!sections) notFound();

  const stagiaire = stagiaireId
    ? formation.stagiaires.find((s) => s.id === stagiaireId)
    : undefined;

  const initialValues: Record<string, string> = {};
  if (stagiaire) {
    initialValues.NOM = stagiaire.nom;
    initialValues.PRENOM = stagiaire.prenom;
    initialValues.FONCTION = stagiaire.fonction ?? "";
    initialValues.TEL = stagiaire.telephone ?? "";
    initialValues.EMAIL = stagiaire.email;
  }

  const displaySections = stagiaire
    ? sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({
          ...field,
          readOnly:
            ["NOM", "PRENOM", "EMAIL"].includes(field.name) &&
            !!initialValues[field.name]
              ? true
              : field.readOnly,
        })),
      }))
    : sections;

  const needsStagiaire =
    formType === "besoins-stagiaire" ||
    formType === "eval-chaud" ||
    formType === "eval-froid";

  return (
    <main className="min-h-screen bg-slate-50/80 py-8">
      <div className="mx-auto max-w-2xl space-y-6 px-4">
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Formulaire Qualiopi
          </p>
          <h1 className="mt-1 text-xl font-bold">{meta.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Formation : <strong>{formation.intituleCommercial}</strong>
          </p>
          {stagiaire && (
            <p className="mt-1 text-sm text-muted-foreground">
              Stagiaire : {stagiaire.prenom} {stagiaire.nom}
            </p>
          )}
          {needsStagiaire && !stagiaire && (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Ce lien doit être ouvert depuis l&apos;email reçu (paramètre stagiaire
              manquant).
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <PublicForm
            slug={slug}
            formType={formType}
            stagiaireId={stagiaireId}
            sections={displaySections}
            initialValues={initialValues}
          />
        </div>
      </div>
    </main>
  );
}
