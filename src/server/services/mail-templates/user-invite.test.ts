import { describe, expect, it } from "vitest";
import { buildUserInviteEmail } from "@/server/services/mail-templates/user-invite";

describe("buildUserInviteEmail", () => {
  it("builds activation link in html", () => {
    const { subject, html } = buildUserInviteEmail({
      inviteeName: "Alice",
      orgName: "Charlie Demo",
      activationUrl: "http://localhost:3000/auth/activer?token=abc",
    });

    expect(subject).toContain("Charlie Demo");
    expect(html).toContain("Alice");
    expect(html).toContain("/auth/activer?token=abc");
  });
});
