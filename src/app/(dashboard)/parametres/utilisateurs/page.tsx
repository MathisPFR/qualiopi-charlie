import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteUserForm } from "@/components/invite-user-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  DISABLED: "Désactivé",
};

export default async function UtilisateursPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      invitedAt: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/parametres"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Paramètres
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Utilisateurs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Invitez des opérateurs ou administrateurs par email.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inviter un utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comptes existants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.name ?? "—"}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{statusLabels[user.status] ?? user.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
