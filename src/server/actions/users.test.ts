import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserStatus } from "@prisma/client";
import { createInviteToken, findValidInviteToken } from "@/lib/account-tokens";
import { requireAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/server/services/mail";
import { activateAccount, inviteUser } from "./users";

vi.mock("@/lib/permissions", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    accountToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/account-tokens", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/account-tokens")>();
  return {
    ...actual,
    createInviteToken: vi.fn(),
    findValidInviteToken: vi.fn(),
  };
});

vi.mock("@/server/services/mail", () => ({
  sendMail: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockRequireAdmin = vi.mocked(requireAdmin);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockCreate = vi.mocked(prisma.user.create);
const mockUpdate = vi.mocked(prisma.user.update);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockCreateInviteToken = vi.mocked(createInviteToken);
const mockFindValidInviteToken = vi.mocked(findValidInviteToken);
const mockSendMail = vi.mocked(sendMail);

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

describe("inviteUser", () => {
  beforeEach(() => {
    mockRequireAdmin.mockReset();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockUpdate.mockReset();
    mockCreateInviteToken.mockReset();
    mockSendMail.mockReset();
    mockRequireAdmin.mockResolvedValue({
      id: "admin-1",
      email: "admin@test.local",
      role: "ADMIN",
    } as never);
    mockCreateInviteToken.mockResolvedValue("raw-invite-token");
    mockSendMail.mockResolvedValue({ id: "mail-1" });
  });

  it("rejects non-admin access", async () => {
    mockRequireAdmin.mockRejectedValue(new Error("Non authentifié"));

    const result = await inviteUser(
      null,
      form({ email: "new@test.local", name: "New", role: "OPERATEUR" })
    );

    expect(result).toEqual({
      ok: false,
      error: "Accès réservé aux administrateurs",
    });
  });

  it("rejects active duplicate email", async () => {
    mockFindUnique.mockResolvedValue({
      id: "u1",
      status: UserStatus.ACTIVE,
    } as never);

    const result = await inviteUser(
      null,
      form({ email: "exists@test.local", name: "Exists", role: "OPERATEUR" })
    );

    expect(result).toEqual({
      ok: false,
      error: "Un compte actif existe déjà pour cet email",
    });
  });

  it("creates pending user and sends invite email", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "user-new" } as never);

    const result = await inviteUser(
      null,
      form({
        email: "new@test.local",
        name: "Nouveau",
        role: "OPERATEUR",
      })
    );

    expect(result.ok).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "new@test.local",
          status: UserStatus.PENDING,
        }),
      })
    );
    expect(mockCreateInviteToken).toHaveBeenCalledWith("user-new");
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "new@test.local",
        subject: expect.stringContaining("Activez votre compte"),
        html: expect.stringContaining("raw-invite-token"),
      })
    );
  });

  it("resends invite for pending user", async () => {
    mockFindUnique.mockResolvedValue({
      id: "pending-1",
      status: UserStatus.PENDING,
    } as never);
    mockUpdate.mockResolvedValue({ id: "pending-1" } as never);

    const result = await inviteUser(
      null,
      form({
        email: "pending@test.local",
        name: "Pending",
        role: "ADMIN",
      })
    );

    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockCreateInviteToken).toHaveBeenCalledWith("pending-1");
  });
});

describe("activateAccount", () => {
  beforeEach(() => {
    mockFindValidInviteToken.mockReset();
    mockTransaction.mockReset();
    mockTransaction.mockResolvedValue([] as never);
  });

  it("rejects invalid token", async () => {
    mockFindValidInviteToken.mockResolvedValue(null);

    const result = await activateAccount(
      null,
      form({
        token: "bad",
        password: "newpass123",
        confirmPassword: "newpass123",
      })
    );

    expect(result).toEqual({
      ok: false,
      error: "Lien d'activation invalide ou expiré",
    });
  });

  it("activates account and redirects to login", async () => {
    mockFindValidInviteToken.mockResolvedValue({
      id: "token-1",
      userId: "user-1",
      user: { status: UserStatus.PENDING },
    } as never);

    await expect(
      activateAccount(
        null,
        form({
          token: "valid-token",
          password: "newpass123",
          confirmPassword: "newpass123",
        })
      )
    ).rejects.toThrow("REDIRECT:/login?activated=1");

    expect(mockTransaction).toHaveBeenCalled();
  });
});
