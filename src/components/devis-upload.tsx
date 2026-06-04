"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDevis } from "@/server/actions/formations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DevisUpload({
  formationId,
  hasDevis,
  devisUploadedAt,
}: {
  formationId: string;
  hasDevis: boolean;
  devisUploadedAt: Date | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    try {
      await uploadDevis(formationId, fd);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card className={!hasDevis ? "border-amber-400 bg-amber-50/50" : ""}>
      <CardHeader>
        <CardTitle className="text-base">Devis entreprise (obligatoire)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {!hasDevis ? (
          <p className="font-medium text-amber-800">
            Vous ne pouvez pas lancer la formation tant que le devis PDF n&apos;est pas
            importé. Il sera envoyé à l&apos;entreprise avec la convention (pas aux stagiaires).
          </p>
        ) : (
          <p className="text-green-700">
            Devis importé
            {devisUploadedAt
              ? ` le ${devisUploadedAt.toLocaleString("fr-FR")}`
              : ""}
            . Vous pouvez le remplacer ci-dessous.
          </p>
        )}
        <p className="text-muted-foreground">
          PDF uniquement, 15 Mo max. Vérification du format (%PDF) à l&apos;upload.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={onUpload}
          />
          <Button
            type="button"
            variant={hasDevis ? "outline" : "default"}
            disabled={loading}
            onClick={() => inputRef.current?.click()}
          >
            {loading
              ? "Import…"
              : hasDevis
                ? "Remplacer le devis"
                : "Importer le devis PDF"}
          </Button>
        </div>
        {error && <p className="text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
