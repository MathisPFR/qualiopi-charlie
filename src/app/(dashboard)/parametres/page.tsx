import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ParametresPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Paramètres</h1>
        <p className="mt-2 text-muted-foreground">
          Configuration instance réservée aux administrateurs.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Utilisateurs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Inviter des opérateurs ou administrateurs par email avec lien
            d&apos;activation.
          </p>
          <Link
            href="/parametres/utilisateurs"
            className="text-sm font-medium text-primary hover:underline"
          >
            Gérer les utilisateurs →
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
