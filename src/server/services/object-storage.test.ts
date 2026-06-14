import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formationObjectKey,
  getObjectStorage,
  getStorageDriver,
  resetObjectStorageCache,
} from "./object-storage";

vi.mock("@/lib/config", () => ({
  getStorageRoot: vi.fn(),
}));

import { getStorageRoot } from "@/lib/config";

const mockGetStorageRoot = vi.mocked(getStorageRoot);
let tempDir: string;

describe("object-storage (local driver)", () => {
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "qualiopi-storage-test-"));
    mockGetStorageRoot.mockReturnValue(tempDir);
    process.env.STORAGE_DRIVER = "local";
    resetObjectStorageCache();
  });

  afterEach(async () => {
    resetObjectStorageCache();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("builds formation object keys safely", () => {
    expect(
      formationObjectKey("fid", "avant-la-formation", "convention.pdf")
    ).toBe("formations/fid/avant-la-formation/convention.pdf");
    expect(
      formationObjectKey("fid", "avant-la-formation", "bad/name.pdf")
    ).toBe("formations/fid/avant-la-formation/bad-name.pdf");
  });

  it("put, get, list and delete on local storage", async () => {
    const storage = getObjectStorage();
    const key = formationObjectKey(
      "test-1",
      "avant-la-formation",
      "doc.pdf"
    );

    await storage.put(key, Buffer.from("hello"));
    expect((await storage.get(key))?.toString()).toBe("hello");

    const listed = await storage.list("formations/test-1/");
    expect(listed).toContain(key);

    await storage.delete(key);
    expect(await storage.get(key)).toBeNull();
  });

  it("rejects unsafe keys", async () => {
    const storage = getObjectStorage();
    await expect(storage.put("../escape.txt", Buffer.from("x"))).rejects.toThrow(
      "Invalid object key"
    );
  });

  it("defaults to local driver", () => {
    delete process.env.STORAGE_DRIVER;
    expect(getStorageDriver()).toBe("local");
  });

  it("rejects unknown driver", () => {
    process.env.STORAGE_DRIVER = "s3";
    expect(() => getStorageDriver()).toThrow("Invalid STORAGE_DRIVER");
  });
});
