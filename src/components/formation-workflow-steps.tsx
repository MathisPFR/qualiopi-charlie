import { FormationStatut } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  STATUT_LABELS,
  WORKFLOW_STEPS,
  workflowStepIndex,
} from "@/lib/formation-ui";

export function FormationWorkflowSteps({
  statut,
}: {
  statut: FormationStatut;
}) {
  const current = workflowStepIndex(statut);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Parcours Qualiopi</p>
        {statut === FormationStatut.ARCHIVEE && (
          <span className="text-xs text-muted-foreground">
            Statut : {STATUT_LABELS[statut]}
          </span>
        )}
      </div>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WORKFLOW_STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current && statut !== FormationStatut.ARCHIVEE;
          return (
            <li
              key={step.statut}
              className={cn(
                "rounded-md border px-3 py-2 text-sm transition-colors",
                done && "border-green-200 bg-green-50/80",
                active && "border-primary bg-primary/5 ring-1 ring-primary/20",
                !done && !active && "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    done && "bg-green-600 text-white",
                    active && "bg-primary text-primary-foreground",
                    !done && !active && "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className={cn("font-medium", active && "text-primary")}>
                  {step.label}
                </span>
              </div>
              <p className="mt-1 pl-8 text-xs text-muted-foreground">{step.hint}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
