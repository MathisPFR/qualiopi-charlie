import { UserRole } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthError,
  isAdmin,
  requireAdmin,
  requireAuth,
} from "./permissions";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);

describe("permissions", () => {
  beforeEach(() => {
    mockAuth.mockReset();
    mockFindUnique.mockReset();
  });

  describe("requireAuth", () => {
    it("throws when not logged in", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(requireAuth()).rejects.toThrow(AuthError);
    });

    it("returns user when role is in session", async () => {
      mockAuth.mockResolvedValue({
        user: {
          id: "u1",
          email: "a@test.local",
          role: UserRole.OPERATEUR,
        },
      } as never);

      const user = await requireAuth();
      expect(user.role).toBe(UserRole.OPERATEUR);
      expect(mockFindUnique).not.toHaveBeenCalled();
    });

    it("loads role from DB when missing in session", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", email: "a@test.local" },
      } as never);
      mockFindUnique.mockResolvedValue({ role: UserRole.ADMIN } as never);

      const user = await requireAuth();
      expect(user.role).toBe(UserRole.ADMIN);
    });
  });

  describe("requireAdmin", () => {
    it("rejects OPERATEUR", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: UserRole.OPERATEUR },
      } as never);

      await expect(requireAdmin()).rejects.toThrow(
        "Accès réservé aux administrateurs"
      );
    });

    it("allows ADMIN", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "u1", role: UserRole.ADMIN },
      } as never);

      const user = await requireAdmin();
      expect(user.role).toBe(UserRole.ADMIN);
    });
  });

  describe("isAdmin", () => {
    it("returns true only for ADMIN", () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true);
      expect(isAdmin(UserRole.OPERATEUR)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });
  });
});
