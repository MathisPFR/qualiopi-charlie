"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  actionRunEvalFroidCron,
  actionTestEmail,
  resetFormationForTest,
} from "@/server/actions/formations";

type ToolAction = {
  id: string;
  label: string;
  description: string;
  variant?: "outline" | "destructive";
  confirm?: string;
  run: () => Promise<unknown>;
};

export function FormationTestTools({ formationId }: { formationId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const tools: ToolAction[] = [
    {
      id: "cron",
      label: "Cron éval à froid",
      description:
        "Simule l'envoi automatique M+2 (formations éligibles uniquement).",
      variant: "outline",
      run: () => actionRunEvalFroidCron(),
    },
    {
      id: "email",
      label: "Tester l'envoi email",
      description: "Envoie un email de test via Resend (destinataire configuré).",
      variant: "outline",
      run: async () => {
        const r = await actionTestEmail();
        if (r?.to) {
          setSuccess(`Email de test envoyé à ${r.to}`);
        }
      },
    },
    {
      id: "reset",
      label: "Repartir à zéro",
      description:
        "Remet en brouillon, supprime les fichiers générés et les réponses formulaires.",
      variant: "destructive",
      confirm:
        "Réinitialiser cette formation ?\n\n• Statut → Brouillon\n• Fichiers générés supprimés\n• Journal et réponses formulaires effacés\n\nVous pourrez relancer la démonstration depuis le début.",
      run: () => resetFormationForTest(formationId),
    },
  ];

  async function runTool(tool: ToolAction) {
    if (tool.confirm && !confirm(tool.confirm)) return;
    setLoading(tool.id);
    setError(null);
    setSuccess(null);
    try {
      await tool.run();
      if (tool.id !== "email") {
        setSuccess("Action terminée.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="border-dashed border-slate-300 bg-slate-50/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-medium text-slate-700">
              Outils de test
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Réservés à la démonstration POC — regroupés pour ne pas encombrer
              le parcours principal.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? "Masquer" : "Afficher"}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent className="space-y-2 border-t border-dashed pt-4">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col gap-2 rounded-md border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
              <Button
                type="button"
                variant={tool.variant ?? "outline"}
                size="sm"
                className="shrink-0 sm:w-auto"
                disabled={!!loading}
                onClick={() => runTool(tool)}
              >
                {loading === tool.id ? "En cours…" : "Exécuter"}
              </Button>
            </div>
          ))}
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
      )}
    </Card>
  );
}
