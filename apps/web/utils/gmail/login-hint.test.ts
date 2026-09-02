import { describe, expect, it } from "vitest";
import { getGoogleOnboardingLoginHint } from "./login-hint";

describe("getGoogleOnboardingLoginHint", () => {
  it("reuses the Google signup account during onboarding", () => {
    expect(
      getGoogleOnboardingLoginHint({
        preferSignedInGoogleAccount: true,
        user: {
          email: "person@example.com",
          accounts: [{ provider: "google" }],
        },
      }),
    ).toBe("person@example.com");
  });

  it("keeps the account chooser for an email and password signup", () => {
    expect(
      getGoogleOnboardingLoginHint({
        preferSignedInGoogleAccount: true,
        user: {
          email: "person@example.com",
          accounts: [{ provider: "credential" }],
        },
      }),
    ).toBeUndefined();
  });

  it("does not force an account outside the onboarding preference", () => {
    expect(
      getGoogleOnboardingLoginHint({
        preferSignedInGoogleAccount: false,
        user: {
          email: "person@example.com",
          accounts: [{ provider: "google" }],
        },
      }),
    ).toBeUndefined();
  });
});
