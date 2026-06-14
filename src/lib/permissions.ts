import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";

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
  if (!session?.user?.id || !session.user.role) {
    throw new AuthError("Non authentifié");
  }
  return session.user as SessionUser;
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
