import { describe, expect, it } from "vitest";
import { isAdminOnlyPath } from "./admin-routes";

describe("isAdminOnlyPath", () => {
  it("matches exact admin routes", () => {
    expect(isAdminOnlyPath("/types")).toBe(true);
    expect(isAdminOnlyPath("/parametres")).toBe(true);
  });

  it("matches nested admin routes", () => {
    expect(isAdminOnlyPath("/types/foo")).toBe(true);
    expect(isAdminOnlyPath("/parametres/organisation")).toBe(true);
  });

  it("does not match public or operator routes", () => {
    expect(isAdminOnlyPath("/")).toBe(false);
    expect(isAdminOnlyPath("/compte")).toBe(false);
    expect(isAdminOnlyPath("/formations/new")).toBe(false);
    expect(isAdminOnlyPath("/login")).toBe(false);
  });
});
