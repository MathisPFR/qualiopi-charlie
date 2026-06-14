import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium text-primary">Agence Charlie</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Qualiopi — démonstration
        </h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Connexion réservée au pilotage des formations (POC).
        </p>
      </div>
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Connexion</CardTitle>
        </CardHeader>
        <CardContent>
          {error === "invalid" && (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Email ou mot de passe incorrect.
            </p>
          )}
          <form
            action={async (formData) => {
              "use server";
              try {
                await signIn("credentials", {
                  email: formData.get("email"),
                  password: formData.get("password"),
                  redirectTo: "/",
                });
              } catch (e) {
                if (e instanceof AuthError && e.type === "CredentialsSignin") {
                  redirect("/login?error=invalid");
                }
                throw e;
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="admin@charlie.local"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
