import bcrypt from "bcryptjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/permissions";
import { changePassword } from "./account";

vi.mock("@/lib/auth", () => ({
  signOut: vi.fn(),
}));

vi.mock("@/lib/permissions", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockRequireAuth = vi.mocked(requireAuth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockUpdate = vi.mocked(prisma.user.update);
const mockSignOut = vi.mocked(signOut);

function form(entries: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    fd.set(k, v);
  }
  return fd;
}

describe("changePassword", () => {
  beforeEach(() => {
    mockRequireAuth.mockReset();
    mockFindUnique.mockReset();
    mockUpdate.mockReset();
    mockSignOut.mockReset();
    mockRequireAuth.mockResolvedValue({
      id: "user-1",
      email: "u@test.local",
      role: "OPERATEUR",
    } as never);
  });

  it("returns error when unauthenticated", async () => {
    mockRequireAuth.mockRejectedValue(new Error("Non authentifié"));

    const result = await changePassword(
      null,
      form({
        currentPassword: "oldpass12",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      })
    );

    expect(result).toEqual({ ok: false, error: "Non authentifié" });
  });

  it("validates password confirmation", async () => {
    const result = await changePassword(
      null,
      form({
        currentPassword: "oldpass12",
        newPassword: "newpass123",
        confirmPassword: "different",
      })
    );

    expect(result.ok).toBe(false);
    expect(result.error).toContain("correspondent pas");
  });

  it("rejects when current password is wrong", async () => {
    const hash = await bcrypt.hash("correct12", 10);
    mockFindUnique.mockResolvedValue({ passwordHash: hash } as never);

    const result = await changePassword(
      null,
      form({
        currentPassword: "wrongpass",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      })
    );

    expect(result).toEqual({
      ok: false,
      error: "Mot de passe actuel incorrect",
    });
  });

  it("updates hash and signs out on success", async () => {
    const hash = await bcrypt.hash("oldpass12", 10);
    mockFindUnique.mockResolvedValue({ passwordHash: hash } as never);
    mockUpdate.mockResolvedValue({} as never);
    mockSignOut.mockResolvedValue(undefined as never);

    const result = await changePassword(
      null,
      form({
        currentPassword: "oldpass12",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      })
    );

    expect(result.ok).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      })
    );
    const updatedHash = mockUpdate.mock.calls[0][0].data.passwordHash;
    expect(await bcrypt.compare("newpass123", updatedHash)).toBe(true);
    expect(mockSignOut).toHaveBeenCalledWith({
      redirectTo: "/login?passwordChanged=1",
    });
  });
});
