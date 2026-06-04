import Link from "next/link";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function DashboardNav() {
  return (
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div>
          <Link href="/" className="text-lg font-semibold text-primary">
            Qualiopi — POC Charlie
          </Link>
          <p className="hidden text-xs text-muted-foreground sm:block">
            Automatisation administrative des formations
          </p>
        </div>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Formations
          </Link>
          <Button asChild size="sm" variant="default">
            <Link href="/formations/new">Nouvelle</Link>
          </Button>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              Déconnexion
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
