import { FormationStatut } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { STATUT_BADGE_VARIANT, STATUT_LABELS } from "@/lib/formation-ui";

export function FormationStatutBadge({ statut }: { statut: FormationStatut }) {
  return (
    <Badge variant={STATUT_BADGE_VARIANT[statut]}>{STATUT_LABELS[statut]}</Badge>
  );
}
