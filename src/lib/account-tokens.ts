import crypto from "crypto";
import { AccountTokenType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function createInviteToken(userId: string): Promise<string> {
  const raw = generateRawToken();
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  await prisma.$transaction([
    prisma.accountToken.updateMany({
      where: {
        userId,
        type: AccountTokenType.INVITE,
        usedAt: null,
      },
      data: { usedAt: new Date() },
    }),
    prisma.accountToken.create({
      data: {
        userId,
        type: AccountTokenType.INVITE,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  return raw;
}

export async function findValidInviteToken(raw: string) {
  const tokenHash = hashToken(raw);
  return prisma.accountToken.findFirst({
    where: {
      tokenHash,
      type: AccountTokenType.INVITE,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });
}
