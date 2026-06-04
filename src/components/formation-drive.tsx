"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DriveNode = {
  name: string;
  relativePath: string;
  kind: "folder" | "file";
  children?: DriveNode[];
};

export function FormationDrive({ formationId }: { formationId: string }) {
  const [tree, setTree] = useState<DriveNode[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [selectedRel, setSelectedRel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/formations/${formationId}/drive`);
      if (!res.ok) throw new Error("Impossible de charger les fichiers");
      const data = await res.json();
      setTree(data.tree ?? []);
      setStorageReady(!!data.storageReady);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [formationId]);

  useEffect(() => {
    load();
  }, [load]);

  const previewUrl = selectedRel
    ? `/api/formations/${formationId}/file?rel=${encodeURIComponent(selectedRel)}`
    : null;

  const isPdf = selectedRel?.toLowerCase().endsWith(".pdf");
  const selectedName =
    selectedRel?.split("/").pop() ?? null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b bg-muted/20">
        <div>
          <CardTitle className="text-base">Documents générés</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Arborescence Qualiopi — sélectionnez un fichier pour l&apos;aperçu PDF
            plein écran.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedName && (
            <span className="hidden max-w-[240px] truncate text-xs text-muted-foreground sm:inline">
              {selectedName}
            </span>
          )}
          {previewUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={previewUrl} target="_blank" rel="noreferrer">
                Ouvrir dans un onglet
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={load} disabled={loading}>
            Actualiser
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {!storageReady && !loading && (
          <p className="border-b px-4 py-3 text-sm text-muted-foreground">
            Le dossier apparaîtra après import du devis ou lancement de la
            formation.
          </p>
        )}
        {error && (
          <p className="border-b px-4 py-2 text-sm text-red-600">{error}</p>
        )}
        <div className="flex min-h-[min(75vh,720px)] flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b bg-slate-50/80 lg:w-72 lg:border-b-0 lg:border-r xl:w-80">
            <div className="max-h-[min(40vh,280px)] overflow-y-auto p-3 text-sm lg:max-h-none lg:h-full lg:min-h-[min(75vh,720px)]">
              {loading && (
                <p className="text-muted-foreground">Chargement…</p>
              )}
              {!loading &&
                tree.map((folder) => (
                  <div key={folder.relativePath} className="mb-4 last:mb-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {folder.name}
                    </p>
                    <ul className="mt-1.5 space-y-0.5">
                      {(folder.children ?? []).length === 0 && (
                        <li className="px-2 py-1 text-muted-foreground">— vide —</li>
                      )}
                      {(folder.children ?? []).map((file) => {
                        const active = selectedRel === file.relativePath;
                        return (
                          <li key={file.relativePath}>
                            <button
                              type="button"
                              onClick={() => setSelectedRel(file.relativePath)}
                              className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                                active
                                  ? "bg-primary/10 font-medium text-primary"
                                  : "text-foreground hover:bg-muted"
                              }`}
                            >
                              {file.name}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
            </div>
          </aside>

          <div className="flex min-h-[min(55vh,520px)] flex-1 flex-col bg-slate-100/50 lg:min-h-[min(75vh,720px)]">
            {!selectedRel && (
              <p className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                Sélectionnez un document dans la liste pour afficher
                l&apos;aperçu
              </p>
            )}
            {selectedRel && isPdf && previewUrl && (
              <iframe
                title={`Aperçu — ${selectedName ?? "PDF"}`}
                src={previewUrl}
                className="h-full min-h-[min(55vh,520px)] w-full flex-1 border-0 lg:min-h-[min(75vh,720px)]"
              />
            )}
            {selectedRel && !isPdf && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-sm">
                <p className="text-muted-foreground">
                  Aperçu non disponible pour ce type de fichier.
                </p>
                <Button variant="default" asChild>
                  <a href={previewUrl ?? "#"} target="_blank" rel="noreferrer">
                    Télécharger / ouvrir
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
