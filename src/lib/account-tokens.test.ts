import { describe, expect, it } from "vitest";
import { generateRawToken, hashToken } from "@/lib/account-tokens";

describe("account-tokens", () => {
  it("generates unique raw tokens", () => {
    const a = generateRawToken();
    const b = generateRawToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(20);
  });

  it("hashes tokens deterministically with sha256 hex", () => {
    expect(hashToken("test-token")).toBe(
      "4c5dc9b7708905f77f5e5d16316b5dfb425e68cb326dcd55a860e90a7707031e"
    );
  });
});
