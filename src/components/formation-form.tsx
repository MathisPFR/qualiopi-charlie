"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modalite } from "@prisma/client";
import {
  createFormation,
  updateFormation,
} from "@/server/actions/formations";
import {
  buildFormationPayload,
  validateFormationPayload,
  type FormationFormInitial,
} from "@/lib/formation-form";
import { StagiairesEditor } from "@/components/stagiaires-editor";
import { SeancesEditor } from "@/components/seances-editor";
import { ObjectifsEditor } from "@/components/objectifs-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  mode: "create" | "edit";
  initial: FormationFormInitial;
};

export function FormationForm({ mode, initial }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stagiaireRows, setStagiaireRows] = useState(initial.stagiaireRows);
  const [seanceRows, setSeanceRows] = useState(initial.seanceRows);
  const [objectifRows, setObjectifRows] = useState(
    initial.objectifRows.length > 0 ? initial.objectifRows : [""]
  );
  const [dateDebut, setDateDebut] = useState(initial.dateDebut);
  const [dateFin, setDateFin] = useState(initial.dateFin);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = buildFormationPayload(
      new FormData(e.currentTarget),
      stagiaireRows,
      seanceRows,
      objectifRows
    );
    const validationError = validateFormationPayload(payload);
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      if (mode === "create") {
        const id = await createFormation(payload);
        router.push(`/formations/${id}`);
      } else {
        if (!payload.formationId) throw new Error("Identifiant formation manquant");
        await updateFormation(payload.formationId, payload);
        router.push(`/formations/${payload.formationId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial.formationId && (
        <input type="hidden" name="formationId" value={initial.formationId} />
      )}
      {initial.entrepriseId && (
        <input type="hidden" name="entrepriseId" value={initial.entrepriseId} />
      )}
      {initial.formateurId && (
        <input type="hidden" name="formateurId" value={initial.formateurId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Intitulé interne</Label>
            <Input name="intitule" required defaultValue={initial.intitule} />
          </div>
          <div>
            <Label>Intitulé commercial</Label>
            <Input
              name="intituleCommercial"
              required
              defaultValue={initial.intituleCommercial}
            />
          </div>
          <div>
            <Label>Nom client (dossiers)</Label>
            <Input name="nomClient" required defaultValue={initial.nomClient} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Date début</Label>
              <Input
                name="dateDebut"
                type="date"
                required
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>
            <div>
              <Label>Date fin</Label>
              <Input
                name="dateFin"
                type="date"
                required
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Lieu</Label>
            <Input name="lieu" defaultValue={initial.lieu ?? ""} />
          </div>
          <div>
            <Label>Modalité</Label>
            <select
              name="modalite"
              className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
              defaultValue={initial.modalite}
            >
              <option value="DISTANCIEL">Distanciel</option>
              <option value="PRESENTIEL">Présentiel</option>
              <option value="MIXTE">Mixte</option>
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Durée (heures)</Label>
              <Input
                name="dureeHeures"
                type="number"
                required
                defaultValue={initial.dureeHeures}
              />
            </div>
            <div>
              <Label>Tarif total HT</Label>
              <Input
                name="tarifTotalHt"
                type="number"
                required
                defaultValue={initial.tarifTotalHt}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Tarif / personne HT (optionnel)</Label>
              <Input
                name="tarifParPersonne"
                type="number"
                defaultValue={initial.tarifParPersonne ?? ""}
              />
            </div>
            <div>
              <Label>N° convention / code formation</Label>
              <Input
                name="codeFormation"
                defaultValue={initial.codeFormation ?? ""}
              />
            </div>
          </div>
          <div>
            <Label>Formateur</Label>
            <Input
              name="formateurNom"
              defaultValue={initial.formateurNom ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entreprise</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <Label>Raison sociale</Label>
            <Input
              name="raisonSociale"
              required
              defaultValue={initial.entreprise.raisonSociale}
            />
          </div>
          <div>
            <Label>E-mail entreprise</Label>
            <Input
              name="entrepriseEmail"
              type="email"
              required
              defaultValue={initial.entreprise.email}
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              name="adresse"
              defaultValue={initial.entreprise.adresse ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code postal</Label>
              <Input
                name="codePostal"
                defaultValue={initial.entreprise.codePostal ?? ""}
              />
            </div>
            <div>
              <Label>Ville</Label>
              <Input
                name="ville"
                defaultValue={initial.entreprise.ville ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stagiaires inscrits</CardTitle>
        </CardHeader>
        <CardContent>
          <StagiairesEditor rows={stagiaireRows} onChange={setStagiaireRows} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Séances</CardTitle>
        </CardHeader>
        <CardContent>
          <SeancesEditor
            rows={seanceRows}
            onChange={setSeanceRows}
            dateDebut={dateDebut}
            dateFin={dateFin}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Objectifs de formation</CardTitle>
        </CardHeader>
        <CardContent>
          <ObjectifsEditor rows={objectifRows} onChange={setObjectifRows} />
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Enregistrement…"
            : mode === "create"
              ? "Créer la formation"
              : "Enregistrer les modifications"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
