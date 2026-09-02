import { describe, expect, it } from "vitest";
import { hasGmailMailboxScope, isGoogleIdentityOnlyScope } from "./scopes";

describe("Google OAuth scopes", () => {
  it("keeps Google sign-in separate from Gmail authorization", () => {
    const scope = "openid,email,profile";

    expect(isGoogleIdentityOnlyScope(scope)).toBe(true);
    expect(hasGmailMailboxScope(scope)).toBe(false);
  });

  it("recognizes Gmail authorization with comma-separated scopes", () => {
    expect(
      hasGmailMailboxScope(
        "openid,email,https://www.googleapis.com/auth/gmail.modify",
      ),
    ).toBe(true);
  });

  it("recognizes Gmail authorization with space-separated scopes", () => {
    expect(
      hasGmailMailboxScope(
        "openid email https://www.googleapis.com/auth/gmail.modify",
      ),
    ).toBe(true);
  });
});
