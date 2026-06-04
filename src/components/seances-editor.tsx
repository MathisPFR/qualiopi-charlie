"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SeanceRow } from "@/lib/formation-form";
import { newSeanceRow } from "@/lib/formation-form";

type Props = {
  rows: SeanceRow[];
  onChange: (rows: SeanceRow[]) => void;
  dateDebut?: string;
  dateFin?: string;
};

export function SeancesEditor({
  rows,
  onChange,
  dateDebut,
  dateFin,
}: Props) {
  function update<K extends keyof SeanceRow>(
    key: string,
    field: K,
    value: SeanceRow[K]
  ) {
    onChange(
      rows.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  }

  function remove(key: string) {
    onChange(rows.filter((r) => r.key !== key));
  }

  function suggestFromFormationDates() {
    if (!dateDebut || !dateFin) return;
    const start = new Date(dateDebut);
    const end = new Date(dateFin);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (end < start) return;

    const suggested: SeanceRow[] = [];
    const cur = new Date(start);
    let n = 1;
    while (cur <= end) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      suggested.push(
        newSeanceRow({
          date: `${y}-${m}-${d}`,
          heureDebut: "09:00",
          heureFin: "12:00",
          nom: `Séance ${n}`,
          includeInEmargement: true,
        })
      );
      cur.setDate(cur.getDate() + 1);
      n++;
      if (n > 31) break;
    }
    if (suggested.length > 0) onChange(suggested);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Chaque séance apparaît sur les feuilles d&apos;émargement. Cochez
        « Inclure dans l&apos;émargement » pour les séances à faire signer.
      </p>

      {dateDebut && dateFin && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={suggestFromFormationDates}
        >
          Proposer une séance par jour (entre date début et fin)
        </Button>
      )}

      {rows.length === 0 && (
        <p className="rounded-md border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune séance — ajoutez au moins un créneau pour générer les
          émargements.
        </p>
      )}

      {rows.map((row, index) => (
        <div
          key={row.key}
          className="rounded-lg border bg-slate-50/50 p-4 shadow-sm"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">{row.nom || `Séance ${index + 1}`}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => remove(row.key)}
            >
              Supprimer
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input
                type="date"
                value={row.date}
                onChange={(e) => update(row.key, "date", e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Heure début *</Label>
              <Input
                value={row.heureDebut}
                onChange={(e) => update(row.key, "heureDebut", e.target.value)}
                placeholder="09:00 ou 9H"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Heure fin *</Label>
              <Input
                value={row.heureFin}
                onChange={(e) => update(row.key, "heureFin", e.target.value)}
                placeholder="12:00 ou 12H"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Libellé</Label>
              <Input
                value={row.nom}
                onChange={(e) => update(row.key, "nom", e.target.value)}
                placeholder="Séance 1"
                className="mt-1"
              />
            </div>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={row.includeInEmargement}
              onChange={(e) =>
                update(row.key, "includeInEmargement", e.target.checked)
              }
              className="h-4 w-4 rounded border-input"
            />
            Inclure dans l&apos;émargement
          </label>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() =>
          onChange([
            ...rows,
            newSeanceRow({
              date: dateDebut ?? "",
            }),
          ])
        }
      >
        + Ajouter une séance
      </Button>
    </div>
  );
}
