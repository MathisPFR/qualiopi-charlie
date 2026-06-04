"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StagiaireRow } from "@/lib/formation-form";
import { newStagiaireRow } from "@/lib/formation-form";

type Props = {
  rows: StagiaireRow[];
  onChange: (rows: StagiaireRow[]) => void;
};

export function StagiairesEditor({ rows, onChange }: Props) {
  function update(key: string, field: keyof StagiaireRow, value: string) {
    onChange(
      rows.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  }

  function remove(key: string) {
    onChange(rows.filter((r) => r.key !== key));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Un stagiaire par bloc. Les e-mails servent aux envois automatiques et aux
        liens de formulaires personnalisés.
      </p>

      {rows.length === 0 && (
        <p className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucun stagiaire — ajoutez au moins une personne inscrite.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.key}
          className="rounded-lg border bg-slate-50/50 p-4 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              Stagiaire {index + 1}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => remove(row.key)}
              disabled={rows.length === 1}
              title={
                rows.length === 1
                  ? "Au moins un stagiaire est requis"
                  : "Supprimer"
              }
            >
              Supprimer
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Prénom *</Label>
              <Input
                value={row.prenom}
                onChange={(e) => update(row.key, "prenom", e.target.value)}
                required
                placeholder="Mathis"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Nom *</Label>
              <Input
                value={row.nom}
                onChange={(e) => update(row.key, "nom", e.target.value)}
                required
                placeholder="Petit"
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs">E-mail *</Label>
              <Input
                type="email"
                value={row.email}
                onChange={(e) => update(row.key, "email", e.target.value)}
                required
                placeholder="prenom.nom@entreprise.fr"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Téléphone</Label>
              <Input
                type="tel"
                value={row.telephone}
                onChange={(e) => update(row.key, "telephone", e.target.value)}
                placeholder="06 12 34 56 78"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Fonction</Label>
              <Input
                value={row.fonction}
                onChange={(e) => update(row.key, "fonction", e.target.value)}
                placeholder="Commercial"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => onChange([...rows, newStagiaireRow()])}
      >
        + Ajouter un stagiaire
      </Button>
    </div>
  );
}
