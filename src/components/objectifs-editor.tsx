"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  rows: string[];
  onChange: (rows: string[]) => void;
};

export function ObjectifsEditor({ rows, onChange }: Props) {
  function update(index: number, value: string) {
    onChange(rows.map((r, i) => (i === index ? value : r)));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Objectifs affichés dans les documents et certains formulaires.
      </p>
      {rows.map((value, index) => (
        <div key={index} className="flex gap-2">
          <div className="min-w-0 flex-1">
            <Label className="sr-only">Objectif {index + 1}</Label>
            <Input
              value={value}
              onChange={(e) => update(index, e.target.value)}
              placeholder={`Objectif ${index + 1}`}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-red-600"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            disabled={rows.length === 1}
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, ""])}
      >
        + Ajouter un objectif
      </Button>
    </div>
  );
}
