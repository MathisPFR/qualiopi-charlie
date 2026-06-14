import { EmargementMode } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getClientConfig } from "@/lib/config";
import { prisma } from "@/lib/prisma";
import { getInstanceConfig } from "./instance-config";

vi.mock("@/lib/config", () => ({
  getClientConfig: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    instanceSettings: {
      findUnique: vi.fn(),
    },
  },
}));

const mockClientConfig = vi.mocked(getClientConfig);
const mockFindSettings = vi.mocked(prisma.instanceSettings.findUnique);

const clientDefaults = {
  orgName: "Client Org",
  orgEmail: "client@test.local",
  formBaseUrl: "http://localhost:3000",
  storagePrefix: "formations",
};

describe("getInstanceConfig", () => {
  beforeEach(() => {
    mockClientConfig.mockReturnValue(clientDefaults);
    mockFindSettings.mockReset();
  });

  it("returns client defaults when no DB row", async () => {
    mockFindSettings.mockResolvedValue(null);

    const config = await getInstanceConfig();
    expect(config.orgName).toBe("Client Org");
    expect(config.devisRequired).toBe(true);
    expect(config.emargementModeDefault).toBe(EmargementMode.PDF);
    expect(config.storagePrefix).toBe("formations");
  });

  it("merges DB overrides when non-null", async () => {
    mockFindSettings.mockResolvedValue({
      id: "singleton",
      orgName: "Override Org",
      orgEmail: null,
      formBaseUrl: null,
      devisRequired: false,
      sendProgrammeOnLaunch: true,
      emargementModeDefault: EmargementMode.SIGNATURE,
      updatedAt: new Date(),
    });

    const config = await getInstanceConfig();
    expect(config.orgName).toBe("Override Org");
    expect(config.orgEmail).toBe("client@test.local");
    expect(config.formBaseUrl).toBe("http://localhost:3000");
    expect(config.devisRequired).toBe(false);
    expect(config.sendProgrammeOnLaunch).toBe(true);
    expect(config.emargementModeDefault).toBe(EmargementMode.SIGNATURE);
    expect(config.storagePrefix).toBe("formations");
  });
});
