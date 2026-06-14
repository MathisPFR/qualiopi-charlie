import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ComptePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon compte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre accès à l&apos;application.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Identité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Email — </span>
            {session.user.email}
          </p>
          {session.user.name && (
            <p>
              <span className="text-muted-foreground">Nom — </span>
              {session.user.name}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Rôle — </span>
            {session.user.role}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Après modification, vous serez déconnecté et devrez vous reconnecter
            avec le nouveau mot de passe.
          </p>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
