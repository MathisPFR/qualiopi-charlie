import Link from "next/link";
import { ActivateAccountForm } from "@/components/activate-account-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ActiverPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-primary">Agence Charlie</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Activation du compte
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Définissez votre mot de passe pour accéder à Qualiopi Charlie.
        </p>
      </div>
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Créer votre mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4 text-sm">
              <p className="text-destructive">
                Lien d&apos;activation invalide ou incomplet.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/login">Retour à la connexion</Link>
              </Button>
            </div>
          ) : (
            <ActivateAccountForm token={token} />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
