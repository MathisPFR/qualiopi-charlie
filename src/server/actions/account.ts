"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import { requireAuth } from "@/lib/permissions";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type ChangePasswordState = {
  ok: boolean;
  error?: string;
};

export async function changePassword(
  _prev: ChangePasswordState | null,
  formData: FormData
): Promise<ChangePasswordState> {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return { ok: false, error: "Non authentifié" };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  if (currentPassword === newPassword) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit être différent de l'actuel",
    };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return { ok: false, error: "Compte introuvable" };
  }

  const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
  if (!valid) {
    return { ok: false, error: "Mot de passe actuel incorrect" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await signOut({ redirectTo: "/login?passwordChanged=1" });
  return { ok: true };
}
