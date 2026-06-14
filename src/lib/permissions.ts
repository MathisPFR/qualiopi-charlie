import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role: UserRole;
};

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthError("Non authentifié");
  }

  let role: UserRole | undefined = session.user.role;
  if (!role) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    role = dbUser?.role ?? undefined;
  }

  if (!role) {
    throw new AuthError("Non authentifié");
  }

  return { ...session.user, role };
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== UserRole.ADMIN) {
    throw new AuthError("Accès réservé aux administrateurs");
  }
  return user;
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === UserRole.ADMIN;
}
