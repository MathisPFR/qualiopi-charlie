"use server";

import bcrypt from "bcryptjs";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createInviteToken, findValidInviteToken } from "@/lib/account-tokens";
import { getClientConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";
import { buildUserInviteEmail } from "@/server/services/mail-templates/user-invite";
import { sendMail } from "@/server/services/mail";

const inviteUserSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Nom requis").max(120),
  role: z.enum(["ADMIN", "OPERATEUR"]),
});

const activateAccountSchema = z
  .object({
    token: z.string().min(1, "Lien d'activation invalide"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
    confirmPassword: z.string().min(1, "Confirmation requise"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type InviteUserState = {
  ok: boolean;
  error?: string;
};

export type ActivateAccountState = {
  ok: boolean;
  error?: string;
};

export async function inviteUser(
  _prev: InviteUserState | null,
  formData: FormData
): Promise<InviteUserState> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Accès réservé aux administrateurs" };
  }

  const parsed = inviteUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    };
  }

  const { email, name, role } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing?.status === UserStatus.ACTIVE) {
    return { ok: false, error: "Un compte actif existe déjà pour cet email" };
  }

  if (existing?.status === UserStatus.DISABLED) {
    return { ok: false, error: "Ce compte est désactivé" };
  }

  let userId: string;
  if (existing?.status === UserStatus.PENDING) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { name, role: role as UserRole, invitedAt: new Date() },
    });
    userId = updated.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        role: role as UserRole,
        status: UserStatus.PENDING,
        invitedAt: new Date(),
      },
    });
    userId = created.id;
  }

  const rawToken = await createInviteToken(userId);
  const client = getClientConfig();
  const activationUrl = `${client.formBaseUrl.replace(/\/$/, "")}/auth/activer?token=${encodeURIComponent(rawToken)}`;
  const { subject, html } = buildUserInviteEmail({
    inviteeName: name,
    orgName: client.orgName,
    activationUrl,
  });

  try {
    await sendMail({ to: normalizedEmail, subject, html });
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Impossible d'envoyer l'email d'invitation",
    };
  }

  revalidatePath("/parametres/utilisateurs");
  return { ok: true };
}

export async function activateAccount(
  _prev: ActivateAccountState | null,
  formData: FormData
): Promise<ActivateAccountState> {
  const parsed = activateAccountSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    };
  }

  const { token, password } = parsed.data;
  const record = await findValidInviteToken(token);

  if (!record || record.user.status !== UserStatus.PENDING) {
    return {
      ok: false,
      error: "Lien d'activation invalide ou expiré",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.accountToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login?activated=1");
}
