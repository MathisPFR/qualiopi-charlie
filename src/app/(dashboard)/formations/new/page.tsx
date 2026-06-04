import { FormationForm } from "@/components/formation-form";
import { DEFAULT_FORMATION_FORM } from "@/lib/formation-form";

import Link from "next/link";

export default function NewFormationPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/"
        className="inline-flex text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour aux formations
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nouvelle formation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paramétrez la formation avant le lancement de la démo.
        </p>
      </div>
      <FormationForm mode="create" initial={DEFAULT_FORMATION_FORM} />
    </div>
  );
}
